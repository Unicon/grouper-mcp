#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import https from 'https';
import fs from 'fs';
import { GrouperClient } from './grouper-client.js';
import { GrouperConfig } from './types.js';
import { logger } from './logger.js';
import { toolDefinitions } from './tool-definitions.js';
import { handleTool } from './tool-handlers.js';


const server = new Server(
  {
    name: 'grouper-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

function createGrouperClient(overrideConfig?: Partial<GrouperConfig>): GrouperClient {
  const config: GrouperConfig = {
    baseUrl: process.env.GROUPER_BASE_URL || 'https://grouperdemo.internet2.edu/grouper-ws/servicesRest/json/v4_0_000',
    username: process.env.GROUPER_USERNAME,
    password: process.env.GROUPER_PASSWORD,
    actAsSubjectId: process.env.GROUPER_ACT_AS_SUBJECT_ID,
    actAsSubjectSourceId: process.env.GROUPER_ACT_AS_SUBJECT_SOURCE_ID,
    actAsSubjectIdentifier: process.env.GROUPER_ACT_AS_SUBJECT_IDENTIFIER,
    ...overrideConfig
  };
  return new GrouperClient(config);
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: toolDefinitions,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request, context) => {
  // Extract credentials from session storage or environment
  let credentialsOverride: Partial<GrouperConfig> = {};

  // For HTTP transport, try to find credentials in global session storage
  const sessionCredentials = (global as any).sessionCredentials;
  if (sessionCredentials) {
    // Find credentials for any active session (simplified approach)
    const sessionIds = Object.keys(sessionCredentials);
    if (sessionIds.length > 0) {
      const sessionId = sessionIds[0]; // Use first available session
      credentialsOverride = sessionCredentials[sessionId];
      logger.debug('Using credentials from HTTP session', { sessionId });
    }
  }

  const client = createGrouperClient(credentialsOverride);
  return await handleTool(request, client);
});

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    transport: 'http', // Default to HTTP for Docker containers
    port: 3050,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--transport':
        config.transport = args[++i];
        break;
      case '--port':
        config.port = parseInt(args[++i], 10);
        break;
      case '-h':
      case '--help':
        console.log(`
Usage: grouper-mcp [options]

Options:
  --transport <type>  Transport type (stdio|http) [default: stdio]
  --port <number>     Port for HTTP transport [default: 3050]
  -h, --help          Show this help message
        `);
        process.exit(0);
        break;
    }
  }

  return config;
}

// Store active SSE transports by session ID
const transports: Record<string, SSEServerTransport> = {};

async function startHttpServer(port: number) {
  const app = express();
  app.use(express.json());

  // HTTPS configuration
  const useHttps = process.env.HTTPS_ENABLED === 'true';
  const certPath = process.env.CERT_PATH || '/app/certs/cert.pem';
  const keyPath = process.env.KEY_PATH || '/app/certs/key.pem';

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'grouper-mcp' });
  });

  // OAuth 2.0 Resource Server Metadata endpoint
  app.get('/.well-known/oauth-protected-resource', (req, res) => {
    const protocol = useHttps ? 'https' : 'http';
    res.json({
      resource: `${protocol}://localhost:${port}`,
      authorization_servers: [`${protocol}://localhost:${port}/auth`]
    });
  });

  // SSE endpoint - establishes SSE connection
  app.get('/sse', async (req, res) => {
    try {
      const transport = new SSEServerTransport('/message', res);
      const sessionId = Math.random().toString(36).substring(7);
      transports[sessionId] = transport;

      logger.info('New SSE connection established', { sessionId });

      // Clean up on client disconnect
      req.on('close', () => {
        delete transports[sessionId];
        logger.info('SSE connection closed', { sessionId });
      });

      await server.connect(transport);
    } catch (error) {
      logger.error('Error establishing SSE connection', { error });
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  });

  // Message endpoint - handles POST messages from clients
  app.post('/message', async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];

      if (!transport) {
        return res.status(400).json({ error: 'No transport found for sessionId' });
      }

      // Handle authentication from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [username, password] = decoded.split(':');
          if (username && password) {
            // Store credentials for this session in global state
            // This is a temporary solution - in production you'd use proper session management
            (global as any).sessionCredentials = (global as any).sessionCredentials || {};
            (global as any).sessionCredentials[sessionId] = { username, password };
            logger.debug('Stored credentials for session', { sessionId, username });
          }
        } catch (e) {
          logger.error('Failed to decode authentication token', { error: e });
        }
      }

      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      logger.error('Error handling message', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  if (useHttps) {
    // Check if certificates exist
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      logger.error('HTTPS enabled but certificates not found', { certPath, keyPath });
      console.error('❌ HTTPS certificates not found. Please generate certificates or disable HTTPS.');
      process.exit(1);
    }

    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    https.createServer(httpsOptions, app).listen(port, () => {
      logger.info(`Grouper MCP server running on HTTPS port ${port}`);
      console.log(`🚀 Server running on https://localhost:${port}`);
      console.log(`📊 Health check: https://localhost:${port}/health`);
      console.log(`🔒 OAuth metadata: https://localhost:${port}/.well-known/oauth-protected-resource`);
    });
  } else {
    app.listen(port, () => {
      logger.info(`Grouper MCP server running on HTTP port ${port}`);
      console.log(`🚀 Server running on http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔒 OAuth metadata: http://localhost:${port}/.well-known/oauth-protected-resource`);
    });
  }
}

async function main() {
  const config = parseArgs();

  logger.info('Starting Grouper MCP server', { transport: config.transport, port: config.port });

  if (config.transport === 'http') {
    await startHttpServer(config.port);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Grouper MCP server connected and running on stdio');
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

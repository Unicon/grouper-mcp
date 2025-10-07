#!/usr/bin/env node

import express, { Request, Response } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMCPServer } from './server-core.js';
import { logger } from './logger.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const USE_HTTPS = process.env.USE_HTTPS !== 'false'; // Default to true

// Store transport instances by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Mcp-Session-Id'],
  exposedHeaders: ['Mcp-Session-Id'],
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - Session: ${req.headers['mcp-session-id'] || 'none'}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: transports.size,
  });
});

// Main MCP endpoint
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const isInitializeRequest = body?.method === 'initialize';

    let transport: StreamableHTTPServerTransport;

    if (isInitializeRequest) {
      // Create new session
      logger.info('Initialize request - creating new session');

      const newSessionId = uuidv4();

      const newTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        enableJsonResponse: true,
      });

      // Store the transport
      transports.set(newSessionId, newTransport);
      logger.info(`Session created: ${newSessionId}`);

      // Create new MCP server instance for this session
      const mcpServer = createMCPServer();
      await mcpServer.connect(newTransport);

      transport = newTransport;

    } else {
      // Use existing session
      if (!sessionId) {
        logger.warn('Missing session ID for non-initialize request');
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Missing Mcp-Session-Id header',
          },
          id: body?.id || null,
        });
      }

      const existingTransport = transports.get(sessionId);
      if (!existingTransport) {
        logger.warn(`Session not found: ${sessionId}`);
        return res.status(404).json({
          jsonrpc: '2.0',
          error: {
            code: -32002,
            message: 'Session not found. Please reinitialize.',
          },
          id: body?.id || null,
        });
      }

      transport = existingTransport;
    }

    // Handle the request through the transport
    await transport.handleRequest(req, res, body);

  } catch (error) {
    logger.error('Error handling MCP request:', error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : String(error),
        },
        id: null,
      });
    }
  }
});

// Session deletion endpoint
app.delete('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    return res.status(400).json({
      error: 'Missing Mcp-Session-Id header',
    });
  }

  const deleted = transports.delete(sessionId);

  if (deleted) {
    logger.info(`Session deleted: ${sessionId}`);
    res.status(200).json({ message: 'Session deleted' });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Start server
async function main() {
  if (USE_HTTPS) {
    // Load SSL certificates
    const certPath = process.env.SSL_CERT_PATH || path.join(process.cwd(), 'certs', 'cert.pem');
    const keyPath = process.env.SSL_KEY_PATH || path.join(process.cwd(), 'certs', 'key.pem');

    try {
      const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        logger.info(`Grouper MCP HTTPS server listening on port ${PORT}`);
        logger.info(`Health check: https://localhost:${PORT}/health`);
        logger.info(`MCP endpoint: https://localhost:${PORT}/mcp`);
        logger.info('Using self-signed certificates - clients may need to accept certificate warnings');
      });

    } catch (error) {
      logger.error('Failed to load SSL certificates:', error);
      logger.error('Please run: openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"');
      process.exit(1);
    }

  } else {
    // HTTP mode (not recommended for production)
    app.listen(PORT, () => {
      logger.info(`Grouper MCP HTTP server listening on port ${PORT} (HTTPS disabled)`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`MCP endpoint: http://localhost:${PORT}/mcp`);
      logger.warn('WARNING: Running without HTTPS - not suitable for production use');
    });
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    transports.clear();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    transports.clear();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal error in HTTPS server:', error);
  process.exit(1);
});

# Streamable HTTP Implementation Plan

## Overview

This document outlines the phased approach to converting the Grouper MCP server from stdio transport to Streamable HTTP transport, enabling remote access over HTTPS.

## Implementation Phases

### Phase 1: Local Streamable HTTPS (No Authentication)
**Goal**: Get the MCP server working with Streamable HTTP transport over HTTPS locally without authentication.

**Important**: Most AI agents require HTTPS, so we'll use self-signed certificates for local development.

### Phase 2: Docker Containerization
**Goal**: Package the server in a Docker container for easy deployment.

### Phase 3: OAuth 2.1 Authentication
**Goal**: Add secure OAuth authentication for production use.

---

## Phase 1: Local Streamable HTTPS Implementation

### 1.1 SSL Certificate Setup

Generate self-signed certificates for local HTTPS development:

```bash
# Create certs directory
mkdir -p certs

# Generate private key and certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

**Important**:
- The `certs/` directory is already in `.gitignore` (visible in git status)
- Self-signed certificates will trigger browser warnings - this is expected for local dev
- For production, you'll use proper certificates from Let's Encrypt or your certificate authority

### 1.2 Dependencies

Add required packages:

```bash
npm install express cors uuid
npm install --save-dev @types/express @types/cors @types/uuid
```

**Why these packages:**
- `express`: HTTP/HTTPS server framework
- `cors`: Handle Cross-Origin Resource Sharing headers
- `uuid`: Generate unique session IDs

### 1.3 Project Structure Changes

Create new files:
```
src/
  ├── index.ts                    # Current stdio entry point (keep as-is)
  ├── http-server.ts              # NEW: HTTP server entry point
  ├── server-core.ts              # NEW: Shared MCP server setup
  ├── session-manager.ts          # NEW: Session management
  └── [existing files unchanged]
```

### 1.4 Implementation Steps

#### Step 1: Extract Core Server Logic

**File: `src/server-core.ts`**

Move the MCP server setup logic from `index.ts` into a reusable function:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { GrouperClient } from './grouper-client.js';
import { GrouperConfig } from './types.js';
import { toolDefinitions } from './tool-definitions.js';
import { handleTool } from './tool-handlers.js';

export function createMCPServer() {
  const server = new Server(
    {
      name: 'grouper-mcp',
      version: '0.3.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize Grouper client from environment variables
  const grouperClient = new GrouperClient({
    baseUrl: process.env.GROUPER_BASE_URL || 'https://grouperdemo.internet2.edu/grouper-ws/servicesRest/json/v4_0_000',
    username: process.env.GROUPER_USERNAME,
    password: process.env.GROUPER_PASSWORD,
    actAsSubjectId: process.env.GROUPER_ACT_AS_SUBJECT_ID,
    actAsSubjectSourceId: process.env.GROUPER_ACT_AS_SUBJECT_SOURCE_ID,
    actAsSubjectIdentifier: process.env.GROUPER_ACT_AS_SUBJECT_IDENTIFIER,
  });

  // Register handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: toolDefinitions };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await handleTool(request, grouperClient);
  });

  return server;
}
```

**Why**: This allows us to reuse the same MCP server logic for both stdio and HTTP transports.

---

#### Step 2: Create Session Manager

**File: `src/session-manager.ts`**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

interface Session {
  id: string;
  transport: Transport;
  createdAt: Date;
  lastAccessedAt: Date;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private maxIdleMinutes: number = 30,
    private cleanupIntervalMinutes: number = 5
  ) {
    // Periodically clean up idle sessions
    this.cleanupInterval = setInterval(
      () => this.cleanupIdleSessions(),
      cleanupIntervalMinutes * 60 * 1000
    );
  }

  createSession(transport: Transport): string {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      transport,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    logger.info(`Session created: ${sessionId}`);
    return sessionId;
  }

  getSession(sessionId: string): Transport | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = new Date();
      return session.transport;
    }
    return null;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.info(`Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  private cleanupIdleSessions(): void {
    const now = new Date();
    const maxIdleMs = this.maxIdleMinutes * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      const idleMs = now.getTime() - session.lastAccessedAt.getTime();
      if (idleMs > maxIdleMs) {
        this.sessions.delete(sessionId);
        logger.info(`Session expired due to inactivity: ${sessionId}`);
      }
    }
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  shutdown(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}
```

**Why**: Sessions are required by the Streamable HTTP spec. This manager handles session lifecycle, including automatic cleanup of idle sessions.

---

#### Step 3: Create HTTPS Server

**File: `src/http-server.ts`**

```typescript
#!/usr/bin/env node

import express, { Request, Response } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMCPServer } from './server-core.js';
import { SessionManager } from './session-manager.js';
import { logger } from './logger.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const USE_HTTPS = process.env.USE_HTTPS !== 'false'; // Default to true
const sessionManager = new SessionManager();

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
    activeSessions: sessionManager.getSessionCount(),
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

      const newTransport = new StreamableHTTPServerTransport({
        enableJsonResponse: true,
        eventSourceEnabled: true,
      });

      const newSessionId = sessionManager.createSession(newTransport);

      // Create new MCP server instance for this session
      const mcpServer = createMCPServer();
      await mcpServer.connect(newTransport);

      res.setHeader('Mcp-Session-Id', newSessionId);
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

      const existingTransport = sessionManager.getSession(sessionId);
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

      transport = existingTransport as StreamableHTTPServerTransport;
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

  const deleted = sessionManager.deleteSession(sessionId);

  if (deleted) {
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
    sessionManager.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    sessionManager.shutdown();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal error in HTTPS server:', error);
  process.exit(1);
});
```

**Why**: This server supports both HTTPS (default, required by most AI agents) and HTTP (fallback for testing). It loads SSL certificates from the `certs/` directory.

---

#### Step 4: Update stdio Entry Point

**File: `src/index.ts`** (refactored)

```typescript
#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMCPServer } from './server-core.js';
import { logger } from './logger.js';

async function main() {
  logger.info('Starting Grouper MCP server (stdio)');

  const server = createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  logger.info('Grouper MCP server connected and running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
```

**Why**: Keeps stdio transport working while sharing the core server logic.

---

### 1.5 Build Configuration

**Update `package.json`:**

```json
{
  "name": "grouper-mcp",
  "version": "0.3.0",
  "description": "MCP server for Grouper web services integration",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "start:http": "node dist/http-server.js",
    "dev": "tsx src/index.ts",
    "dev:http": "tsx src/http-server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/uuid": "^9.0.8",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

### 1.6 Environment Variables

**Update `.env` (example):**

```bash
# Grouper Configuration (unchanged)
GROUPER_BASE_URL=https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000
GROUPER_USERNAME=your_username
GROUPER_PASSWORD=your_password

# HTTPS Server Configuration (new)
PORT=3000
USE_HTTPS=true                         # Set to false to disable HTTPS (not recommended)
SSL_CERT_PATH=/path/to/cert.pem        # Optional: Override default cert location
SSL_KEY_PATH=/path/to/key.pem          # Optional: Override default key location

# Logging (unchanged)
GROUPER_DEBUG=true
GROUPER_LOG_DIR=~/.grouper-mcp/logs/
```

---

### 1.7 Testing the HTTPS Server

#### Step 1: Generate SSL Certificates

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
```

#### Step 2: Start the server

```bash
# Development mode
npm run dev:http

# Production mode
npm run build
npm run start:http
```

#### Step 3: Test with curl

```bash
# Health check (use -k to accept self-signed certificate)
curl -k https://localhost:3000/health

# Initialize session
curl -k -X POST https://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }' \
  -i
```

Look for the `Mcp-Session-Id` header in the response, then use it for subsequent requests.

**Note**: The `-k` flag tells curl to accept self-signed certificates. AI agents may require you to configure them to accept self-signed certificates as well.

---

### 1.8 Client Configuration

For MCP clients that support Streamable HTTP (once implemented):

```json
{
  "mcpServers": {
    "grouper-https": {
      "url": "https://localhost:3000/mcp",
      "transport": "streamable-http",
      "allowSelfSignedCerts": true
    }
  }
}
```

Or use the `mcp-remote` bridge from stdio clients:

```json
{
  "mcpServers": {
    "grouper-https": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://localhost:3000/mcp",
        "--transport", "http-only"
      ],
      "env": {
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

**Note**: `NODE_TLS_REJECT_UNAUTHORIZED=0` disables certificate verification for self-signed certs. Remove this in production with proper certificates.

---

### 1.9 Verification Checklist

- [ ] SSL certificates generated in `certs/` directory
- [ ] Dependencies installed (`express`, `cors`, `uuid`)
- [ ] New files created (`server-core.ts`, `session-manager.ts`, `http-server.ts`)
- [ ] `index.ts` refactored to use `server-core.ts`
- [ ] `package.json` updated with new scripts and dependencies
- [ ] Server starts with HTTPS: `npm run dev:http`
- [ ] Health endpoint works: `curl -k https://localhost:3000/health`
- [ ] Initialize request creates session and returns `Mcp-Session-Id`
- [ ] Subsequent requests with session ID work correctly
- [ ] stdio transport still works: `npm run dev`
- [ ] Logs show HTTPS server listening message

---

## Success Criteria for Phase 1

✅ HTTPS server starts and listens on configured port
✅ Self-signed SSL certificates work correctly
✅ Sessions are created on initialize requests
✅ Session IDs are returned in headers
✅ Subsequent requests use existing sessions
✅ All existing Grouper tools work via HTTPS transport
✅ Stdio transport remains functional
✅ Logs show request/response activity
✅ Idle sessions are cleaned up automatically
✅ AI agents can connect via HTTPS (with self-signed cert configuration)

---

## Next: Phase 2 - Docker Containerization

(To be documented after Phase 1 completion)

## Next: Phase 3 - OAuth 2.1 Authentication

(To be documented after Phase 2 completion)

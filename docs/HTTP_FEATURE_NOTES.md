# Converting MCP from stdio to HTTP/SSE - Documentation Guide

## Overview

This guide documents the process and resources for converting a Model Context Protocol (MCP) server from stdio transport to HTTP/SSE transport for remote access. This enables AI agents to access your MCP server over the internet rather than requiring local installation.

## Quick Start: MCPO Proxy (Recommended for Testing & Simple Deployments)

For most use cases, you don't need to implement HTTP/SSE transport yourself. **[MCPO (MCP-to-OpenAPI Proxy)](https://github.com/open-webui/mcpo)** is a zero-code solution that wraps any stdio MCP server with an HTTP/SSE interface.

### Why Use MCPO?

- **No code changes required** - Works with existing stdio MCP servers
- **Instant HTTP API** - Automatic OpenAPI documentation generation
- **Built-in authentication** - API key support out of the box
- **Production ready** - Used by thousands of MCP deployments

### All-in-One Docker Image (Easiest Option)

The grouper-mcp project provides a pre-configured Docker image with both the MCP server and MCPO built-in:

```bash
# Build the HTTP-enabled image
docker build -f Dockerfile.http -t grouper-mcp:http .

# Run with HTTP access
docker run -p 8000:8000 \
  -e GROUPER_BASE_URL=https://your-instance.edu/grouper-ws/servicesRest/json/v4_0_000 \
  -e GROUPER_USERNAME=your_username \
  -e GROUPER_PASSWORD=your_password \
  -e MCPO_API_KEY=your-secret-key \
  -e GROUPER_DEBUG=true \
  grouper-mcp:http

# Access your API
curl -X POST http://localhost:8000/grouper_find_groups_by_name_approximate \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "engineering"}'

# View interactive docs
open http://localhost:8000/docs
```

### Separate MCPO Installation

Alternatively, run MCPO separately if you need more control:

```bash
# Install and run (using the existing grouper-mcp Docker image)
uvx mcpo --port 8000 --api-key "your-secret-key" -- \
  docker run -i --rm \
    -e GROUPER_BASE_URL=https://your-instance.edu/grouper-ws/servicesRest/json/v4_0_000 \
    -e GROUPER_USERNAME=your_username \
    -e GROUPER_PASSWORD=your_password \
    -e GROUPER_DEBUG=true \
    grouper-mcp:latest
```

See the main [README.md](../README.md#exposing-via-httpsse-with-mcpo) for complete MCPO usage documentation.

### When to Use MCPO vs Custom Implementation

**Use MCPO when:**
- You want quick HTTP access without code changes
- You need simple API key authentication
- You're testing or prototyping
- You don't need complex per-user authorization logic

**Build custom HTTP/SSE when:**
- You need OAuth 2.1 integration with existing identity providers
- You require per-user access control tied to Grouper permissions
- You want to customize authentication/authorization logic
- You're building a production service with complex requirements

---

## Building Custom HTTP/SSE Transport (Advanced)

The rest of this document covers building a custom HTTP/SSE implementation from scratch. This is only necessary if MCPO doesn't meet your requirements.

## Key Differences: Local vs Remote MCP Servers

### Local MCP Servers (stdio)
- **Transport**: Standard Input/Output (stdio)
- **Setup**: Users download and run server locally
- **Configuration**: Local JSON config files (e.g., `claude_desktop_config.json`)
- **Updates**: Manual download and installation
- **Access**: Desktop applications only
- **Authentication**: API keys in local environment variables

### Remote MCP Servers (HTTP/SSE)
- **Transport**: HTTP POST requests + Server-Sent Events
- **Setup**: No local installation required
- **Configuration**: OAuth web flow through AI client UI
- **Updates**: Automatic - changes deploy immediately
- **Access**: Any device with internet access
- **Authentication**: OAuth 2.1 with PKCE

## Transport Protocols

### Modern: Streamable HTTP (2025-03-26 spec)
- **Endpoints**: Single `/mcp` endpoint for all operations
- **Session Management**: Via `Mcp-Session-Id` header
- **Benefits**: Simpler implementation, stateless HTTP
- **Termination**: `DELETE /mcp` for cleanup

### Legacy: HTTP+SSE (2024-11-05 spec)
- **Endpoints**: Dual endpoints - `GET /mcp` for SSE stream, `POST /messages` for requests
- **Session Management**: Via query parameters (`?sessionId=xxx`)
- **Benefits**: Compatible with older clients
- **Complexity**: Higher - requires managing persistent SSE connections

## Required Documentation Resources

### Primary Resources

1. **"How to MCP - The Complete Guide"** - https://simplescraper.io/blog/how-to-mcp
   - Most comprehensive practical guide
   - Complete OAuth 2.1 implementation examples
   - Session management patterns
   - Production deployment guidance

2. **Official MCP Specification** - https://modelcontextprotocol.io/specification/2025-03-26/basic/transports
   - Technical reference for transport protocols
   - Message format specifications
   - Protocol compliance requirements

3. **Cloudflare Remote MCP Guide** - https://blog.cloudflare.com/remote-model-context-protocol-servers-mcp/
   - Cloud deployment patterns
   - Built-in OAuth support examples

### Additional Resources

- **MCP Inspector**: https://github.com/modelcontextprotocol/inspector (Testing tool)
- **MCP SDK Documentation**: https://github.com/modelcontextprotocol/sdk
- **OAuth 2.1 Specification**: https://oauth.net/2.1/

## Implementation Steps

### 1. Server Infrastructure Setup

Replace stdio transport with HTTP server:

```javascript
// Before (stdio)
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const transport = new StdioServerTransport();

// After (HTTP)
import express from 'express';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const app = express();
const port = process.env.PORT || 3000;
```

### 2. Add Required Middleware

```javascript
// JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
  res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id, WWW-Authenticate');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
```

### 3. Implement OAuth 2.1 Endpoints

Required OAuth endpoints for MCP compliance:

```javascript
// OAuth discovery endpoints
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    authorization_servers: [{
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
    }]
  });
});

app.get('/.well-known/oauth-authorization-server', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/authorize`,
    token_endpoint: `${baseUrl}/token`,
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["grouper"],
    response_types_supported: ["code"],
    code_challenge_methods_supported: ["S256"] // PKCE required
  });
});

// Authentication flow endpoints
app.get('/authorize', (req, res) => {
  // Serve login page HTML
});

app.get('/callback', (req, res) => {
  // Handle OAuth callback after user authentication
});

app.post('/token', (req, res) => {
  // Exchange authorization code for access token
});
```

### 4. Session Management Implementation

```javascript
const transports = {}; // Store active transport instances
const pendingTransports = {}; // Track transports being created

// Helper function to create and connect transport
async function createAndConnectTransport(sessionId, mcpServer, transports) {
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    eventSourceEnabled: true
  });
  
  transport.sessionId = sessionId;
  transports[sessionId] = transport;
  
  await mcpServer.connect(transport);
  return transport;
}
```

### 5. Main MCP Endpoint Implementation

```javascript
// Modern Streamable HTTP endpoint
app.post('/mcp', async (req, res) => {
  const body = req.body;
  const rpcId = body?.id || null;

  // Authenticate Bearer token
  const authResult = await authenticateToken(req, res, rpcId);
  if (!authResult.success) {
    return authResult.response;
  }

  // Session management
  const sessionId = req.headers['mcp-session-id'];
  const isInitRequest = body?.method === 'initialize';
  
  let transport;
  if (isInitRequest) {
    // Create new session
    const newSessionId = uuidv4();
    transport = await createAndConnectTransport(newSessionId, mcpServer, transports);
    res.setHeader('Mcp-Session-Id', newSessionId);
  } else {
    // Use existing session
    transport = transports[sessionId];
    if (!transport) {
      return res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session not found' },
        id: rpcId
      });
    }
  }

  // Handle request through transport
  await transport.handleRequest(req, res, body);
});
```

### 6. Authentication Implementation

```javascript
async function authenticateToken(req, res, rpcId) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  if (!token) {
    const wwwAuthHeader = `Bearer realm="MCP Server", resource_metadata_uri="${baseUrl}/.well-known/oauth-protected-resource"`;
    return {
      success: false,
      response: res.status(401)
        .header('WWW-Authenticate', wwwAuthHeader)
        .json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Missing Bearer token' },
          id: rpcId
        })
    };
  }

  // Verify token (implement your token validation logic)
  const tokenData = await validateToken(token);
  
  return {
    success: true,
    authObject: {
      token: token,
      clientId: tokenData.client_id,
      scopes: tokenData.scopes || []
    }
  };
}
```

## Tool Handler Modifications

Your existing Grouper tool handlers need minimal changes. The main difference is access to authentication context:

```javascript
// Tool handler with authentication context
server.tool("grouper_get_members", 
  { groupName: z.string() },
  async (params, { authInfo }) => {
    // authInfo contains: token, clientId, scopes
    
    // Use authInfo to implement per-user access control
    if (!authInfo?.scopes?.includes("grouper:read")) {
      throw new Error("Insufficient permissions");
    }
    
    // Your existing Grouper logic remains the same
    const members = await getGroupMembers(params.groupName);
    return {
      content: [{ type: "text", text: JSON.stringify(members) }]
    };
  }
);
```

## Deployment Options

### Recommended Platforms

1. **Google Cloud Run**
   - Serverless with automatic scaling
   - Works well with Firebase Auth
   - `gcloud run deploy mcp-server --source . --allow-unauthenticated`

2. **Vercel**
   - Zero-configuration deployment
   - Excellent Node.js support
   - Built-in global CDN

3. **Railway**
   - Simple GitHub integration
   - Built-in database options

4. **Digital Ocean App Platform**
   - Managed SSL certificates
   - Good for small-medium applications

### Deployment Considerations

- **Environment Variables**: Store secrets securely
- **HTTPS Required**: All MCP remote servers must use HTTPS
- **CORS Configuration**: Ensure proper cross-origin headers
- **Session Storage**: Consider Redis for multi-instance deployments

## Testing Your Implementation

### Using mcp-remote for Local Testing

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "grouper-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote", 
        "https://your-server.com/mcp",
        "--header", "Authorization:${AUTH_HEADER}",
        "--transport", "http-only"
      ],
      "env": {
        "AUTH_HEADER": "Bearer your-token-here"
      }
    }
  }
}
```

### Testing Tools

- **MCP Inspector**: GitHub tool for debugging MCP servers
- **Cloudflare AI Playground**: Web interface for testing remote MCP servers
- **Claude Desktop**: With mcp-remote bridge for local testing

## Common Error Codes

| Code | Description | Common Cause | Solution |
|------|-------------|--------------|----------|
| -32000 | Authentication Error | Missing/invalid token | Check WWW-Authenticate header |
| -32001 | Invalid Session | Session ID not found | Client should reinitialize |
| -32002 | Method Not Found | Unknown MCP method | Verify method implementation |
| -32003 | Invalid Parameters | Bad request parameters | Validate input parameters |
| -32004 | Internal Error | Server exception | Check server logs |

## Security Considerations

### OAuth 2.1 with PKCE
- Always implement PKCE (Proof Key for Code Exchange)
- Use S256 code challenge method
- Validate code_verifier against stored code_challenge

### Token Management
- Use secure token generation (UUIDs)
- Implement token expiration
- Store tokens securely (database, not memory for production)

### CORS and Headers
- Restrict origins in production
- Always validate Authorization headers
- Use HTTPS only in production

## Benefits of HTTP/SSE Conversion

### For Users
- **No Installation**: Access from any device with internet
- **Automatic Updates**: Changes deploy immediately
- **Cross-Platform**: Works with web, mobile, and desktop AI clients
- **Secure Authentication**: Standard OAuth flow

### For Developers
- **Centralized Deployment**: Single server instance
- **Better Analytics**: Track usage and performance
- **Scalability**: Handle multiple concurrent users
- **Standard Protocol**: Compatible with OAuth ecosystem

## Migration Checklist

- [ ] Set up Express.js HTTP server
- [ ] Implement OAuth 2.1 endpoints with PKCE
- [ ] Add session management system
- [ ] Convert stdio transport to HTTP transports
- [ ] Implement authentication middleware
- [ ] Add CORS and security headers
- [ ] Test with mcp-remote locally
- [ ] Deploy to cloud platform
- [ ] Configure HTTPS and domain
- [ ] Test with AI clients
- [ ] Monitor and debug production issues

## Next Steps

1. **Start with SimpleScraper Guide**: Follow the complete implementation example
2. **Implement Minimal OAuth**: Begin with basic authentication flow
3. **Test Locally**: Use mcp-remote for initial testing
4. **Deploy and Iterate**: Start simple, add features incrementally
5. **Monitor Usage**: Add logging and analytics for production

---

*This documentation is based on MCP specification 2025-03-26 and current best practices as of August 2025.*
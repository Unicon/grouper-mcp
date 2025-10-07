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

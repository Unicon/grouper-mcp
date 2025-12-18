#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GrouperClient } from './grouper-client.js';
import { GrouperConfig } from './types.js';
import { logger } from './logger.js';
import { toolDefinitions } from './tool-definitions.js';
import { handleTool } from './tool-handlers.js';
import { isReadOnlyMode, isWriteTool } from './utils.js';
import packageJson from '../package.json' assert { type: 'json' };


const server = new Server(
  {
    name: packageJson.name,
    version: packageJson.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let grouperClient: GrouperClient | null = null;

function initializeGrouperClient(): GrouperClient {
  if (!grouperClient) {
    const config: GrouperConfig = {
      baseUrl: process.env.GROUPER_BASE_URL || 'https://grouperdemo.internet2.edu/grouper-ws/servicesRest/json/v4_0_000',
      username: process.env.GROUPER_USERNAME,
      password: process.env.GROUPER_PASSWORD,
      actAsSubjectId: process.env.GROUPER_ACT_AS_SUBJECT_ID,
      actAsSubjectSourceId: process.env.GROUPER_ACT_AS_SUBJECT_SOURCE_ID,
      actAsSubjectIdentifier: process.env.GROUPER_ACT_AS_SUBJECT_IDENTIFIER,
    };
    grouperClient = new GrouperClient(config);
  }
  return grouperClient;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Filter out write tools when in read-only mode
  const availableTools = isReadOnlyMode()
    ? toolDefinitions.filter(tool => !isWriteTool(tool.name))
    : toolDefinitions;

  logger.info(`Listing tools (READ_ONLY=${isReadOnlyMode()})`, {
    totalTools: toolDefinitions.length,
    availableTools: availableTools.length
  });

  return {
    tools: availableTools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = initializeGrouperClient();
  return await handleTool(request, client);
});

async function main() {
  logger.info('Starting Grouper MCP server');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Grouper MCP server connected and running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

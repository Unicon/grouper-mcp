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

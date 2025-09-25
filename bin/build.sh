#!/bin/bash
set -e

echo "Building Grouper MCP Docker image..."
docker build -t grouper-mcp .
echo "✅ Build complete! Image tagged as 'grouper-mcp'"
echo ""
echo "✅ Supports stdio, HTTP, and HTTPS transports"
echo "🐳 HTTP: ./bin/run.sh (port 3050)"
echo "🔒 HTTPS: ./bin/run.sh --https (port 3443)"
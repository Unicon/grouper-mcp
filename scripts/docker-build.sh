#!/bin/bash
set -e

echo "======================================"
echo "Building Grouper MCP Docker Image"
echo "======================================"

# Build production image
echo "Building production image..."
docker build -t grouper-mcp:latest -f Dockerfile .

echo ""
echo "✅ Build complete!"
echo ""
docker images grouper-mcp:latest

echo ""
echo "To run: docker-compose up -d"
echo "Or use: npm run docker:up"

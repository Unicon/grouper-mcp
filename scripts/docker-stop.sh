#!/bin/bash
set -e

echo "======================================"
echo "Stopping Grouper MCP Server (Docker)"
echo "======================================"

docker-compose down

echo ""
echo "✅ Server stopped"
echo ""
echo "To remove volumes: docker-compose down -v"
echo "To start again: docker-compose up -d"
echo "   Or use: npm run docker:up"

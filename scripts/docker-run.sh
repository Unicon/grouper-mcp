#!/bin/bash
set -e

echo "======================================"
echo "Starting Grouper MCP Server (Docker)"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "📝 Copy .env.example to .env and configure it first:"
    echo "   cp .env.example .env"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f certs/cert.pem ] || [ ! -f certs/key.pem ]; then
    echo "❌ Error: SSL certificates not found in certs/"
    echo "📝 Generate self-signed certificates:"
    echo "   mkdir -p certs"
    echo "   openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj '/CN=localhost'"
    exit 1
fi

echo "✅ Configuration validated"
echo ""
echo "Starting server with Docker Compose..."
docker-compose up -d

echo ""
echo "✅ Server started!"
echo ""
echo "📊 Health check: curl -k https://localhost:3000/health"
echo "📋 View logs: docker-compose logs -f"
echo "🛑 Stop server: docker-compose down"
echo "   Or use: npm run docker:down"

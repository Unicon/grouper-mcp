#!/bin/bash
set -e

# Default values
PORT=3050
GROUPER_BASE_URL=${GROUPER_BASE_URL:-"https://grouperdemo.internet2.edu/grouper-ws/servicesRest/json/v4_0_000"}
GROUPER_DEBUG=${GROUPER_DEBUG:-"true"}
NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED:-"0"}
DETACHED=true
HTTPS_ENABLED=${HTTPS_ENABLED:-"false"}
HTTPS_PORT=3443

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -u|--url)
      GROUPER_BASE_URL="$2"
      shift 2
      ;;
    --no-debug)
      GROUPER_DEBUG="false"
      shift
      ;;
    -f|--foreground)
      DETACHED=false
      shift
      ;;
    --https)
      HTTPS_ENABLED="true"
      PORT=$HTTPS_PORT
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -p, --port PORT           Port to run on (default: 3050 HTTP, 3443 HTTPS)"
      echo "  -u, --url URL            Grouper base URL"
      echo "      --no-debug           Disable debug mode"
      echo "  -f, --foreground         Run in foreground (default: detached)"
      echo "      --https              Enable HTTPS mode (requires certificates)"
      echo "  -h, --help               Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  GROUPER_BASE_URL         Grouper instance URL"
      echo "  GROUPER_DEBUG            Enable debug logging (default: true)"
      echo "  NODE_TLS_REJECT_UNAUTHORIZED  Accept self-signed certs (default: 0)"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo "Starting Grouper MCP server..."
echo "Port: $PORT"
echo "Grouper URL: $GROUPER_BASE_URL"
echo "Debug: $GROUPER_DEBUG"
echo ""

# Build docker command
DOCKER_CMD="docker run --rm -p ${PORT}:3050 \
  -e GROUPER_BASE_URL=${GROUPER_BASE_URL} \
  -e GROUPER_DEBUG=${GROUPER_DEBUG} \
  -e NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED} \
  -e HTTPS_ENABLED=${HTTPS_ENABLED}"

if [ "$DETACHED" = "true" ]; then
  DOCKER_CMD="$DOCKER_CMD -d --name grouper-mcp-${PORT}"
fi

DOCKER_CMD="$DOCKER_CMD grouper-mcp"

# Run the container
eval $DOCKER_CMD

if [ "$DETACHED" = "true" ]; then
  PROTOCOL="http"
  if [ "$HTTPS_ENABLED" = "true" ]; then
    PROTOCOL="https"
  fi

  if [ "$GROUPER_DEBUG" = "true" ]; then
    echo "🚀 Container started in background on ${PROTOCOL}://localhost:${PORT} (debug mode enabled)"
  else
    echo "🚀 Container started in background on ${PROTOCOL}://localhost:${PORT}"
  fi
  echo ""
  echo "📊 Health check: ${PROTOCOL}://localhost:${PORT}/health"
  echo "🔒 OAuth metadata: ${PROTOCOL}://localhost:${PORT}/.well-known/oauth-protected-resource"
  echo ""
  echo "💡 Configure Claude Desktop with:"
  echo "   {\"url\": \"${PROTOCOL}://localhost:${PORT}\", \"auth\": {\"type\": \"bearer\", \"token\": \"base64(user:pass)\"}}"
  echo ""
  echo "📋 Container name: grouper-mcp-${PORT}"
  echo "🛑 To stop: docker stop grouper-mcp-${PORT}"
  echo "📜 To view logs: docker logs -f grouper-mcp-${PORT}"
fi
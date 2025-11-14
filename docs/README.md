# Documentation

This directory contains comprehensive documentation for the Grouper MCP server project.

## 📚 Documentation Files

### Setup Guides

#### [🖥️ SETUP_CLAUDE_DESKTOP.md](SETUP_CLAUDE_DESKTOP.md)
**Claude Desktop Integration Guide**

Complete setup instructions for using grouper-mcp with Claude Desktop including:
- Docker and local installation methods
- Configuration file locations for macOS, Windows, Linux
- Environment variable configuration
- Troubleshooting common issues
- Read-only mode setup

*Start here if you're integrating with Claude Desktop.*

---

#### [🌐 SETUP_OPEN_WEBUI.md](SETUP_OPEN_WEBUI.md)
**Open WebUI Integration Guide**

Step-by-step guide for integrating with Open WebUI including:
- MCPO proxy setup (required for Open WebUI)
- All-in-one Docker image usage
- Configuration in Open WebUI interface
- Special characters workaround
- Production deployment considerations

*Essential for Open WebUI users (v0.6.31+).*

---

#### [🔌 SETUP_HTTP.md](SETUP_HTTP.md)
**HTTP/SSE Access with MCPO**

Comprehensive guide for exposing grouper-mcp via HTTP including:
- All-in-one Docker image with built-in MCPO
- Separate MCPO installation options
- RESTful API usage and examples
- Production deployment with reverse proxy (nginx, Caddy)
- Advanced configuration and multiple server setups

*Reference for HTTP-based integrations and API access.*

---

#### [⚙️ CONFIGURATION.md](CONFIGURATION.md)
**Configuration Reference**

Complete configuration documentation including:
- All environment variables (required and optional)
- Properties file configuration for immutable deployments
- Read-only mode details and tool lists
- Logging configuration and locations
- TLS/SSL certificate handling
- Act-as functionality for administrative operations
- Security best practices

*Authoritative reference for all configuration options.*

---

### Core Documentation

#### [🛠️ TOOLS.md](TOOLS.md)
**Comprehensive API Reference for MCP Tools**

Complete documentation of all 19 available MCP tools including:
- Detailed parameter specifications and types
- Usage examples for each tool
- Response format documentation
- Error handling information
- Best practices and important notes

*Essential reading for users wanting to understand what operations are available and how to use them.*

---

#### [📋 TODO.md](TODO.md)
**Planned Features and Development Roadmap**

Track of planned features, improvements, and development tasks including:
- Additional Grouper web service endpoints to implement
- Testing infrastructure plans
- Enhancement ideas

*Reference for contributors and users interested in upcoming functionality.*

---

### Technical Documentation

#### [🏗️ DESIGN_DECISIONS.md](DESIGN_DECISIONS.md)
**Architectural Decisions and Design Rationale**

Documentation of key design decisions and architectural choices including:
- Technology stack justification
- Design patterns and approaches
- Trade-offs and alternatives considered
- Rationale behind implementation choices

*Important for understanding the "why" behind the codebase architecture.*

---

#### [🌐 HTTP_FEATURE_NOTES.md](HTTP_FEATURE_NOTES.md)
**HTTP Transport Implementation Guide**

Detailed technical documentation for HTTP transport functionality including:
- **MCPO Proxy Setup** - Quick, zero-code HTTP/SSE exposure (recommended)
- Implementation requirements for custom HTTP transport
- Transport layer configuration options
- Authentication mechanisms (OAuth 2.1, API keys)
- Deployment scenarios and best practices
- Migration guide from stdio to HTTP transport

*Technical reference for HTTP transport setup and configuration. Start with MCPO for quick deployment.*

---

### Reference Materials

#### [📖 grouper-swagger-v4.json](grouper-swagger-v4.json)
**Grouper Web Services API Specification**

Complete OpenAPI/Swagger specification for Grouper v4.0.000 web services including:
- All available endpoints and operations
- Request/response schemas and data models
- Query parameters and filtering options
- Authentication requirements
- Field descriptions and validation rules

*Authoritative reference for the underlying Grouper API that this MCP server interfaces with.*

---

## 🗂️ Documentation Organization

### For Users
- **Claude Desktop Setup**: [SETUP_CLAUDE_DESKTOP.md](SETUP_CLAUDE_DESKTOP.md) - Integrate with Claude Desktop
- **Open WebUI Setup**: [SETUP_OPEN_WEBUI.md](SETUP_OPEN_WEBUI.md) - Integrate with Open WebUI
- **HTTP Access**: [SETUP_HTTP.md](SETUP_HTTP.md) - Expose as HTTP API using MCPO
- **Configuration**: [CONFIGURATION.md](CONFIGURATION.md) - All configuration options
- **Available Tools**: [TOOLS.md](TOOLS.md) - Learn what operations are available
- **Future Features**: [TODO.md](TODO.md) - See what's coming next

### For Developers
- **Architecture**: [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md) - Understand design rationale
- **HTTP Setup**: [HTTP_FEATURE_NOTES.md](HTTP_FEATURE_NOTES.md) - Configure HTTP transport
- **Development**: [TODO.md](TODO.md) - See planned features and testing needs

### For Contributors
- **Development Roadmap**: [TODO.md](TODO.md) - Find areas to contribute
- **API Reference**: [grouper-swagger-v4.json](grouper-swagger-v4.json) - Understand Grouper capabilities
- **Tool Documentation**: [TOOLS.md](TOOLS.md) - Document new tools consistently

---

## 📝 Documentation Standards

When contributing to documentation:

- **Use clear, descriptive headings** with emoji icons for visual organization
- **Include practical examples** where applicable
- **Specify required vs optional parameters** clearly
- **Document error conditions** and troubleshooting steps
- **Keep examples realistic** and based on common use cases
- **Update this README** when adding new documentation files

---

## 🔗 Related Documentation

- **Main README**: [../README.md](../README.md) - Project overview and quick start
- **Source Code**: [../src/](../src/) - Implementation details and inline documentation
- **Configuration**: [../package.json](../package.json) - Dependencies and scripts
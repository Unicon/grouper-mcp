# Documentation

This directory contains comprehensive documentation for the Grouper MCP server project.

## 📚 Documentation Files

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
- Read-only mode configuration
- Additional Grouper web service endpoints to implement
- Testing infrastructure plans
- 🚧 HTTP/HTTPS protocol support (work in progress)

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
- Implementation requirements and considerations
- Transport layer configuration options
- Authentication mechanisms
- Deployment scenarios and best practices
- Migration guide from stdio to HTTP transport

*Technical reference for HTTP transport setup and configuration.*

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
- **Start with**: [TOOLS.md](TOOLS.md) - Learn what operations are available
- **Reference**: [grouper-swagger-v4.json](grouper-swagger-v4.json) - Understand underlying API capabilities
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
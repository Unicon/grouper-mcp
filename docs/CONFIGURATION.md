# Configuration Guide

This guide covers all configuration options for the Grouper MCP server.

## Configuration Methods

The server supports two configuration methods with the following priority:

1. **Properties file** (`config/grouper-mcp.properties`) - Highest priority, cannot be overridden
2. **Environment variables** - Used if no properties file exists or setting not defined in file
3. **Defaults** - Built-in default values

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GROUPER_BASE_URL` | Full URL to Grouper web services endpoint | `https://grouper.example.edu/grouper-ws/servicesRest/json/v4_0_000` |
| `GROUPER_USERNAME` | Grouper authentication username | `grouper_admin` |
| `GROUPER_PASSWORD` | Grouper authentication password | `your_password` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROUPER_DEBUG` | Enable detailed debug logging | `false` |
| `READ_ONLY` | Enable read-only mode (blocks write operations) | `false` |
| `GROUPER_LOG_DIR` | Custom log directory path | `~/.grouper-mcp/logs/` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | TLS certificate validation (set to `0` for self-signed certs) | `1` |
| `GROUPER_ACT_AS_SUBJECT_ID` | Act as different subject for administrative operations | - |
| `GROUPER_ACT_AS_SUBJECT_SOURCE_ID` | Source ID for act-as subject | - |
| `GROUPER_ACT_AS_SUBJECT_IDENTIFIER` | Identifier for act-as subject | - |

### MCPO-Specific Variables

(Only applicable when using HTTP-enabled Docker image or separate MCPO installation)

| Variable | Description | Default |
|----------|-------------|---------|
| `MCPO_API_KEY` | API key for HTTP authentication | `change-me-in-production` |
| `MCPO_PORT` | HTTP port for MCPO to listen on | `8000` |
| `MCPO_HOST` | Bind address for MCPO | `0.0.0.0` |

### Example Configuration

```bash
# Required
export GROUPER_BASE_URL="https://grouper.example.edu/grouper-ws/servicesRest/json/v4_0_000"
export GROUPER_USERNAME="grouper_admin"
export GROUPER_PASSWORD="your_password"

# Optional - Recommended for development
export GROUPER_DEBUG="true"
export NODE_TLS_REJECT_UNAUTHORIZED="0"  # Only for dev with self-signed certs!

# Optional - Read-only mode
export READ_ONLY="true"

# Optional - Custom log location
export GROUPER_LOG_DIR="/var/log/grouper-mcp"

# Optional - Act as another subject
export GROUPER_ACT_AS_SUBJECT_ID="admin_subject"
```

## Properties File Configuration

For production deployments or immutable configuration:

### Creating Properties File

```bash
# Copy example file
cp config/grouper-mcp.properties.example config/grouper-mcp.properties

# Edit the file
nano config/grouper-mcp.properties
```

### Properties File Format

```properties
# Read-only mode
grouper-mcp.readOnly=true

# Add other properties as needed
```

### Using with Docker

```bash
# Build image with properties file
docker build -t grouper-mcp:configured .

# Run - properties file settings cannot be overridden
docker run -i \
  -e GROUPER_BASE_URL="..." \
  -e GROUPER_USERNAME="..." \
  -e GROUPER_PASSWORD="..." \
  grouper-mcp:configured
```

### Benefits

- **Immutable**: Cannot be changed at runtime
- **Secure**: Prevents accidental configuration changes
- **Specialized builds**: Create read-only or custom-configured images

## Read-Only Mode

Read-only mode restricts the server to read operations only, blocking all write operations.

### Use Cases

- **Production monitoring**: Query Grouper without risk of changes
- **Auditing**: Safe access for compliance and reporting
- **Multiple instances**: Some instances read-only, others read-write
- **Training/demo**: Provide access without modification risk

### Configuration

**Via environment variable:**
```bash
export READ_ONLY="true"
```

**Via properties file:**
```properties
grouper-mcp.readOnly=true
```

### Behavior

When read-only mode is enabled:

✅ **Available operations:**
- Search for groups and stems
- Get group/stem details
- Get group members
- Get subject information
- Search subjects
- Get subject's group memberships

❌ **Blocked operations:**
- Create/update/delete groups
- Add/remove members
- Assign attributes
- Any write operation

**Note:** Blocked tools do not appear in the tool list, and runtime checks prevent execution if somehow called.

### Read-Only Tools List

- `grouper_find_groups_by_name_approximate`
- `grouper_get_group_by_exact_name`
- `grouper_get_group_by_uuid`
- `grouper_find_stems_by_name_approximate`
- `grouper_get_stem_by_exact_name`
- `grouper_get_stem_by_uuid`
- `grouper_get_members`
- `grouper_trace_membership`
- `grouper_get_privileges`
- `grouper_get_subject_by_id`
- `grouper_get_subject_by_identifier`
- `grouper_search_subjects`
- `grouper_get_subject_groups`

### Write Tools (Blocked)

- `grouper_create_group`
- `grouper_update_group`
- `grouper_delete_group_by_name`
- `grouper_delete_group_by_uuid`
- `grouper_delete_group_by_id_index`
- `grouper_add_member`
- `grouper_remove_member`
- `grouper_assign_attribute`
- `grouper_assign_privilege`

## Logging Configuration

### Log Location

**Default location:**
- Unix/Mac: `~/.grouper-mcp/logs/`
- Windows: `%USERPROFILE%\.grouper-mcp\logs\`
- Docker: `/home/mcp/.grouper-mcp/logs/`

**Custom location:**
```bash
export GROUPER_LOG_DIR="/var/log/grouper-mcp"
```

### Log Files

- **`grouper-mcp.log`**: All log messages (info, debug, errors)
- **`grouper-mcp-errors.log`**: Error messages only

### Debug Logging

Enable detailed logging for troubleshooting:

```bash
export GROUPER_DEBUG="true"
```

Debug logs include:
- HTTP request/response details
- API call parameters
- Grouper API responses
- Tool execution details

**Warning:** Debug mode may log sensitive information (credentials, API responses). Only use in development or for troubleshooting.

### Accessing Logs in Docker

```bash
# Mount logs to host
docker run -v $(pwd)/logs:/home/mcp/.grouper-mcp/logs ...

# View logs from running container
docker exec <container-id> cat /home/mcp/.grouper-mcp/logs/grouper-mcp.log

# Copy logs from container
docker cp <container-id>:/home/mcp/.grouper-mcp/logs ./logs
```

## TLS/SSL Configuration

### Certificate Validation

By default, the server validates TLS certificates. For development with self-signed certificates:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED="0"
```

**⚠️ WARNING:** Never disable certificate validation in production! This makes connections vulnerable to man-in-the-middle attacks.

### Production Certificate Setup

For production, ensure your Grouper instance has:
- Valid SSL certificate from trusted CA
- Proper certificate chain
- No expired certificates

## Act-As Configuration

The act-as feature allows the MCP server to impersonate another subject for operations.

### Use Cases

- Administrative operations requiring elevated privileges
- Operations on behalf of another user
- Service account acting as specific users

### Configuration

```bash
export GROUPER_ACT_AS_SUBJECT_ID="target_user_id"
export GROUPER_ACT_AS_SUBJECT_SOURCE_ID="subject_source"
export GROUPER_ACT_AS_SUBJECT_IDENTIFIER="target_user_identifier"
```

### Requirements

- The authenticated user must have "act-as" privileges in Grouper
- Target subject must exist
- Proper permissions must be configured in Grouper

## Best Practices

### Development

```bash
# Enable debug logging
export GROUPER_DEBUG="true"

# Allow self-signed certs
export NODE_TLS_REJECT_UNAUTHORIZED="0"

# Use test credentials
export GROUPER_USERNAME="test_user"
export GROUPER_PASSWORD="test_password"
```

### Production

```bash
# Disable debug logging (or omit)
export GROUPER_DEBUG="false"

# Validate certificates (or omit - default is 1)
export NODE_TLS_REJECT_UNAUTHORIZED="1"

# Use service account
export GROUPER_USERNAME="grouper_mcp_service"
export GROUPER_PASSWORD="strong_secure_password"

# Consider read-only mode for monitoring
export READ_ONLY="true"
```

### Docker Production

```properties
# config/grouper-mcp.properties
grouper-mcp.readOnly=true
```

```bash
# Build specialized image
docker build -t grouper-mcp:readonly .

# Run with minimal environment variables
docker run -i \
  -e GROUPER_BASE_URL="..." \
  -e GROUPER_USERNAME="..." \
  -e GROUPER_PASSWORD="..." \
  grouper-mcp:readonly
```

## Security Considerations

1. **Credentials**
   - Never commit credentials to version control
   - Use environment variables or secure secret management
   - Rotate passwords regularly
   - Use service accounts with minimum required permissions

2. **API Keys (HTTP mode)**
   - Generate strong, random API keys
   - Never use default API keys in production
   - Store keys securely
   - Rotate keys periodically

3. **Network Security**
   - Use HTTPS in production (via reverse proxy for MCPO)
   - Restrict network access to necessary hosts
   - Use firewall rules
   - Consider VPN for sensitive deployments

4. **Logging**
   - Disable debug logging in production
   - Protect log files (contain sensitive information)
   - Implement log rotation
   - Monitor logs for security events

## Troubleshooting

### Configuration Not Applied

1. Check configuration priority (properties file overrides env vars)
2. Verify environment variables are exported
3. Restart server after configuration changes
4. Check for typos in variable names

### Connection Issues

1. Verify `GROUPER_BASE_URL` is correct and accessible
2. Test URL manually: `curl -u user:pass $GROUPER_BASE_URL/groups`
3. Check firewall rules
4. Verify credentials are correct
5. Enable debug logging to see detailed errors

### Certificate Errors

1. For development: Set `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. For production: Fix certificate issues on Grouper server
3. Ensure certificate chain is complete
4. Check certificate expiration

### Permission Errors

1. Verify user has required permissions in Grouper
2. Check act-as configuration if using
3. Review Grouper logs for authorization failures
4. Ensure user exists and is active

## Additional Resources

- [Claude Desktop Setup](SETUP_CLAUDE_DESKTOP.md)
- [Open WebUI Setup](SETUP_OPEN_WEBUI.md)
- [HTTP/MCPO Setup](SETUP_HTTP.md)
- [Available Tools](TOOLS.md)

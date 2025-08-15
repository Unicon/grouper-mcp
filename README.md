# Grouper MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Internet2's Grouper identity management system via web services.

## Features

This MCP server provides the following tools for Grouper integration:

### Group Management
- **grouper_find_groups**: Search for groups by name or description
- **grouper_get_group**: Get detailed information about a specific group
- **grouper_create_group**: Create a new group
- **grouper_update_group**: Update group properties (display name, description)
- **grouper_delete_group**: Delete a group

### Member Management
- **grouper_add_member**: Add a member to a group
- **grouper_remove_member**: Remove a member from a group
- **grouper_get_members**: Get all members of a group

### Attribute Management
- **grouper_assign_attribute**: Assign an attribute to a group

## Configuration

Configure the server using environment variables:

```bash
# Required: Base URL for Grouper web services
export GROUPER_BASE_URL="https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000"

# Required: Basic authentication credentials
export GROUPER_USERNAME="your_username"
export GROUPER_PASSWORD="your_password"

# Optional: Act as different subject (for administrative operations)
export GROUPER_ACT_AS_SUBJECT_ID="your_admin_subject_id"
export GROUPER_ACT_AS_SUBJECT_SOURCE_ID="your_subject_source"
export GROUPER_ACT_AS_SUBJECT_IDENTIFIER="your_admin_identifier"
```

Copy `.env.example` to `.env` and fill in your actual values:
```bash
cp .env.example .env
# Edit .env with your credentials
```

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Development
Run in development mode with:
```bash
npm run dev
```

### Production
Build and run:
```bash
npm run build
npm start
```

### With Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "grouper": {
      "command": "node",
      "args": ["/path/to/grouper-mcp/dist/index.js"],
      "env": {
        "GROUPER_BASE_URL": "https://your-grouper-instance.edu/grouper-ws/servicesRest/json/v4_0_000",
        "GROUPER_USERNAME": "your_username",
        "GROUPER_PASSWORD": "your_password"
      }
    }
  }
}
```

For self-signed certificates, add:
```json
"NODE_TLS_REJECT_UNAUTHORIZED": "0"
```

## Examples

### Create a new group
```
Create a group named "edu:department:engineering:students" with display name "Engineering Students"
```

### Add members to a group
```
Add user "jdoe" to the group "edu:department:engineering:students"
```

### Search for groups
```
Find all groups containing "engineering" in their name
```

### Assign attributes
```
Assign attribute "classification" with value "academic" to group "edu:department:engineering:students"
```

## Authentication

The server supports Grouper's "act as" functionality for administrative operations. Configure the acting subject using the environment variables listed above.

## Error Handling

The server includes comprehensive error handling and logging. Errors are captured and formatted appropriately for display in Claude.

## API Compatibility

This server is designed to work with Grouper v4.0.000 web services API. It should be compatible with most recent versions of Grouper.
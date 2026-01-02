# Grouper MCP Testing Guide

This document describes the regression test suite for the Grouper MCP server.

## Test Suite Overview

The test suite (`test-suite.json`) contains comprehensive tests covering all Grouper MCP tools:

| Category | Tests | Description |
|----------|-------|-------------|
| stems | 5 | Find and retrieve stems/folders by name and UUID |
| groups | 6 | Create, read, update group operations |
| subjects | 5 | Search and retrieve subjects by ID and identifier |
| members | 6 | Add/remove members (single and batch operations) |
| subject-groups | 2 | Query subject's group memberships |
| trace | 1 | Membership path tracing |
| privileges | 7 | Grant, revoke, query privileges |
| attributes | 1 | Attribute assignment |
| cleanup | 5 | Delete operations (all methods) |
| errors | 1 | Error handling validation |

## Prerequisites

Before running tests, ensure:

1. **Project is built**: Run `npm run build` to compile the MCP server
2. **Test stem exists**: Create `test:mcp` stem in Grouper (or update `testStem` in config)
3. **Test subject exists**: Tests use `GrouperSystem` by default
4. **Permissions**: The authenticated user needs sufficient privileges for all operations

## Environment Variables

The test runner requires the following environment variables:

```bash
# Required
export GROUPER_BASE_URL="https://your-grouper/grouper-ws/servicesRest/json/v4_0_000"
export GROUPER_USERNAME="GrouperSystem"
export GROUPER_PASSWORD="your-password"

# For self-signed certificates (development only)
export NODE_TLS_REJECT_UNAUTHORIZED="0"
```

The test runner displays these values at startup (password length only) to help verify configuration.

## Configuration

The test suite uses configurable variables in the `config` section:

```json
{
  "config": {
    "testStem": "test:mcp",
    "testGroupPrefix": "regression-test", 
    "testSubject": "GrouperSystem"
  }
}
```

Adjust these values to match your environment.

## Running Tests

### Option 1: Automated Test Runner (Recommended)

The test runner script executes all tests automatically:

```bash
# Install dependencies
npm install

# Build the project first (required for MCP server)
npm run build

# Run all tests
npx tsx tests/run-tests.ts

# Run with options
npx tsx tests/run-tests.ts --verbose           # Detailed output
npx tsx tests/run-tests.ts --category groups   # Single category
npx tsx tests/run-tests.ts --test group-2.1    # Single test
npx tsx tests/run-tests.ts --stop-on-fail      # Stop on first failure
```

### Option 2: Interactive Testing with Claude

For exploratory testing or debugging specific issues, ask Claude to run individual tests or categories. Note that running the full suite interactively may hit context limits.

### Option 3: Manual Testing

Execute tests manually by calling each tool with the specified parameters.

## Test Structure

Each test in `test-suite.json` includes:

```json
{
  "id": "group-2.1",
  "category": "groups",
  "name": "Create group",
  "tool": "grouper_create_group",
  "params": {
    "name": "{{testStem}}:{{testGroupPrefix}}-group"
  },
  "expect": { 
    "type": "created", 
    "hasFields": ["uuid", "name"] 
  },
  "saveAs": { "uuid": "createdGroupUuid" },
  "dependsOn": ["stem-1.2"]
}
```

### Fields

| Field | Description |
|-------|-------------|
| `id` | Unique test identifier |
| `category` | Test grouping for filtering |
| `name` | Human-readable test name |
| `tool` | MCP tool to invoke |
| `params` | Parameters to pass (supports `{{variable}}` substitution) |
| `expect` | Expected outcome type and validations |
| `saveAs` | Save result fields for use in later tests |
| `dependsOn` | Tests that must pass before this one runs |
| `runLast` | Execute this test at the end (for cleanup) |

### Expectation Types

| Type | Description |
|------|-------------|
| `contains_results` | Response contains one or more results |
| `found` | Single item found successfully |
| `not_found` | Item correctly reported as not found |
| `created` | Resource was created |
| `updated` | Resource was updated |
| `deleted` | Resource was deleted |
| `success` | Operation completed successfully |
| `error` | Operation returned an error (expected) |

## Test Execution Order

Tests are processed in array order from `test-suite.json`:

1. **Tests are checked** for unmet dependencies before running
2. **Skipped tests**: If dependencies haven't passed yet, the test is skipped
3. **Cleanup tests** (`runLast: true`) are moved to run at the end

**Important**: Tests with `dependsOn` must appear *after* their dependencies in the array. The runner does not reorder tests automatically - it simply skips tests whose dependencies haven't passed yet.

## Adding New Tests

To add a test:

1. Add an entry to the `tests` array in `test-suite.json`
2. Assign a unique `id` following the pattern: `category-X.Y`
3. Specify dependencies if the test relies on prior state
4. Use `{{variables}}` for configurable values
5. Define clear expectations

Example:

```json
{
  "id": "member-4.5",
  "category": "members",
  "name": "Add batch members",
  "tool": "grouper_add_member",
  "params": {
    "groupName": "{{testStem}}:{{testGroupPrefix}}-group",
    "subjects": [
      { "subjectId": "user1" },
      { "subjectId": "user2" }
    ]
  },
  "expect": { "type": "success" },
  "dependsOn": ["group-2.1"]
}
```

## Troubleshooting

### Common Issues

**"Stem not found"**
- Ensure `testStem` exists in your Grouper instance
- Check permissions on the stem

**"Subject not found"** 
- Verify `testSubject` is a valid subject in your environment
- Try using a different known subject ID

**Permission errors**
- Ensure the authenticated user has admin privileges on the test stem
- Check Grouper's access control settings

**Dependency failures**
- If a test fails, dependent tests will be skipped
- Fix the root cause before re-running

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Regression Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      grouper:
        image: i2incommon/grouper:latest
        ports:
          - 443:443
        env:
          GROUPER_MORPHSTRING_ENCRYPT_KEY: ${{ secrets.GROUPER_KEY }}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      - run: npm run build
      
      - name: Run regression tests
        env:
          GROUPER_BASE_URL: https://localhost/grouper-ws
          GROUPER_USERNAME: ${{ secrets.GROUPER_USER }}
          GROUPER_PASSWORD: ${{ secrets.GROUPER_PASS }}
        run: npx tsx tests/run-tests.ts
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "tsx tests/run-tests.ts",
    "test:verbose": "tsx tests/run-tests.ts --verbose"
  }
}
```

## Contributing

When adding new MCP tools, please:

1. Add corresponding tests to `test-suite.json`
2. Include both success and error cases
3. Test edge cases (empty inputs, not found, etc.)
4. Update this documentation if needed

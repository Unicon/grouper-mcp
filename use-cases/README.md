# Grouper-MCP Use Cases

This directory contains documented use cases for the Grouper-MCP project, gathered from community feedback, discussions, and real-world deployment scenarios.

Each use case includes:
- Problem statement and context
- Proposed solution
- MCP tool coverage analysis
- Implementation recommendations and status

## Use Cases

| Use Case | Description | Status | Jira |
|----------|-------------|--------|------|
| [AI-Assisted Cohort Definition](ai-assisted-cohort-definition.md) | Leverage AI to help users build complex cohorts using set theory on basis groups | Implemented | [GMCP-15](https://uniconinc.atlassian.net/browse/GMCP-15), [GMCP-16](https://uniconinc.atlassian.net/browse/GMCP-16) |
| [Loader-Based Description Generation](loader-based-description-generation.md) | AI generates human-readable group descriptions from loader configuration | Analysis Needed | - |

## Contributing Use Cases

If you have a use case you'd like to see supported, please:

1. Open an issue or contact [jbeard@unicon.net](mailto:jbeard@unicon.net)
2. Include:
   - Problem statement: What are you trying to accomplish?
   - Context: How would this be used in practice?
   - Current workarounds (if any)

## Use Case Template

When adding a new use case, use this structure:

```markdown
# Use Case: [Title]

**Source:** [Who suggested it, organization]
**Related Task:** [Jira ticket if applicable]

## Problem Statement
[What problem does this solve?]

## Proposed Solution
[How would this work?]

## Technical Considerations
[What MCP tools/features would be needed?]

## MCP Tool Coverage Analysis
[Analysis of current vs. needed capabilities]
```

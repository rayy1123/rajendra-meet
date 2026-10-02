---
name: needmcp
description: Model Context Protocol (MCP) server discovery, installation, configuration, and diagnostics assistant.
---

# NeedMCP — Model Context Protocol Hub

Automated helper for discovering, configuring, and testing MCP servers and external integrations.

## Capabilities & Triggers
Use when:
- Project needs external data access (PostgreSQL, Supabase, SQLite, Redis, S3).
- Web browser automation is required (Playwright, Puppeteer, Brave Search).
- Third-party developer platform tools are needed (GitHub, Linear, Slack, Sentry, Vercel).
- Diagnosing MCP server connection issues, authorization errors, or missing tool declarations.

## Standard Configuration Locations
1. **Claude Code Global Config**: `~/.claude/settings.json` or `~/.claude/mcp.json`
2. **Project Local Config**: `.claude/mcp.json` or `.mcp.json`

## Configuration Schema
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-example"],
      "env": {
        "API_KEY": "your-key-here"
      }
    }
  }
}
```

## Diagnostic Checklist
1. **Connectivity**: Verify process launches with zero exit code.
2. **Permissions**: Ensure necessary API tokens or credentials exist in environment.
3. **Tool Surface**: Run tool inspection to verify exported tools match expectations.
4. **Transport**: Confirm stdio or SSE endpoint is reachable and not blocked by firewall.

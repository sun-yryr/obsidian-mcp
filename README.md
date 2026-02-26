# Obsidian MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that enables AI assistants to interact with Obsidian vaults, providing tools for reading, creating, editing, and managing notes and tags.

## Warning!!!

This MCP has read and write access (if you allow it). Please. PLEASE backup your Obsidian vault prior to using obsidian-mcp to manage your notes. I recommend using git, but any backup method will work. These tools have been tested, but not thoroughly, and this MCP is in active development.

## Why Deno?

This MCP server is built and run using Deno rather than Node.js, primarily for security. Since this server needs read and write access to your precious personal notes in Obsidian, it's crucial to minimize the risk of malicious or unintended actions.

Deno provides a built-in permissions system that requires explicit access to resources like the file system, network, and environment variables. As you can see in the configuration and start commands, we only grant access to exactly what is needed (e.g., `-R` for read, `-W` for write, and limited network/environment options) so your other files and data on your computer remain protected by default.

## Features

- Read, search, create, edit, move, and delete notes in your vault
- Create new directories
- Comprehensive tag management (add, remove, rename, manage)
- Search vault contents (by content, filename, or tags)
- Manage frontmatter properties
- Move tasks within Obsidian Kanban boards
- Support for multi-vault setups

## Requirements

- [Deno](https://deno.land/)
- An Obsidian vault

## Install

### Downloading the Code

```bash
git clone https://github.com/sun-yryr/obsidian-mcp.git
# or using GitHub CLI
gh repo clone sun-yryr/obsidian-mcp
```

### For Gemini CLI

Add to your Gemini CLI configuration (e.g., `~/.gemini/settings.json`):

```json
{
  "mcpServers": {
    "obsidian-mcp": {
      "command": "deno",
      "args": [
        "task",
        "start",
        "$HOME/Documents/vault"
      ],
      "cwd": "$HOME/path/to/obsidian-mcp",
      "timeout": 10000
    }
  }
}
```

Restart Gemini CLI after saving the configuration.

## Development

```bash
cd obsidian-mcp

# Start the server (using Deno)
deno task start
```

## Available Tools

- `read-note` - Read the content of an existing note
- `create-note` - Create a new note with markdown content
- `edit-note` - Edit an existing note (append, prepend, or replace)
- `delete-note` - Delete a note (move to trash or permanently delete)
- `move-note` - Move/rename a note while preserving links
- `create-directory` - Create a new directory
- `search-vault` - Search for specific content or tags within vault notes
- `add-tags` - Add tags to notes in frontmatter and/or content
- `remove-tags` - Remove tags from notes in frontmatter and/or content
- `rename-tag` - Safely rename tags throughout the vault while preserving hierarchies
- `manage-tags` - Add or remove tags from notes, supporting both frontmatter and inline tags
- `list-available-vaults` - List all available vaults that can be used with other tools
- `update-properties` - Update frontmatter properties (YAML) in a note
- `move-kanban-task` - Move a task between lists in an Obsidian Kanban board

## Documentation

Additional documentation can be found in the `docs` directory:

- `creating-tools.md` - Guide for creating new tools
- `tool-examples.md` - Examples of using the available tools

## Security

### Vault Access

This server requires access to your Obsidian vault directory. When configuring the server, make sure to:

- Only provide access to your intended vault directory
- Review tool actions before approving them

## Troubleshooting

Common issues:

1. **Server not showing up or connecting**
   - Verify your configuration file syntax
   - Make sure the vault path is absolute and exists
   - Restart your AI client (e.g., Gemini CLI)

2. **Permission errors**
   - Ensure the vault path is readable/writable
   - Check file permissions in your vault

3. **Tool execution failures**
   - Check your client's logs for MCP connection or execution errors.

## License

MIT

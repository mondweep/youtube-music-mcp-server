# YouTube Music MCP Server

[![smithery badge](https://smithery.ai/badge/@mondweep/youtube-music-mcp-server)](https://smithery.ai/server/@mondweep/youtube-music-mcp-server)

## Overview
This project implements a Model Context Protocol (MCP) server that enables AI models to control YouTube Music playback through Google Chrome. It bridges the gap between AI assistants and music playback, allowing AI to search for and play songs based on song names and artist names.

## What is MCP?
The Model Context Protocol (MCP) is a standardized way for AI models to interact with external tools and services. It provides a structured communication protocol that allows AI assistants to:
- Discover available tools
- Understand tool capabilities
- Execute actions through these tools
- Handle responses and errors consistently

Learn more about MCP:
- [MCP Documentation](https://github.com/modelcontextprotocol/protocol)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)

## Features
- Search YouTube Music for songs
- Play songs directly in Google Chrome
- Support for song name and artist name search
- Error handling and logging
- Cross-platform support (focused on macOS for Chrome automation)

## Architecture

### High-Level Overview

# youtube-music-server MCP Server

A Model Context Protocol server

This is a TypeScript-based MCP server that implements a simple notes system. It demonstrates core MCP concepts by providing:

- Resources representing text notes with URIs and metadata
- Tools for creating new notes
- Prompts for generating summaries of notes

## Features

### Resources
- List and access notes via `note://` URIs
- Each note has a title, content and metadata
- Plain text mime type for simple content access

### Tools
- `create_note` - Create new text notes
  - Takes title and content as required parameters
  - Stores note in server state

### Prompts
- `summarize_notes` - Generate a summary of all stored notes
  - Includes all note contents as embedded resources
  - Returns structured prompt for LLM summarization

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

### Installing via Smithery

To install YouTube Music Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@mondweep/youtube-music-mcp-server):

```bash
npx -y @smithery/cli install @mondweep/youtube-music-mcp-server --client claude
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

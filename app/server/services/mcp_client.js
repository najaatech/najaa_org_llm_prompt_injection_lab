import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';

const MCP_CALL_TIMEOUT_MS = 10 * 1000;
const MCP_SERVER_FILE = fileURLToPath(new URL('./mcp_server.js', import.meta.url));

/**
 * Starts the fixed local MCP server, lists its tools, lets `choose` pick a note from them,
 * calls the tool once and always shuts the server down again.
 */
export async function withToyMcp({ description, defended, signal }, choose) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [MCP_SERVER_FILE],
    // Explicit clean env: never pass server secrets or inherited secrets.
    env: {
      PATH: process.env.PATH || '/usr/bin:/bin',
      LAB_MCP_DESCRIPTION: description,
      LAB_MCP_DEFENDED: defended ? '1' : '0'
    },
    stderr: 'pipe'
  });
  const client = new Client({ name: 'trust-lab-client', version: '0.1.0' });

  try {
    signal?.throwIfAborted();
    await client.connect(transport);

    const listing = await client.listTools({}, { signal, timeout: MCP_CALL_TIMEOUT_MS });
    const noteId = await choose(listing.tools);
    signal?.throwIfAborted();

    const result = await client.callTool(
      { name: 'read_note', arguments: { noteId } },
      undefined,
      { signal, timeout: MCP_CALL_TIMEOUT_MS }
    );
    return { tools: listing.tools, noteId, result };
  } finally {
    await client.close();
    await transport.close();
  }
}

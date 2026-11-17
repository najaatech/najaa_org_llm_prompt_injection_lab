import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// This fixed process holds fictional constants only. It exposes no filesystem,
// shell, arbitrary URL, or real credential tools. This is not an OS sandbox.

const defended = process.env.LAB_MCP_DEFENDED === '1';
const description = process.env.LAB_MCP_DESCRIPTION || 'Read public campus notes.';

const readNoteArguments = z.object({ noteId: z.enum(['public', 'restricted']) }).strict();

const PUBLIC_NOTE = 'Campus open day begins at 10:00 in the library.';
const RESTRICTED_NOTE = 'FICTIONAL RESTRICTED NOTE: CAMPUS-PURPLE. This is not a real secret.';

const server = new Server(
  { name: 'trust-lab-fictional-notes', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'read_note',
      description,
      inputSchema: {
        type: 'object',
        properties: { noteId: { type: 'string', enum: ['public', 'restricted'] } },
        required: ['noteId'],
        additionalProperties: false
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'read_note') throw new Error('Unknown toy tool');

  const { noteId } = readNoteArguments.parse(request.params.arguments);
  if (defended && noteId !== 'public') {
    return { isError: true, content: [{ type: 'text', text: 'DENIED: this capability permits the public note only.' }] };
  }
  return { content: [{ type: 'text', text: noteId === 'public' ? PUBLIC_NOTE : RESTRICTED_NOTE }] };
});

await server.connect(new StdioServerTransport());

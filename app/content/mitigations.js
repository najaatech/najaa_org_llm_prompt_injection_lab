// Mitigation cards shown after each challenge. Code strings are illustrative sketches; they are never executed by the app.
export const mitigations = {
  l1: {
    principle: 'Notes the app finds for the chatbot are just data. Never put a secret where the chatbot can read it, and decide who may see a note in your code, not in the chatbot’s instructions.',
    steps: [
      'Do not keep secrets in the notes the chatbot reads. Store passwords and keys in a secrets manager.',
      'Check the user’s permissions before searching, so restricted notes can never reach the chatbot.',
      'Keep the rules and the found notes in separate, labelled places, and treat the notes as untrusted.',
      'Check the final answer for sensitive values before showing it.'
    ],
    code: `// Authorisation is part of the query, not a request to the model.\nasync function retrieveForUser(question, user) {\n  const allowed = await docs.find({\n    $or: [{ visibility: 'public' }, { ownerId: user.id, visibility: 'private' }]\n  }).toArray(); // 'staff-only' documents are never fetched for visitors\n  return rank(question, allowed).slice(0, 3);\n}\nconst context = retrieved.map(d => \`[source:\${d.id}] \${d.text}\`).join('\\n');`,
    limits: 'Checking permissions before searching stops this leak, but anything that does reach the chatbot can still be repeated by it.'
  },
  l2: {
    principle: 'Word filters and hiding an exact string are easy to get around. They slow people down but do not really protect anything.',
    steps: [
      'Use word blocklists for logging only. People can reword, translate, split or encode their request.',
      'Look for secrets by their pattern or a hidden marker, not just the exact text, and clean up the answer before checking it.',
      'Keep the secret out of the chatbot’s prompt. If the chatbot never sees it, it cannot be talked into saying it.',
      'Limit how fast people can ask, and raise an alert after many blocked attempts.'
    ],
    code: `// Normalise before comparing so spacing, case and punctuation cannot hide a secret.\nconst squash = s => s.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g, '');\nfunction leaks(output, secrets) {\n  const flat = squash(output);\n  return secrets.some(secret => flat.includes(squash(secret)));\n}\nif (leaks(answer, [user.incidentRef])) return refuse();\n// Better: never place user.incidentRef in the prompt at all.`,
    limits: 'Even a cleaned-up output check misses rewording, translation and encodings. Keep the secret out of the prompt instead.'
  },
  l3: {
    principle: 'When the chatbot picks a database lookup, your database code decides what that lookup may return.',
    steps: [
      'Limit every query to the signed-in user in server code. The chatbot never supplies the owner.',
      'Check the key the chatbot suggests against a fixed list and reject anything else.',
      'Mark restricted records in the database and refuse to return them, instead of asking the chatbot to hide them.',
      'Return only the fields that are needed, and log every lookup.'
    ],
    code: `import { z } from 'zod';\nconst lookup = z.object({ key: z.enum(['welcome-banner']) }).strict();\nasync function readEntry(user, proposal) {\n  const { key } = lookup.parse(proposal);          // model output is untrusted input\n  return vault.findOne({\n    ownerId: user.id,                                // scope comes from the session\n    key, restricted: false                           // restricted data is never returned to the model\n  }, { projection: { text: 1, _id: 0 } });\n}`,
    limits: 'This only closes the lookup path. If the chatbot can read the secret somewhere else, it can still repeat it.'
  },
  mcp: {
    principle: 'The tool protects itself. Permission checks belong in the tool’s own code, not in its description or in what the chatbot asks for.',
    steps: [
      'Check access inside the tool, using the signed-in user, on every call.',
      'Treat tool names, descriptions and results as untrusted. Review a description once, then pin it.',
      'Check arguments against a fixed list of allowed values.',
      'Ask a person to approve sensitive actions, and log every call.'
    ],
    code: `// Integration sketch for the maintained v1 SDK; hooks below belong to your server.\nimport { z } from 'zod';\nconst ACL = new Map([['visitor', new Set(['public'])]]);\nserver.tool('read_note', { noteId: z.enum(['public', 'restricted']) }, async ({ noteId }, extra) => {\n  const principal = principalFrom(extra); // authenticated transport/session, NOT model arguments\n  const allowed = ACL.get(principal?.id);\n  if (!allowed?.has(noteId)) {\n    audit('denied', principal?.id, noteId);\n    return { isError: true, content: [{ type: 'text', text: 'Access denied.' }] };\n  }\n  audit('allowed', principal.id, noteId);\n  return { content: [{ type: 'text', text: NOTES[noteId] }] };\n});\n// For fixed local stdio, bind the principal to the launched capability.\n// Pin metadata from a separately reviewed baseline, never from the current tools/list response.\nif (sha256(canonicalize(received)) !== APPROVED_METADATA_HASH) {\n  throw new Error('Tool metadata changed. Review required.');\n}`,
    limits: 'Pinning only helps when a description changes. You also need minimal permissions, human approval and good logging.'
  }
};

for (const [id, mitigation] of Object.entries(mitigations)) {
  mitigation.language = 'JavaScript';
  mitigation.labTip = id === 'mcp'
    ? 'In this lab, the “defended” switch makes the tool allow only the public note. Pinning descriptions is an extra idea that this lab does not run.'
    : 'This challenge is weak on purpose so you can find the flag. The sketch shows how a real system would close the gap. It is not run here.';
}

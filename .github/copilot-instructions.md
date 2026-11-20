# Prompt Injection Prototype development

- Never commit, push, or check deployment status without an explicit user request.
- Keep simulated outcomes unmistakably separate from actual local model results.
- Real tool capabilities are limited to fictional constants in the fixed local MCP server. Never add shell execution, arbitrary URLs/files, real credentials or external propagation.
- Escape learner and model text. Keep per-user scope and authorization enforced server-side, independent of model output.
- Validate with `npm run check`, `npm test`, `npm audit`, then genuine browser and local-model smoke tests when relevant.
- Current official MCP SDK integration uses the pinned maintained v1 package. Do not mix v2 imports into v1 code. Documentation: https://ts.sdk.modelcontextprotocol.io/ and https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x ; tools specification: https://modelcontextprotocol.io/specification/2025-06-18/server/tools . Recheck upstream compatibility before upgrades.
- Native Ollama uses the fixed loopback endpoint. Tested default is qwen2.5:3b; qwen3:4b forced reasoning in the local runtime and is not the classroom default.
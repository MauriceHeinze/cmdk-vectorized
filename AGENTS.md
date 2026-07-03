# AGENTS.md — cmdk-vectorized

## When to use this package

Use `cmdk-vectorized` when an app already has (or will have) a `cmdk` command palette and needs:

- **Vector-database search** instead of client-side `cmdk` filtering
- **Weaviate** (or similar) as the ranking/retrieval backend
- Optional **speech-to-text voice input** that feeds the same search endpoint

This is not a generic LLM chat API. Ranking comes from vector DB retrieval.

## Architecture

```txt
typed query or speech-to-text transcript
  -> useAICommandSearch / useAICommand / useCommandVoice
  -> GET /api/command-search?q=...&limit=...
  -> backend queries vector database (Weaviate)
  -> { results: CommandSearchResult[] }
  -> render cmdk items (shouldFilter={false})
  -> executeAICommand -> app-owned navigate() or actions[actionKey]()
```

## Integration checklist

1. `npm install cmdk-vectorized cmdk react react-dom`
2. Create a search endpoint (use `createCommandSearchHandler` from `cmdk-vectorized/server`)
3. Wire `useAICommand` with `endpoint`, `navigate`, and `actions`
4. Render `<Command shouldFilter={false}>` — required so cmdk does not override vector DB ranking
5. Optional: add `CommandVoice` / `useCommandVoice` for browser speech-to-text
6. Optional: `npx cmdk-vectorized init` to generate `public/intent-map.json`, then `npx cmdk-vectorized upload` to seed Weaviate

Run `npx cmdk-vectorized integrate` to install a detailed integration skill for Codex, Claude, and OpenCode.

## Imports

```ts
// Client
import { Command, useAICommand, useAICommandSearch, CommandVoice, useCommandVoice } from "cmdk-vectorized";

// Server
import { createCommandSearchHandler } from "cmdk-vectorized/server";

// Tooling
import { installAgentWorkflows, installIntegrationSkill, uploadIntentMap, validateIntentMap } from "cmdk-vectorized/tooling";
```

Do not import from `dist/*` or `src/*`.

## CLI

| Command | Purpose |
|---------|---------|
| `npx cmdk-vectorized integrate` | Install integration skill for coding agents |
| `npx cmdk-vectorized init` | Install intent-map generator skill; produces `public/intent-map.json` |
| `npx cmdk-vectorized upload` | Validate intent map and upload to Weaviate |

Upload requires `WEAVIATE_URL` and `WEAVIATE_API_KEY`.

## Docs

- [docs/llm-guide.md](./docs/llm-guide.md) — dense reference
- [docs/api.md](./docs/api.md) — full API contract
- [docs/local-weaviate.md](./docs/local-weaviate.md) — local dev playbook
- [Live demo](https://settings-demo-redux.vercel.app)

## Repo dev commands

```bash
pnpm install
pnpm build
pnpm test
pnpm example:redux:dev
```

Example app lives in `examples/settings-demo-redux`.

## Constraints for consumer apps

When generating intent maps via `init`, do **not** generate `llms.txt` files in the consumer app. Do not change app behavior during intent-map generation.
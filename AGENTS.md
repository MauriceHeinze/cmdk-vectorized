# AGENTS.md — cmdk-vectorized

## When to use this package

Use `cmdk-vectorized` when an app already has (or will have) a `cmdk` command palette and needs:

- **Vector-database search** instead of client-side `cmdk` filtering
- **Weaviate** (or similar) as the ranking/retrieval backend
- Optional **speech-to-text voice input** that feeds the same search endpoint
- Optional **styled drop-in palette** (`AICommandPalette`) for greenfield DX

This is not a generic LLM chat API. Ranking comes from vector DB retrieval.

## Integration tracks

| Track | Prefer when | API |
|-------|-------------|-----|
| **Drop-in** | Greenfield / fastest path | `AICommandPalette` + optional `import "cmdk-vectorized/styles.css"` |
| **Headless** | Existing `cmdk` / custom UI | `useAICommand`, `useCommandVoice`, `useAICommandPalette`, `Command` |

Drop-in is built **on top of** headless hooks. CSS is scoped to `.cmdk-ai` only.

**Voice policy:** after Web Speech → search, **auto-execute** when one intent is clear (`autoExecute: "single"` default); **show a short list** only when multiple results are plausible.

## Architecture

```txt
typed query or speech-to-text transcript
  -> useAICommandSearch / useAICommand / useCommandVoice
     (or AICommandPalette / useAICommandPalette)
  -> GET /api/command-search?q=...&limit=...
  -> backend queries vector database (Weaviate)
  -> { results: CommandSearchResult[] }
  -> render cmdk items (shouldFilter={false})  OR  smart voice route/list
  -> executeAICommand -> app-owned navigate() or actions[actionKey]()
```

## Integration checklist

1. `npm install cmdk-vectorized cmdk react react-dom`
2. Create a search endpoint (use `createCommandSearchHandler` from `cmdk-vectorized/server`) **or** point at SupaSearch with a publishable key in `headers`
3. **Either** mount `<AICommandPalette endpoint navigate … />` **or** wire `useAICommand` + `<Command shouldFilter={false}>`
4. Optional voice: drop-in includes ⌘M; headless uses `useCommandVoice` / `useAICommandPalette`
5. Optional: `npx cmdk-vectorized init` → `public/intent-map.json`, then `npx cmdk-vectorized upload` to seed Weaviate

Run `npx cmdk-vectorized integrate` to install a detailed integration skill for Codex, Claude, and OpenCode.

## Imports

```ts
// Client — drop-in
import { AICommandPalette } from "cmdk-vectorized";
import "cmdk-vectorized/styles.css";

// Client — headless
import {
  Command,
  useAICommand,
  useAICommandSearch,
  useAICommandPalette,
  CommandVoice,
  useCommandVoice,
} from "cmdk-vectorized";

// Server
import { createCommandSearchHandler } from "cmdk-vectorized/server";

// Tooling
import { installAgentWorkflows, installIntegrationSkill, uploadIntentMap, validateIntentMap } from "cmdk-vectorized/tooling";
```

Do not import from `dist/*` or `src/*` (except documented CSS: `cmdk-vectorized/styles.css`).

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
pnpm example:redux:dev   # full cmdk-vectorized demo
```

Example: `examples/settings-demo-redux` is the wired command palette and Weaviate demo.

## Constraints for consumer apps

When generating intent maps via `init`, do **not** generate `llms.txt` files in the consumer app. Do not change app behavior during intent-map generation.

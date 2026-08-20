# Settings Demo (plain) — clean host app

Baseline Redux settings shell with **no** `cmdk`, **no** `cmdk-vectorized`, and **no** SupaSearch wiring.

Same routes, forms, and sidebar as [`settings-demo-redux`](../settings-demo-redux) — without palette or voice. Install-prompt / indexing E2E lives in **cmdk-integration-test** (`pnpm reset` / `pnpm create-temp-app`); this tree is the source copy.

## Run

From **cmdk-vectorized** root:

```bash
pnpm example:plain:dev
```

Defaults to `/settings/call-recorder` at http://localhost:5173.

## What is intentionally missing

- `cmdk` / `cmdk-vectorized` dependency
- Command palette (⌘K) / voice (⌘M)
- `public/intent-map.json`, sitemap, shards
- `.env.cmdk` / site keys

For an **already-wired** palette + voice demo, use [`settings-demo-redux`](../settings-demo-redux).

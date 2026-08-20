# Settings Demo (plain) — clean host app

Baseline Redux settings shell with **no** `cmdk`, **no** `cmdk-vectorized`, and **no** SupaSearch wiring.

Use this when you want to validate the **SupaSearch install prompt** end-to-end:

1. Run this app as the customer project.
2. Paste the dashboard agent prompt / run `npx cmdk-saas setup … --run`.
3. Let the index + integrate skills wire the palette from scratch.

Same routes, forms, and sidebar as [`settings-demo-redux`](../settings-demo-redux) — without palette or voice.

## Run (fresh / on demand)

From **cmdk-vectorized** root — resets this app to a clean host (strips cmdk, palette, intent maps, env) and prints the path:

```bash
pnpm example:plain:fresh          # reset only
pnpm example:plain:fresh:dev      # reset + start Vite
```

Or:

```bash
node scripts/provide-clean-settings-demo.mjs
node scripts/provide-clean-settings-demo.mjs --dev
node scripts/provide-clean-settings-demo.mjs --json   # machine-readable path
```

Then open the printed path (usually http://localhost:5173) — defaults to `/settings/call-recorder`.

Without reset:

```bash
pnpm example:plain:dev
```

## What is intentionally missing

- `cmdk` / `cmdk-vectorized` dependency
- Command palette (⌘K) / voice (⌘M)
- `public/intent-map.json`, sitemap, shards
- `.env.cmdk` / site keys

## Test install prompt

1. Start SupaSearch dashboard and copy the full install agent prompt (or setup command).
2. Point the agent at **this directory** as the project root (or monorepo path you choose).
3. Expect: env file, skills, intent map + upload, palette integration.
4. Reload the app and confirm search works against your site key.

For a **already-wired** palette + voice demo, use [`settings-demo-redux`](../settings-demo-redux).

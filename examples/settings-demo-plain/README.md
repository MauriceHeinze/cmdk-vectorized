# Settings Demo (plain)

Baseline Redux settings app **without** `cmdk` or `cmdk-vectorized`.

Same settings shell, routes, and forms as [`settings-demo-redux`](../settings-demo-redux), minus:

- command palette (`⌘K`)
- voice navigator (`⌘M`)
- Weaviate / `/api/command-search`
- intent-map / index artifacts

Use this as a clean app to practice wiring:

- **cmdk-vectorized** (`npx cmdk-vectorized integrate`)
- **cmdk-saas** (`npx cmdk-saas install` + index/integrate skills)

## Run

From the monorepo root:

```bash
pnpm install
pnpm example:plain:dev
```

Or from this folder:

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 dev
```

Open http://localhost:5173 — defaults to `/settings/call-recorder`.

## What’s included

- React 19 + Vite + React Router
- Redux Toolkit settings store
- Sidebar navigation + local sidebar filter
- Settings pages (profile, appearance, billing, call recorder, …)

## What’s intentionally missing

| Feature | Status |
|---------|--------|
| `cmdk` / command dialog | not wired |
| `cmdk-vectorized` dependency | none |
| Search API | none |
| Global keyboard shortcuts | none |
| `public/intent-map.json` | none |

After you integrate a palette, compare against `examples/settings-demo-redux` for a full reference.

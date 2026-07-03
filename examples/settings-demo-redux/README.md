# Settings Demo (Redux)

This demo wires `cmdk-vectorized` into a Redux-backed settings app shell.

**Live demo:** https://settings-demo-redux.vercel.app

Serves [`/llms.txt`](https://settings-demo-redux.vercel.app/llms.txt) for LLM discoverability.

## Weaviate search

The command palette and voice shortcut search Weaviate route results through `/api/command-search`.

### Local development

Set server-side Weaviate credentials in `.env.local`:

```bash
WEAVIATE_URL=your_cluster_url
WEAVIATE_API_KEY=your_key_here
WEAVIATE_CLUSTER_URL=your_cluster_url
```

Then start the app:

```bash
npx pnpm@10.12.4 dev
```

Vite serves the API route locally, so typed search and voice mode both call `/api/command-search`.

### Vercel deployment

The `settings-demo-redux` Vercel project is connected to `MauriceHeinze/cmdk-vectorized` with its root directory set to `examples/settings-demo-redux`.

Pushes to `main` trigger a production deploy when relevant files change:

- `examples/settings-demo-redux/**`
- `src/**` (linked `cmdk-vectorized` package)
- `package.json`, `pnpm-lock.yaml`, or `tsup.config.ts`

Other commits on `main` are skipped via `scripts/should-deploy.sh`.

Production URL: https://settings-demo-redux.vercel.app

Set these environment variables in the Vercel dashboard:

- `WEAVIATE_URL`
- `WEAVIATE_API_KEY`
- `WEAVIATE_CLUSTER_URL` (optional, defaults to `WEAVIATE_URL`)

Do not expose Weaviate credentials as `VITE_*` variables. The API function in `api/command-search.ts` keeps keys on the server.
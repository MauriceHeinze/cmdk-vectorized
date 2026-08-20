# Settings Demo (plain) — drop-in track

Copy of the clean settings shell with the **opinionated** `cmdk-vectorized` palette mounted:

- `<AICommandPalette />` + `cmdk-vectorized/styles.css`
- ⌘K text search, ⌘M voice (built into the drop-in)
- Same Weaviate `/api/command-search` backend as the redux demo

The redux example stays on the **headless** track (custom `CommandDialog` + `SiriVoiceNavigator`).

## Run

From the package root:

```bash
pnpm example:plain:dev
```

Or in this folder:

```bash
npx pnpm@10.12.4 dev
```

Opens at http://localhost:5174 if the redux demo already occupies 5173.

Needs the same server env as the redux demo (`.env.local`):

```bash
WEAVIATE_URL=your_cluster_url
WEAVIATE_API_KEY=your_key_here
WEAVIATE_CLUSTER_URL=your_cluster_url
```

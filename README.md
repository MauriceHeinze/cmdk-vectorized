# cmdk-vectorized

Remote AI and vector search for `cmdk`.

Keep your existing command palette UI. Move ranking and retrieval to your backend or vector database.

## What it does

- Uses your backend as the source of truth for search results.
- Keeps navigation and actions explicit and app-owned.
- Works well when your app already uses `cmdk` or shadcn/ui command components.
- Ships a CLI for agentic intent-map generation and Weaviate upload.

## Product preview

Screenshot / video placeholder.

Add a short demo here that shows:

- a user typing a vague query
- backend-ranked results appearing in `cmdk`
- selecting a result triggering app-owned navigation or action execution

## Example app

This repo includes a Redux-backed settings demo under `examples/settings-demo-redux`.

Run it locally:

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 example:redux:dev
```

If you want the semantic route search and voice flow to hit Weaviate, start it with:

```bash
VITE_WEAVIATE_DATABASE_URL=your_cluster_url \
VITE_WEAVIATE_API_KEY=your_key_here \
npx pnpm@10.12.4 example:redux:dev
```

The example uses the local `src/index.ts` entry directly, so it reflects in-repo `cmdk-vectorized` changes without needing a package publish step.

## Requirements

- `react` and `react-dom`
- `cmdk`
- A backend search endpoint
- Weaviate is recommended if you want semantic or vector-backed retrieval

If `cmdk` is already installed in your app, integration is usually straightforward.

## Install

```bash
npm install cmdk-vectorized cmdk react react-dom
```

`cmdk` is also re-exported from this package as `Command`.

## Agentic setup

Use the built-in CLI when you want local agents to generate and maintain your command corpus.

```bash
npx cmdk-vectorized init
```

This installs local workflow files for Codex, Claude, and OpenCode so an agent can generate:

```txt
public/intent-map.json
public/intent-map.csv
```

Then upload the canonical JSON map to Weaviate:

```bash
WEAVIATE_URL="https://example.weaviate.cloud" \
WEAVIATE_API_KEY="..." \
npx cmdk-vectorized upload
```

`cmdk-vectorized-agent` still works as a legacy alias, but `cmdk-vectorized` is the primary command.

## Quick start

```tsx
import { Command, useAICommand } from "cmdk-vectorized";

export function CommandMenu() {
  const command = useAICommand({
    endpoint: "/api/command-search",
    navigate: (href) => {
      window.location.href = href;
    },
    actions: {
      "team.invite": () => openInviteModal(),
    },
  });

  return (
    <Command shouldFilter={false}>
      <Command.Input
        value={command.query}
        onValueChange={command.setQuery}
        placeholder="Search commands..."
      />
      <Command.List>
        {command.results.map((result) => (
          <Command.Item
            key={result.id}
            value={result.id}
            onSelect={() => {
              void command.execute(result);
            }}
          >
            {result.title}
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
}
```

Important: render `<Command shouldFilter={false}>` so `cmdk` does not override backend ranking.

## Play with it locally

The fastest way to try the package is:

1. Run your app locally.
2. Start a small search server that talks to your Weaviate instance.
3. Point `useAICommand({ endpoint })` at that local endpoint.

Use the copy-pasteable local setup guide here:

- [Local Weaviate Playbook](./docs/local-weaviate.md)

## API docs

Detailed imports, result contracts, client hooks, server helpers, tooling exports, and route placeholder notes live here:

- [API Documentation](./docs/api.md)

## Notes

- `href` values are app-owned. The package does not enforce routing conventions.
- Placeholder styles like `[workspaceId]`, `:workspaceId`, `{workspaceId}`, or `$workspaceId` are just examples.
- Use `href` for navigation results and `actionKey` for action results.
- Weaviate is recommended, not required.

## What moved out of this README

The README now stays focused on product value, setup, and first success. These details belong in dedicated docs instead:

- Full result contract
- Hook and server helper reference
- Local Weaviate dev setup
- Tooling module details
- Execution edge cases and integration notes

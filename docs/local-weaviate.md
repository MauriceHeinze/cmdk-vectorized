# Local Weaviate Playbook

This is the fastest generic setup for trying `cmdk-vectorized` against a real Weaviate database without adopting a framework-specific example.

## What you need

- a running React app
- `cmdk-vectorized` installed
- a Weaviate instance
- `WEAVIATE_URL`
- `WEAVIATE_API_KEY`

## 1. Point your UI at a local endpoint

```tsx
import { Command, useAICommand } from "cmdk-vectorized";

export function CommandMenu() {
  const command = useAICommand({
    endpoint: "http://localhost:3001/api/command-search",
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

## 2. Start a minimal local search server

Create `server.mjs`:

```js
import { createServer } from "node:http";

const WEAVIATE_URL = process.env.WEAVIATE_URL;
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY;

if (!WEAVIATE_URL || !WEAVIATE_API_KEY) {
  throw new Error("Missing WEAVIATE_URL or WEAVIATE_API_KEY");
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, "http://localhost:3001");

  if (req.method !== "GET" || url.pathname !== "/api/command-search") {
    res.writeHead(404).end("Not found");
    return;
  }

  const query = url.searchParams.get("q") ?? "";
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20;

  const response = await fetch(`${WEAVIATE_URL.replace(/\/+$/, "")}/v1/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WEAVIATE_API_KEY}`,
    },
    body: JSON.stringify({
      query: `
        {
          Get {
            CmdkIntent(
              hybrid: { query: ${JSON.stringify(query)} }
              limit: ${limit}
            ) {
              commandId
              label
              description
              path
              _additional {
                score
              }
            }
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    res.writeHead(response.status, { "Content-Type": "text/plain" }).end(body);
    return;
  }

  const json = await response.json();
  const rows = json?.data?.Get?.CmdkIntent ?? [];

  const results = rows
    .filter((row) => typeof row?.commandId === "string" && typeof row?.label === "string")
    .map((row) => ({
      id: row.commandId,
      type: "navigation",
      title: row.label,
      description: typeof row.description === "string" ? row.description : undefined,
      href: typeof row.path === "string" ? row.path : "/",
      score:
        typeof row?._additional?.score === "number"
          ? row._additional.score
          : typeof row?._additional?.score === "string"
            ? Number(row._additional.score)
            : undefined,
    }))
    .filter((row) => typeof row.href === "string");

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ results }));
});

server.listen(3001, () => {
  console.log("cmdk-vectorized dev server listening on http://localhost:3001");
});
```

Run it:

```bash
WEAVIATE_URL="https://example.weaviate.cloud" \
WEAVIATE_API_KEY="..." \
node server.mjs
```

## 3. Seed Weaviate from an agent-generated map

Install agent workflows:

```bash
npx cmdk-vectorized init
```

Generate `public/intent-map.json`, then upload it:

```bash
WEAVIATE_URL="https://example.weaviate.cloud" \
WEAVIATE_API_KEY="..." \
npx cmdk-vectorized upload
```

## Notes

- Weaviate is recommended, not required.
- `path` values in your intent map become `href` values in your result mapping.
- Placeholder formats like `[workspaceId]`, `:workspaceId`, `{workspaceId}`, and `$workspaceId` are only examples. Resolve them in your app if needed.
- For production, replace this tiny server with your real search backend and permission model.

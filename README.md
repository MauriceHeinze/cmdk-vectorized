# cmdk-vectorized

Vector-database search for `cmdk` command palettes, with optional speech-to-text voice input and an optional styled drop-in palette.

Pick your integration depth:

| Track | Use when… | What you import |
|-------|-----------|-----------------|
| **Drop-in** | Greenfield / want UI in minutes | `AICommandPalette` + `cmdk-vectorized/styles.css` |
| **Headless** | You already have `cmdk` (or custom UI) | `useAICommand` / `useCommandVoice` + `Command` |

Both tracks hit the same search endpoint. Voice uses the **browser Web Speech API**, then the same ranking API as typing. Voice **routes straight** when one intent is clear; it **shows a short list only when multiple intents are plausible**.

Styles for the drop-in are **scoped under `.cmdk-ai`** and never restyle the rest of your app. Headless consumers never import CSS.

<a href="https://www.youtube.com/watch?v=JwHRA-bXtiA" target="_blank" rel="noopener noreferrer">
  <img src="docs/demo-thumbnail.jpg" alt="cmdk-vectorized demo" width="100%">
</a>

In the **[video demo](https://www.youtube.com/watch?v=JwHRA-bXtiA)** above, a vague typed query and speech-to-text voice input both hit the same vector search endpoint. Ranked results render in `cmdk`, and selecting one triggers app-owned navigation or an action handler.

Try it yourself here 👉 **[Live demo](https://settings-demo-redux.vercel.app)**

[API docs](./docs/api.md) · [AGENTS.md](./AGENTS.md) · [LLM guide](./docs/llm-guide.md)

## Looking for…

| You want to… | This package provides… |
|--------------|------------------------|
| Ship a palette in ~5 lines | `AICommandPalette` + optional `styles.css` |
| Add vector search to existing `cmdk` | `useAICommand` + `shouldFilter={false}` |
| Add voice (Web Speech) on top | `useCommandVoice` / `useAICommandPalette` |
| Use Weaviate for semantic command search | CLI `init` + `upload` for intent maps |
| Hosted multi-tenant search | Point `endpoint` + `Authorization: Bearer` at SupaSearch |

## Install

```bash
npm install cmdk-vectorized cmdk react react-dom
```

`cmdk` is also re-exported from this package as `Command`.

**Requirements:** `react`, `react-dom`, `cmdk`, and a backend search endpoint. Weaviate is recommended for semantic retrieval.

## Quick start — drop-in

```tsx
import { AICommandPalette } from "cmdk-vectorized";
import "cmdk-vectorized/styles.css"; // optional default look (scoped to .cmdk-ai)

export function AppCommands() {
  return (
    <AICommandPalette
      endpoint="/api/command-search"
      navigate={(href) => {
        window.location.href = href;
      }}
      actions={{
        "team.invite": () => openInviteModal(),
      }}
      placeholder="Search documentation…"
    />
  );
}
```

Shortcuts: **⌘K** text mode · **⌘M** voice mode · **Esc** close. Theme via CSS variables on the root (`--cmdk-ai-bg`, `--cmdk-ai-fg`, …).

## Quick start — headless (existing cmdk)

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

Render `<Command shouldFilter={false}>` so `cmdk` does not override vector-database ranking.

For a headless mode controller (text + voice shortcuts without styles), use `useAICommandPalette`.

## Agentic setup

Install the integration skill for coding agents:

```bash
npx cmdk-vectorized integrate
```

Generate and upload a command corpus to Weaviate:

```bash
npx cmdk-vectorized init
```

```txt
public/intent-map.json
public/intent-map.csv
```

```bash
WEAVIATE_URL="https://example.weaviate.cloud" \
WEAVIATE_API_KEY="..." \
npx cmdk-vectorized upload
```

`cmdk-vectorized-agent` still works as a legacy alias.

## Example apps

| Example | Description |
|---------|-------------|
| [`examples/settings-demo-plain`](./examples/settings-demo-plain) | **Clean host** — settings shell without cmdk (source for cmdk-integration-test) |
| [`examples/settings-demo-redux`](./examples/settings-demo-redux) | **Wired demo** — custom `CommandDialog` + smart `useCommandVoice` |

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 example:redux:dev   # wired demo
npx pnpm@10.12.4 example:plain:dev   # baseline app (no palette)
```

With Weaviate:

```bash
VITE_WEAVIATE_DATABASE_URL=your_cluster_url \
VITE_WEAVIATE_API_KEY=your_key_here \
npx pnpm@10.12.4 example:redux:dev
```

The example imports the local `src/index.ts` entry, so in-repo changes show up without publishing.

## Documentation

- [API reference](./docs/api.md) — hooks, result contract, server helpers, tooling
- [Local Weaviate playbook](./docs/local-weaviate.md) — copy-paste local dev setup

## Notes

- `href` values are app-owned. The package does not enforce routing conventions.
- Placeholder styles like `[workspaceId]`, `:workspaceId`, `{workspaceId}`, or `$workspaceId` are just examples.
- Use `href` for navigation results and `actionKey` for action results.
- Weaviate is recommended, not required.
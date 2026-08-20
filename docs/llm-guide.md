# cmdk-vectorized — LLM guide

Dense reference for coding agents integrating vector-database search into `cmdk` command palettes.

## What this package is

- **Vector-database search** for `cmdk` command palettes (Weaviate recommended)
- **React hooks** that fetch ranked results from your backend search endpoint
- **Optional styled drop-in** (`AICommandPalette` + scoped `styles.css`)
- **Server helper** (`createCommandSearchHandler`) for standard HTTP handlers
- **Optional speech-to-text** via `CommandVoice` / `useCommandVoice` (browser Web Speech API)
- Use **cmdk-vectorized-cli** for agent-generated intent maps and Weaviate upload

## What this package is not

- Not a generic "remote AI search" or LLM chat layer
- Not a routing library — `href` resolution and `actionKey` handlers are app-owned
- Not a replacement for `cmdk` — it extends `cmdk` with backend-ranked results
- Not a global stylesheet — drop-in CSS is scoped to `.cmdk-ai` only

## FAQ

### Drop-in or headless?

- **Drop-in:** greenfield → `AICommandPalette` + optional `import "cmdk-vectorized/styles.css"`
- **Headless:** existing `cmdk` UI → `useAICommand` / `useCommandVoice` / `useAICommandPalette`

### How is this different from plain cmdk filtering?

Plain `cmdk` filters a static item list client-side. `cmdk-vectorized` disables that filter (`shouldFilter={false}`) and renders results ranked by your vector database via a search endpoint.

### Where does voice fit?

Browser Web Speech API → same search endpoint. Default `autoExecute: "single"` routes when one intent is clear; shows a short list only when multiple results are plausible.

### Do I need Weaviate?

Recommended for semantic/vector retrieval, not required. Your `search` function in `createCommandSearchHandler` can query any backend. SupaSearch works via `endpoint` + Bearer publishable key.

## Architecture

```txt
user query (typed or transcribed)
  -> useAICommandSearch / useAICommand / useCommandVoice
     (or AICommandPalette / useAICommandPalette)
  -> GET /api/command-search?q=...&limit=...
  -> vector database query (Weaviate)
  -> { results: CommandSearchResult[] }
  -> <Command shouldFilter={false}> or smart voice route/list
  -> executeAICommand -> navigate(href) or actions[actionKey]()
```

## Public exports

### `cmdk-vectorized` (client)

| Export | Use when |
|--------|----------|
| `AICommandPalette` | Styled drop-in palette (text + voice modes) |
| `useAICommandPalette` | Headless open/mode/shortcut controller |
| `Command` | Re-export of `cmdk` Command component |
| `useAICommand` | Search + execute (navigate/actions) in one hook |
| `useAICommandSearch` | Search state only; you handle execution |
| `executeAICommand` | Imperative execution of a result |
| `CommandVoice` | Light voice UI / render-prop wrapper |
| `useCommandVoice` | Voice hook (STT → search → smart execute/list) |
| `VoiceWaveform` | Presentational bars for custom voice UIs |

### `cmdk-vectorized/styles.css`

Optional default look for `AICommandPalette`. All rules under `.cmdk-ai`.

### `cmdk-vectorized/server`

| Export | Use when |
|--------|----------|
| `createCommandSearchHandler` | Building `GET` handlers for search endpoints |

### `cmdk-vectorized-cli`

Intent maps and Weaviate upload are a separate package. See that package for `init` / `integrate` / `upload`.

| Export | Use when |
|--------|----------|
| `installAgentWorkflows` | Install intent-map generator skill (`init`) |
| `installIntegrationSkill` | Install integration skill (`integrate`) |
| `uploadIntentMap` | Upload `public/intent-map.json` to Weaviate |
| `validateIntentMap` | Validate intent map shape |
| `readIntentMap` | Read `public/intent-map.json` |
| `intentMapToCsv` | Convert intents to CSV |
| `createWeaviateClassSchema` | Weaviate class schema for CmdkIntent |

## Result contract

```ts
type CommandSearchResult = NavigationCommandResult | ActionCommandResult;

type NavigationCommandResult = {
  id: string;
  type: "navigation";
  title: string;
  description?: string;
  href: string;
  score?: number;
};

type ActionCommandResult = {
  id: string;
  type: "action";
  title: string;
  description?: string;
  actionKey: string;
  score?: number;
};
```

Results with `score < 0.7` are hidden by default. Override with `minConfidence`.

## Minimal client integration

```tsx
import { Command, useAICommand } from "cmdk-vectorized";

export function CommandMenu() {
  const command = useAICommand({
    endpoint: "/api/command-search",
    navigate: (href) => { window.location.href = href; },
    actions: { "team.invite": () => openInviteModal() },
  });

  return (
    <Command shouldFilter={false}>
      <Command.Input value={command.query} onValueChange={command.setQuery} />
      <Command.List>
        {command.results.map((result) => (
          <Command.Item key={result.id} value={result.id} onSelect={() => void command.execute(result)}>
            {result.title}
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
}
```

## Minimal server handler

```ts
import { createCommandSearchHandler } from "cmdk-vectorized/server";

export const GET = createCommandSearchHandler({
  search: async ({ query, limit }) => {
    const commands = await searchVectorDatabase({ query, limit });
    return commands.map((cmd) => ({
      id: cmd.id,
      type: "navigation" as const,
      title: cmd.title,
      href: cmd.href,
      score: cmd.score,
    }));
  },
});
```

## Voice integration

```tsx
import { CommandVoice } from "cmdk-vectorized";

<CommandVoice
  endpoint="/api/command-search"
  navigate={(href) => router.push(href)}
  actions={{ "settings.open": () => openSettings() }}
  shortcut={{ key: "k", meta: true, shift: true }}
/>
```

Speech is transcribed client-side, then sent to the same vector search endpoint as typed queries.

## Weaviate setup

1. `npx cmdk-vectorized-cli init` — agent generates `public/intent-map.json`
2. `WEAVIATE_URL=... WEAVIATE_API_KEY=... npx cmdk-vectorized-cli upload`
3. Point your search handler at Weaviate (see [local-weaviate.md](./local-weaviate.md))

## Agent skills

| Command | Skill installed |
|---------|-----------------|
| `npx cmdk-vectorized-cli integrate` | How to wire vector search + optional voice into an app |
| `npx cmdk-vectorized-cli init` | How to scan an app and generate `public/intent-map.json` |

## Live demo

- App: https://settings-demo-redux.vercel.app
- Video: https://settings-demo-redux.vercel.app/demo.mp4
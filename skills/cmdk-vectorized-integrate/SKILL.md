---
name: cmdk-vectorized-integrate
description: Integrate cmdk-vectorized vector-database search and optional speech-to-text voice input into a React cmdk command palette (drop-in or headless).
---

# cmdk-vectorized Integration

Wire vector-database search into an existing or new `cmdk` command palette.

## When to use

- App uses `cmdk` or shadcn/ui `Command` components — **or** you want a styled drop-in palette
- Command palette should query a **vector database** (Weaviate) or SupaSearch instead of client-side filtering
- Optional: **speech-to-text voice** via browser Web Speech API

This is vector DB retrieval, not a generic LLM chat API.

## Choose a track

| Track | When | API |
|-------|------|-----|
| **Drop-in** | Greenfield / fastest path | `AICommandPalette` + optional `cmdk-vectorized/styles.css` |
| **Headless** | Existing `cmdk` chrome you want to keep | `useAICommand` + `Command` with `shouldFilter={false}` |

Voice (both tracks): after speech → search, **auto-route** when one intent is clear; **show a short list** only when multiple results are plausible (`autoExecute: "single"` default).

## Integration steps

1. Install: `npm install cmdk-vectorized cmdk react react-dom`
2. Search backend:
   - Self-hosted: `createCommandSearchHandler` from `cmdk-vectorized/server`
   - SupaSearch: `endpoint` = `{base}/api/search`, `headers: { Authorization: "Bearer ck_site_…" }`
3. **Drop-in:** mount `AICommandPalette`  
   **Headless:** wire `useAICommand` + `<Command shouldFilter={false}>`
4. Optional voice:
   - Drop-in includes ⌘M
   - Headless: `useCommandVoice` or `useAICommandPalette`
5. Optional Weaviate corpus:
   - `npx cmdk-vectorized init` → `public/intent-map.json`
   - `WEAVIATE_URL=... WEAVIATE_API_KEY=... npx cmdk-vectorized upload`

## Drop-in example (greenfield)

```tsx
import { AICommandPalette } from "cmdk-vectorized";
import "cmdk-vectorized/styles.css"; // scoped under .cmdk-ai — does not style host UI

export function AppCommands() {
  return (
    <AICommandPalette
      endpoint="/api/command-search"
      navigate={(href) => router.push(href)}
      actions={{
        "team.invite": () => openInviteModal(),
      }}
      placeholder="Search…"
    />
  );
}
```

Theme with CSS variables on the root (`--cmdk-ai-bg`, `--cmdk-ai-fg`, …). Never required for headless.

## Headless example (existing cmdk)

```tsx
import { Command, useAICommand } from "cmdk-vectorized";

export function CommandMenu() {
  const command = useAICommand({
    endpoint: "/api/command-search",
    navigate: (href) => router.push(href),
    actions: {
      "team.invite": () => openInviteModal(),
    },
  });

  return (
    <Command shouldFilter={false}>
      <Command.Input value={command.query} onValueChange={command.setQuery} />
      <Command.List>
        {command.results.map((result) => (
          <Command.Item
            key={result.id}
            value={result.id}
            onSelect={() => void command.execute(result)}
          >
            {result.title}
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
}
```

## Server example

```ts
import { createCommandSearchHandler } from "cmdk-vectorized/server";

export const GET = createCommandSearchHandler({
  search: async ({ query, limit }) => {
    // Query Weaviate or your vector database here
    return rankedResults;
  },
});
```

## Voice example (headless)

```tsx
import { useCommandVoice } from "cmdk-vectorized";

const voice = useCommandVoice({
  endpoint: "/api/command-search",
  navigate: (href) => router.push(href),
  autoExecute: "single", // default: route if one clear hit, else list
  voiceListLimit: 3,
});

// voice.status === "results" → render voice.results and call voice.execute(item)
```

## Result contract

Each result must be either:

- `{ id, type: "navigation", title, href, score? }` — app resolves and navigates to `href`
- `{ id, type: "action", title, actionKey, score? }` — app calls `actions[actionKey]()`

## Rules

- Always set `shouldFilter={false}` on `<Command>` (drop-in does this for you)
- Do not parse `id` to decide behavior — use `href` or `actionKey`
- Drop-in CSS must stay scoped (package uses `.cmdk-ai` only)
- Do not generate `llms.txt` files in the consumer app
- Do not change unrelated app behavior during integration

## Docs

- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/llm-guide.md
- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/api.md
- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/local-weaviate.md

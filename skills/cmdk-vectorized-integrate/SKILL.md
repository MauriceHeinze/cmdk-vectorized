---
name: cmdk-vectorized-integrate
description: Integrate cmdk-vectorized vector-database search and optional speech-to-text voice input into a React cmdk command palette.
---

# cmdk-vectorized Integration

Wire vector-database search into an existing or new `cmdk` command palette.

## When to use

- App uses `cmdk` or shadcn/ui `Command` components
- Command palette should query a **vector database** (Weaviate) instead of client-side filtering
- Optional: add **speech-to-text voice input** via browser Web Speech API

This is vector DB retrieval, not a generic LLM chat API.

## Integration steps

1. Install: `npm install cmdk-vectorized cmdk react react-dom`
2. Create search endpoint using `createCommandSearchHandler` from `cmdk-vectorized/server`
3. Wire `useAICommand` with `endpoint`, `navigate`, and `actions`
4. Render `<Command shouldFilter={false}>` — required
5. Optional: add `CommandVoice` for speech-to-text voice search
6. Optional Weaviate corpus:
   - `npx cmdk-vectorized init` (separate skill) to generate `public/intent-map.json`
   - `WEAVIATE_URL=... WEAVIATE_API_KEY=... npx cmdk-vectorized upload`

## Client example

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

## Voice example

```tsx
import { CommandVoice } from "cmdk-vectorized";

<CommandVoice
  endpoint="/api/command-search"
  navigate={(href) => router.push(href)}
  actions={{ "settings.open": () => openSettings() }}
/>
```

## Result contract

Each result must be either:

- `{ id, type: "navigation", title, href, score? }` — app resolves and navigates to `href`
- `{ id, type: "action", title, actionKey, score? }` — app calls `actions[actionKey]()`

## Rules

- Always set `shouldFilter={false}` on `<Command>`
- Do not parse `id` to decide behavior — use `href` or `actionKey`
- Do not generate `llms.txt` files in the consumer app
- Do not change unrelated app behavior during integration

## Docs

- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/llm-guide.md
- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/api.md
- https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/local-weaviate.md
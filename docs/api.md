# cmdk-vectorized API Documentation

## Public imports

Client code:

```ts
import {
  Command,
  executeAICommand,
  useAICommand,
  useAICommandSearch,
  type CommandSearchResult,
} from "cmdk-vectorized";
```

Server code:

```ts
import { createCommandSearchHandler } from "cmdk-vectorized/server";
```

Tooling:

```ts
import {
  installAgentWorkflows,
  uploadIntentMap,
  validateIntentMap,
  intentMapToCsv,
} from "cmdk-vectorized/tooling";
```

Do not import from `dist/*` or `src/*`.

## Architecture

```txt
user query -> useAICommandSearch -> GET /api/command-search?q=...&limit=...
           -> backend/vector/AI search -> { results: CommandSearchResult[] }
           -> render cmdk items -> executeAICommand -> app-owned navigate/action
```

Boundaries:

- The backend owns matching, ranking, permissions, and result construction.
- The frontend must render `<Command shouldFilter={false}>`.
- The app owns `navigate`, action handlers, modals, API calls, analytics, and state mutation.
- Command IDs are stable identifiers. Do not parse them to decide behavior.

## Result contract

```ts
type CommandSearchResponse = {
  results: CommandSearchResult[];
};

type CommandSearchResult = NavigationCommandResult | ActionCommandResult;

type NavigationCommandResult = {
  id: string;
  type: "navigation";
  title: string;
  description?: string;
  href: string;
  score?: number;
  meta?: Record<string, unknown>;
};

type ActionCommandResult = {
  id: string;
  type: "action";
  title: string;
  description?: string;
  actionKey: string;
  score?: number;
  meta?: Record<string, unknown>;
};
```

Validation rules:

- `id` and `title` must be strings
- `type` must be `"navigation"` or `"action"`
- navigation results must include `href`
- action results must include `actionKey`
- `description` must be a string when present
- `score` may be a number, or a string that parses to a finite number
- `meta` must be an object when present

Invalid results fail the search request and surface as `error` in the hook.

By default, results with `score < 0.7` are hidden on the client. Override that with `minConfidence`.

## `useAICommand`

Use `useAICommand` when results should be executable.

```tsx
import { Command, useAICommand } from "cmdk-vectorized";

export function CommandMenu() {
  const command = useAICommand({
    endpoint: "/api/command-search",
    debounceMs: 150,
    maxResults: 20,
    minConfidence: 0.7,
    navigate: (href) => {
      window.location.href = href;
    },
    resolveHref: (href) => href,
    routeExists: (href) => href.startsWith("/"),
    actions: {
      "team.invite": () => openInviteModal(),
      "auth.logout": () => logout(),
    },
    onUnknownAction: (actionKey) => {
      console.warn(`Unknown action: ${actionKey}`);
    },
    onUnknownRoute: (href) => {
      console.warn(`Unknown route: ${href}`);
    },
    onUnresolvedHref: (href, result) => {
      console.warn("Could not resolve href", href, result);
    },
    onExecuteError: (error, result) => {
      console.error("Command execution failed", result, error);
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

## `useAICommandSearch`

Use `useAICommandSearch` when you only need remote search state.

```tsx
import { useAICommandSearch, type CommandSearchResult } from "cmdk-vectorized";

const search = useAICommandSearch({
  endpoint: "/api/command-search",
  searchOnEmptyQuery: true,
  transformResponse: (data) => {
    if (Array.isArray(data)) {
      return data as CommandSearchResult[];
    }

    if (typeof data === "object" && data !== null && "items" in data) {
      return (data as { items: CommandSearchResult[] }).items;
    }

    return [];
  },
});
```

## `createCommandSearchHandler`

Use `createCommandSearchHandler` for standard `Request` -> `Response` handlers.

```ts
import { createCommandSearchHandler } from "cmdk-vectorized/server";

export const GET = createCommandSearchHandler({
  defaultLimit: 20,
  maxLimit: 50,
  search: async ({ query, limit, request }) => {
    const user = await requireUser(request);
    const commands = await searchCommandsForUser({ userId: user.id, query, limit });

    return commands.flatMap((command) => {
      if (command.kind === "route" && command.href) {
        return {
          id: command.id,
          type: "navigation" as const,
          title: command.title,
          description: command.description,
          href: command.href,
          score: command.score,
          meta: command.meta,
        };
      }

      if (command.kind === "action" && command.actionKey) {
        return {
          id: command.id,
          type: "action" as const,
          title: command.title,
          description: command.description,
          actionKey: command.actionKey,
          score: command.score,
          meta: command.meta,
        };
      }

      return [];
    });
  },
});
```

## Tooling exports

The tooling subpath exposes:

- `installAgentWorkflows`
- `uploadIntentMap`
- `createWeaviateClassSchema`
- `validateIntentMap`
- `readIntentMap`
- `intentMapToCsv`

These support agent-generated command corpora and Weaviate ingestion.

## Route placeholders

The package does not enforce any placeholder syntax. Strings like:

- `[workspaceId]`
- `:workspaceId`
- `{workspaceId}`
- `$workspaceId`

are just examples.

If your app uses placeholders, resolve them in `resolveHref`.

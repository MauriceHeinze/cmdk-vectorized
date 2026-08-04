---
name: cmdk-saas-integrate
description: Wire a React command palette to cmdk-saas using cmdk-vectorized only. Greenfield (add palette) or replace existing cmdk fuzzy/local filter. shouldFilter=false, resolveHref, publishable key.
---

# cmdk-saas-integrate

Connect this frontend to **cmdk-saas** search.

**Client library is only `cmdk-vectorized`** (plus peer `cmdk` / React). Do **not** invent a custom search client, BFF ranking layer, or alternate result shape.

cmdk-saas hosts search + intents. This skill only **wires the UI**.

## When to use

- User has a **publishable** key (`ck_site_…`) and API base URL
- Intents are indexed (or will be) via **cmdk-saas-index**
- App needs ⌘K search that ranks by meaning, not substring filter

## Non-negotiables

1. Use **`cmdk-vectorized`**: `useAICommand` and/or `useAICommandSearch`, `Command` re-export OK  
2. Always **`shouldFilter={false}`** on `<Command>` — otherwise cmdk re-filters and destroys vector ranking  
3. **Publishable key only** in the browser — never `ck_ingest_…`  
4. **Parameterized hrefs**: store/resolve `[accountId]` etc.; never hardcode live tenant ids  
5. Do **not** change unrelated product behavior  
6. Do **not** generate `llms.txt`  

## Prereqs

| Item | Notes |
|------|--------|
| API base | e.g. `https://…` or `http://localhost:3000` |
| Site key | `ck_site_…` from dashboard |
| Search URL | `{base}/api/v1/search` |
| Index | If search always empty → run **cmdk-saas-index** / `npx cmdk-saas setup … --run` first |

Env (pick stack):

```bash
# Vite
VITE_CMDK_API_BASE_URL=https://your-host
VITE_CMDK_SITE_KEY=ck_site_…

# Next.js
NEXT_PUBLIC_CMDK_API_BASE_URL=https://your-host
NEXT_PUBLIC_CMDK_SITE_KEY=ck_site_…
```

Optional: copy from `.env.cmdk` (`CMDK_API_BASE_URL` / `CMDK_SITE_KEY`) into the public names above.

---

## Step 0 — Detect mode

Search the repo for command palette usage:

| Signal | Mode |
|--------|------|
| No `cmdk` / `Command.Input` / shadcn `Command` palette | **G — greenfield** |
| Existing palette + static items / local `.filter` / fuse / match-sorter / default filtering | **R — replace-fuzzy** |
| Already uses `useAICommand` + remote endpoint | **Verify only** — fix gaps (`shouldFilter`, keys, resolveHref) |

Announce the chosen mode before editing.

---

## Mode G — Greenfield (add palette)

### G1. Install

```bash
npm install cmdk-vectorized cmdk
# ensure react / react-dom peers satisfied
```

### G2. Add one palette component

Create e.g. `src/components/cmdk-saas-palette.tsx` (adjust to project layout):

```tsx
import { useEffect, useState } from "react";
import { Command, useAICommand } from "cmdk-vectorized";

const baseUrl = import.meta.env.VITE_CMDK_API_BASE_URL; // or NEXT_PUBLIC_…
const siteKey = import.meta.env.VITE_CMDK_SITE_KEY;

type Props = {
  navigate: (href: string) => void;
  getRouteParams: () => Record<string, string | undefined>;
  actions?: Record<string, () => void | Promise<void>>;
};

function resolveHrefTemplate(
  href: string,
  params: Record<string, string | undefined>,
): string | null {
  let out = href;
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    out = out.replaceAll(`[${key}]`, value).replaceAll(`:${key}`, value);
  }
  if (/\[[^\]]+\]/.test(out)) return null;
  return out;
}

export function CmdkSaasPalette({ navigate, getRouteParams, actions = {} }: Props) {
  const [open, setOpen] = useState(false);

  const command = useAICommand({
    endpoint: `${baseUrl}/api/v1/search`,
    headers: { Authorization: `Bearer ${siteKey}` },
    navigate: (href) => {
      navigate(href);
      setOpen(false);
    },
    resolveHref: (href) => resolveHrefTemplate(href, getRouteParams()),
    actions,
    onUnresolvedHref: () => {
      // e.g. toast: pick a workspace first
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div role="dialog" aria-label="Command menu">
      <Command shouldFilter={false}>
        <Command.Input
          value={command.query}
          onValueChange={command.setQuery}
          placeholder="Search…"
        />
        <Command.List>
          {command.loading ? <Command.Loading>Searching…</Command.Loading> : null}
          {!command.loading && command.results.length === 0 ? (
            <Command.Empty>No results</Command.Empty>
          ) : null}
          {command.results.map((result) => (
            <Command.Item
              key={result.id}
              value={result.id}
              onSelect={() => {
                void command.execute(result);
              }}
            >
              <span>{result.title}</span>
              {result.description ? (
                <span data-description>{result.description}</span>
              ) : null}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
```

### G3. Mount

- Root layout / app shell: pass real `navigate` (Next `router.push`, RR `navigate`, hash router, etc.)
- Pass `getRouteParams` from auth/session/store (accountId, workspaceId, …)
- Map known `actionKey`s to existing app functions

### G4. Style

- Match app design lightly; do not rebuild a full design system
- If project uses shadcn `Command`, you may compose the same hooks inside their primitives — still `shouldFilter={false}`

---

## Mode R — Replace fuzzy / local filter (existing cmdk)

### R1. Locate palette

Find the file with `Command.Input` / item list / filter logic.

### R2. Install client if needed

```bash
npm install cmdk-vectorized
```

(Keep existing `cmdk` / shadcn command UI.)

### R3. Minimal behavioral patch

1. Import `useAICommand` from `cmdk-vectorized` (or `useAICommandSearch` + manual execute)
2. Configure:

```ts
const command = useAICommand({
  endpoint: `${baseUrl}/api/v1/search`,
  headers: { Authorization: `Bearer ${siteKey}` },
  navigate: /* existing app navigation */,
  resolveHref: /* session params */,
  actions: { /* existing handlers by actionKey */ },
});
```

3. On `<Command>` set **`shouldFilter={false}`**
4. Bind input:

```tsx
<Command.Input value={command.query} onValueChange={command.setQuery} />
```

5. Render **`command.results`** instead of a locally filtered static array
6. `onSelect` → `void command.execute(result)` (or equivalent)
7. **Remove** dual filtering: no `.filter` / fuse / match-sorter on the remote result list
8. Optional: keep a few static “suggested” items as `initialResults` when query is empty — do not re-enable cmdk filtering

### R4. Do not redesign

- Keep dialog chrome, classes, animations, keyboard open/close
- Prefer a small diff in one file when possible

### R5. Forbidden

- Leaving default filtering on  
- Filtering API results again on the client  
- Ingest key in the browser  
- Hardcoded full URLs with live user/org ids  

---

## Parameterized routes

Intent maps may contain:

```txt
/workspaces/[workspaceId]/settings
/#/admin/[accountId]/channels/chat-widget
```

Resolve only in the client:

```ts
resolveHref: (href) => {
  const workspaceId = getWorkspaceId(); // your app
  const accountId = getAccountId();
  let out = href
    .replaceAll("[workspaceId]", workspaceId ?? "")
    .replaceAll("[accountId]", accountId ?? "");
  if (/\[[^\]]+\]/.test(out)) return null;
  return out;
}
```

If `null`, use `onUnresolvedHref` (prompt user to select workspace).

---

## Result contract (do not invent)

**Navigation:** `{ id, type: "navigation", title, href, description?, score? }`  
**Action:** `{ id, type: "action", title, actionKey, description?, score? }`

- Route with `href` after `resolveHref`  
- Run side effects via `actions[actionKey]`  
- Do not parse `id` for navigation logic  

---

## Router cheat sheet

| Stack | `navigate` |
|-------|------------|
| Next App Router | `useRouter().push(href)` |
| React Router | `useNavigate()(href)` |
| Hash apps | update hash / hash-router API; keep `#` in templates if required |
| Simple SPA | `window.location.assign(href)` last resort |

---

## Smoke test

1. Open palette (⌘K / Ctrl+K or existing trigger)  
2. Type a phrase that exists in the intent map  
3. Results appear ranked (not alphabetical substring-only)  
4. Select navigation → correct route (params filled)  
5. Select action → handler runs  
6. Network: `GET {base}/api/v1/search?q=…` with `Authorization: Bearer ck_site_…`  
7. If always empty → check index (`cmdk-saas-index`) and key/URL  

---

## Checklist

- [ ] Mode G or R chosen and announced  
- [ ] `cmdk-vectorized` used (no custom search client)  
- [ ] Env: base URL + **publishable** key only  
- [ ] `endpoint` = `{base}/api/v1/search`  
- [ ] `shouldFilter={false}`  
- [ ] Results from `command.results`  
- [ ] `navigate` + `actions` wired  
- [ ] `resolveHref` for any `[param]` / `:param` in map  
- [ ] Old local filter removed or gated  
- [ ] Smoke test passed  

---

## Related

- Index intents: skill **cmdk-saas-index**  
- Install skills: `npx cmdk-saas install` or `npx cmdk-saas install --skill integrate`  
- Edit phrases in cmdk-saas dashboard after index  

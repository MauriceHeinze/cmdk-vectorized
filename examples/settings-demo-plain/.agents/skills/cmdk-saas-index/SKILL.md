---
name: cmdk-saas-index
description: Exhaustively index an app’s pages and user intents for cmdk-saas. Builds a full sitemap first, deep-scans every page, writes intent-map.json, uploads to the ingest API. Never skip pages or actions to save tokens.
---

# cmdk-saas-index

Index **all** navigable pages and user actions in this repository for **cmdk-saas** semantic command search.

## Non-negotiables

1. **Completeness over tokens.** Never skip pages, menus, or actions to save context.
2. **Sitemap first**, then **one node at a time**. Do not generate a partial intent map from “top routes only”.
3. **Code-backed only.** Do not invent features that are not in the codebase.
4. **Do not** generate `llms.txt` in the consumer app.
5. **Do not** change unrelated product behavior while indexing.

## Env (required before upload)

```bash
export CMDK_API_BASE_URL="https://your-cmdk-saas-host"   # or http://localhost:3000
export CMDK_INGEST_KEY="ck_ingest_…"
```

Fail hard if either is missing when you reach the upload step.

## Artifacts

| Path | Purpose |
|------|---------|
| `public/cmdk-sitemap.json` | Complete list of pages/nodes + progress status |
| `public/cmdk-shards/<nodeId>.json` | Per-page intent shards (resume-friendly) |
| `public/intent-map.json` | Merged intents (ingest payload `intents` array) |
| `public/cmdk-index-report.json` | Coverage report |

---

## Phase 0 — Prerequisites

- Confirm this is an app repo (routes / UI exist).
- Load this skill fully before starting.
- If `public/cmdk-sitemap.json` already has `pending` nodes, **resume Phase 2** instead of restarting.

---

## Phase 1 — Build complete sitemap

**Output:** `public/cmdk-sitemap.json`

```json
{
  "generatedAt": "2026-08-03T00:00:00.000Z",
  "framework": "next-app-router",
  "nodes": [
    {
      "id": "settings.billing",
      "path": "/settings/billing",
      "sourceFiles": ["src/app/settings/billing/page.tsx"],
      "titleHint": "Billing",
      "section": "settings",
      "dynamic": false,
      "authLikely": true,
      "kind": "page",
      "status": "pending",
      "intentIds": []
    }
  ]
}
```

### Discover nodes (union of ALL of these)

1. **Filesystem routes**
   - Next.js App Router: every `**/app/**/page.tsx` (and `page.jsx` / `page.mdx` if present)
   - Pages Router: every `pages/**/*.tsx` excluding `_app`, `_document`, api
   - React Router / TanStack Router: every declared route path
2. **Nav graphs** — SideNav, TopNav, footer, settings subnav, mobile drawers
3. **Programmatic navigation** — `href`, `to`, `router.push(`, `Link` targets in shared layouts
4. **Major action surfaces** as virtual nodes (`kind: "action-surface"`) when they are primary destinations (e.g. invite modal used globally)

### Rules

- Include dynamic routes as patterns (`/projects/[id]`) with `"dynamic": true`
- Include auth-gated app areas
- Set every new node `"status": "pending"`
- **Forbidden:** “representative sample”, “top N routes”, “skip boring settings”

### Parameterized / tenant URLs (mandatory)

User- or account-specific segments must **never** be stored as live values.

| Bad (concrete) | Good (template) |
|----------------|-----------------|
| `/#/admin/6a3944c99a65211d404f9a8f/channels/chat-widget` | `/#/admin/[accountId]/channels/chat-widget` |
| `/workspaces/ws_abc/settings` | `/workspaces/[workspaceId]/settings` |

Rules:

1. Prefer framework dynamic segments as-is: Next `[id]`, React Router `:id` → normalize to **`[paramName]`** in `href` / sitemap `path`.
2. If you only see a live URL (browser, sample data, long hex/uuid in path), **replace** that segment with a named placeholder (`[accountId]`, `[workspaceId]`, `[userId]`, …).
3. Put param names on the node/intent: `"meta": { "params": ["accountId"] }` when useful.
4. Do **not** copy the current session’s id into the intent map.
5. Resolving placeholders is the **frontend’s** job via `resolveHref` (see skill **cmdk-saas-integrate**).

### Gate before Phase 2

- `nodes.length >= 1`
- Count filesystem route files; if filesystem count is clearly higher than sitemap page nodes, **expand the sitemap** before continuing
- Report: `Sitemap nodes: N`

---

## Phase 2 — Iterate EVERY pending node

For each node with `"status": "pending"`:

1. Read **all** `sourceFiles` (and closely related colocated components/modals imported by the page)
2. Extract:
   - **navigation** intents: page itself + in-page tabs/sections with routes
   - **action** intents: buttons, menu items, destructive actions, exports, invites, toggles, form primary submits that represent user goals
3. Write shard `public/cmdk-shards/<node.id>.json` as an array of intents
4. Update node: `"status": "done"`, `"intentIds": [...]`
5. Persist updated `cmdk-sitemap.json` often

### Intent shape (ingest contract)

```json
{
  "id": "settings.billing.change-plan",
  "type": "navigation",
  "title": "Change plan",
  "description": "Upgrade, downgrade, or view the current subscription",
  "href": "/settings/billing",
  "phrases": ["upgrade plan", "change subscription", "billing plan"],
  "keywords": ["billing", "plan", "subscription"],
  "section": "settings"
}
```

```json
{
  "id": "team.invite",
  "type": "action",
  "title": "Invite teammate",
  "description": "Send an email invite to join the workspace",
  "actionKey": "team.invite",
  "phrases": ["invite user", "add teammate", "send invite"],
  "keywords": ["invite", "team", "member"],
  "section": "team"
}
```

### Anti-token-saving (mandatory)

- Do **not** invent titles without reading source
- Do **not** stop because the context window is large — finish the current node, save sitemap, continue remaining `pending` nodes in the next turn
- Do **not** omit dropdown / overflow menu actions
- Do **not** merge unrelated pages into one vague intent
- Prefer **many precise intents** over few broad ones
- At least one **navigation** intent per page node (unless pure `action-surface`)
- If the page has interactive controls, produce related **action** intents

### Resume

- Re-open `cmdk-sitemap.json`
- Process only `pending` (and `error` if any)
- Never bulk-reset `done` without reason

---

## Phase 3 — Merge + completeness gate

1. Merge all shards → `public/intent-map.json` (JSON array of intents)
2. Run checks — **block upload** if any fail:

| Check | Fail condition |
|-------|----------------|
| Coverage | Any node `status` is `pending` or `error` |
| Nav coverage | Page node has zero navigation intent for its `path` |
| Duplicates | Duplicate intent `id` |
| Schema | navigation missing `href`; action missing `actionKey`; empty title/id |
| Invented routes | navigation `href` not represented in sitemap (except true external URLs) |
| Concrete tenant ids | `href` contains a long hex/uuid segment that should be a `[param]` placeholder |

3. Write `public/cmdk-index-report.json`:

```json
{
  "sitemapNodes": 0,
  "nodesDone": 0,
  "nodesPending": 0,
  "intentCount": 0,
  "navigationCount": 0,
  "actionCount": 0,
  "warnings": []
}
```

4. Only if gate passes → Phase 4

---

## Phase 4 — Upload to cmdk-saas

Build payload:

```json
{
  "mode": "replace",
  "version": "git:SHORTSHA",
  "intents": []
}
```

- **First full index** or major IA rewrite: `"mode": "replace"`
- **Incremental** (diff re-index): `"mode": "upsert"` + optional `"deletedIds": ["..."]`

```bash
curl -sS -X POST "$CMDK_API_BASE_URL/api/v1/ingest/intents" \
  -H "Authorization: Bearer $CMDK_INGEST_KEY" \
  -H "Content-Type: application/json" \
  -d @public/intent-map.payload.json
```

If `intent-map.json` is a bare array, wrap it into `{ "mode", "version", "intents" }` as `intent-map.payload.json`.

Optional self-check:

```bash
curl -sS "$CMDK_API_BASE_URL/api/v1/ingest/status" \
  -H "Authorization: Bearer $CMDK_INGEST_KEY"
```

---

## Phase 5 — Report to the user

Print:

- Sitemap node count, done/pending
- Intent totals (nav / action)
- API `upserted` + `activeCount`
- Any `warnings`
- Remind: open dashboard **Intents** / **Index app** to verify
- Client: use skill **cmdk-saas-integrate** (or `npx cmdk-saas install` which installs both skills) to wire `cmdk-vectorized` + `resolveHref`

---

## Diff-aware re-index

1. Update sitemap from git diff of routes/nav (and/or full rescan of route files)
2. Mark **changed or new** nodes `pending`
3. Mark removed paths for intent deletion
4. Phase 2 only for pending nodes — still **full deep scan** per node
5. Merge, gate, then `upsert` (+ `deletedIds`)

---

## Intent ID conventions

- Stable, dotted: `section.feature` or `section.feature.action`
- Same id = same command forever (safe for upserts)

---

## What “done” means

You are **not** done when “a few important pages” are indexed.  
You are done when:

1. Every sitemap node is `done`
2. Completeness gate passes
3. Ingest API returns success
4. User gets a clear coverage report

---
name: cmdk-vectorized-integrate
description: Integrate cmdk-vectorized search and optional speech input into a React command palette.
---

# cmdk-vectorized Integration

Wire vector search into a React command palette. Ranking comes from a search endpoint, not from an LLM or local cmdk filtering.

## Choose one track

- Drop-in: mount AICommandPalette and optionally import cmdk-vectorized/styles.css.
- Headless: combine useAICommand or useAICommandPalette with the app's own cmdk UI.

## Integration

1. Install cmdk-vectorized, cmdk, react, and react-dom.
2. Point endpoint at SupaSearch with a publishable Bearer key, or implement GET /api/command-search with createCommandSearchHandler from cmdk-vectorized/search-handler.
3. Pass app-owned navigate and actions handlers.
4. Set shouldFilter={false} on custom Command components so cmdk preserves vector ranking.
5. Add useCommandVoice only when browser speech input is wanted.

## Result contract

- Navigation: { id, type: "navigation", title, href, score? }
- Action: { id, type: "action", title, actionKey, href?, score? }

Use href or actionKey to execute results; never infer behavior from id. Keep credentials server-side. Do not change unrelated app behavior or generate llms.txt files.

Full API: https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/api.md

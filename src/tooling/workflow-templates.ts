export const INTENT_SKILL = `---
name: cmdk-vectorized
description: Generate cmdk-vectorized intent-map artifacts for the current app.
---

# cmdk-vectorized Intent Map

Inspect the app and write:

- public/intent-map.json
- public/intent-map.csv

## Discovery

Read route definitions, navigation, pages, command palettes, forms, tabs, buttons, selects, toggles, and explicit settings metadata. Capture tasks a user can actually perform. Prefer source metadata over inference and omit optional values you cannot verify.

## JSON contract

Each array item must contain recordType, section, commandId, label, phrases, keywords, description, and actionType. It may also contain path, setValue, or stateKey. Phrases and keywords are string arrays; all other fields are strings.

Command IDs must be stable and unique. Paths must resolve to real app routes. Action records must describe an implemented interaction, not a hypothetical feature.

## CSV contract

Use these columns in order:

recordType,section,commandId,label,path,phrases,keywords,setValue,description,actionType,stateKey

Join phrases and keywords with \` | \` and escape CSV cells correctly.

## Constraints

- Do not change application behavior or source code.
- Do not create llms.txt files.
- Do not upload anything.
- Validate both files against the contract before finishing.
`;

export const INTEGRATION_BODY = `# cmdk-vectorized Integration

Wire vector search into a React command palette. Ranking comes from a search endpoint, not from an LLM or local cmdk filtering.

## Choose one track

- Drop-in: mount AICommandPalette and optionally import cmdk-vectorized/styles.css.
- Headless: combine useAICommand or useAICommandPalette with the app's own cmdk UI.

## Integration

1. Install cmdk-vectorized, cmdk, react, and react-dom.
2. Point endpoint at SupaSearch with a publishable Bearer key, or implement GET /api/command-search with createCommandSearchHandler from cmdk-vectorized/server.
3. Pass app-owned navigate and actions handlers.
4. Set shouldFilter={false} on custom Command components so cmdk preserves vector ranking.
5. Add useCommandVoice only when browser speech input is wanted.

## Result contract

- Navigation: { id, type: "navigation", title, href, score? }
- Action: { id, type: "action", title, actionKey, href?, score? }

Use href or actionKey to execute results; never infer behavior from id. Keep credentials server-side. Do not change unrelated app behavior or generate llms.txt files.

Full API: https://github.com/MauriceHeinze/cmdk-vectorized/blob/main/docs/api.md
`;

export const INTEGRATION_SKILL = `---
name: cmdk-vectorized-integrate
description: Integrate cmdk-vectorized search and optional speech input into a React command palette.
---

${INTEGRATION_BODY}`;

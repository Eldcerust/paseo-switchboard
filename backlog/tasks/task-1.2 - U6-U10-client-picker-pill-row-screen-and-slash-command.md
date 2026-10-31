---
id: TASK-1.2
title: 'U6-U10: client picker, pill, row, screen and slash command'
status: Done
assignee: []
created_date: '2026-10-31T05:40:00Z'
updated_date: '2026-10-31T06:16:00Z'
labels: []
dependencies: []
parent_task_id: TASK-1
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Client half (React Native primitives only, theme colors, compact layout). Files under C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard. Templates (read-only): C:\Users\Alvin\.paseo\plugin-sources\paseo-baton client/baton-pill.ts, client/baton-row.tsx, client/open-agent.tsx; skills plugin client/pill.tsx and client/popover.tsx at C:\Users\Alvin\.paseo\plugins\skills\2edad1a3-79d5-46c1-b4e1-6c641beda75c\node_modules\@gpambrozio\paseo-skills.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U6: client/targets.ts - pure functions: build the target list from a providers snapshot (only enabled and available providers, every model, each model's thinking options and each provider's modes, defaults, the source agent's current target flagged), resolve default effort and mode for a chosen model, and parse '/switch <provider>/<model> [effort]' arguments including model ids that contain a slash
- [x] #2 U7: client/picker.tsx - popover UI: providers with their models, effort choice (model default preselected), mode choice (source agent's mode preselected when the target provider offers it), a running-agent warning, a Switch now button with pending and error states, closes and opens the new agent on success
- [x] #3 U8: client/switch-pill.tsx - one composer pill per top-level, non-archived agent using the owned agents.list subscription pattern, cleaned up on teardown, popover behavior hosting the picker
- [x] #4 U9: client/switched-row.tsx and client/open-agent.tsx - timeline renderer for kind 'switched' (shows target label, effort and a pressable that opens the new agent) and the screen that opens an agent by id
- [x] #5 U10: index.client.tsx - wires pills, renderer, screen and the /switch slash command (context 'agent'; unknown provider, model or effort throws a clear message; no args throws a usage message); scaffold greeting wiring removed
- [x] #6 Z3: done by reading paseo.providers.snapshot() at runtime; no hardcoded provider or model lists in source
- [x] #7 Z4: done by React Native primitives only with every Text colored from theme.colors and layout.compact respected; mobile audit grep clean
- [x] #8 Search: rg -n 'greeting' client index.client.tsx returns nothing
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U6: client/targets.ts:5, :19, :26; full npm test passed 3 target tests and 13 slash tests, including nested model ids and runtime additions.

U7: client/picker.tsx:17 implements live query, all provider/model choices, effort/mode, notice, pending/error state and navigation. Typecheck exit 0; manual source review clean; live load reserved for Claude.

U8: client/switch-pill.tsx:6 owns agents.list subscription with AbortSignal, snapshot reconciliation and idempotent cleanup; excludes archived agents and parent labels. Typecheck exit 0.

U9: client/switched-row.tsx:5 and client/open-agent.tsx:7 show target/effort and route to replacement using string params. Typecheck exit 0; manual source review complete.

U10: index.client.tsx:8 wires pill, renderer, screen and agent slash command; bad targets and no-argument usage covered by 13 passing slash tests.

Z3: client/picker.tsx:25 and index.client.tsx:16 call live providers.snapshot; shared/catalog.ts validates runtime entries. Required hardcoded-provider rg returned no matches, exit 1.

Z4: required mobile rg on client/ returned no matches, exit 1. Every Text uses theme colors; spacing uses compact layout. No client/web.ts remains.

Search: rg -n -i greeting client index.client.tsx returned no matches; exit 1.
<!-- SECTION:NOTES:END -->

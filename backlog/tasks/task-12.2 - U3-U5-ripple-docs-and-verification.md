---
id: TASK-12.2
title: 'U3-U5: ripple, docs and verification'
status: Done
assignee: []
created_date: '2026-10-31T09:02:00Z'
updated_date: '2026-10-31T09:12:00Z'
labels: []
dependencies: []
parent_task_id: TASK-12
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prove the removal is complete and caused no regression. Check docs claims, confirm no other client file depended on the picker's removed helpers, and run the full checks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U3: README.md and OVERVIEW.md make no claim about a pinned search bar or an internal picker scroller; if they do, correct only that claim, otherwise prove byte-identical with git diff --exit-code
- [x] #2 U4: no other file imports useWindowDimensions or relied on the picker's height helpers; rg -n 'useWindowDimensions|panelMaxHeight|listMaxHeight' client server shared returns nothing
- [x] #3 U5: npm run typecheck exits 0; full npm test exits 0 with 84 tests across 8 files; mobile audit rg returns nothing
- [x] #4 Z2: done by reproducing the real commands in full, not filtered runs or grep-as-proof
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U3: README.md:15 and OVERVIEW.md:7 - both documents read in full; neither promises a pinned search bar, internal picker scroller or fixed-height list. git diff --exit-code -- README.md OVERVIEW.md returned no output, exit 0; baseline SHA256 comparison also confirms both byte-identical.

U4: client/picker.tsx:6,56-58 - rg -n 'useWindowDimensions|panelMaxHeight|listMaxHeight' client server shared index.client.tsx index.server.ts and the subtask client/server/shared version returned no output (exit 1). SHA256 inventory of all 29 project files shows only client/picker.tsx changed.

U5: client/picker.tsx:114 - npm run typecheck exited 0 (tsc --noEmit); full npm test exited 0: Test Files 8 passed (8), Tests 84 passed (84), Duration 4.20s. Exact mobile audit and rg -n 'RegExp' client/ returned no output (exit 1). Quote-delimited provider-id audit using regex hex quote delimiters returned no output (exit 1); initial PowerShell quote-stripping false positives are recorded in TASK-13.

Z2/Z3/Z4: client/picker.tsx:6,58,107-171 - full typecheck and unfiltered test suite executed, complete picker diff and final source reread. Title, running notice, search/Clear, query states, provider headers/counts/models/current marker, Selected, Effort, Mode, mutation error and Switch now retain order and behavior. No test or helper edits. Enumeration is empty; exact hidden inventory remains 127 (98 .git plus 29 project files), and explicit .git-excluded inventory is 29; see TASK-13. No separate lint or build scripts exist (npm run/package.json). Live reload and manual scrolling remain reserved for Claude.

Claude audit: README.md and OVERVIEW.md hashes match the pre-dispatch snapshot; only client/picker.tsx and backlog/ changed; inventory excluding .git is 29. Independent typecheck exit 0 and full npm test 84/84; mobile, provider-id and RegExp audits clean. Verified done.
<!-- SECTION:NOTES:END -->

---
id: TASK-15.2
title: 'U4: verification and ripple'
status: Done
assignee: []
created_date: '2026-10-31T09:20:00Z'
updated_date: '2026-10-31T09:33:00Z'
labels: []
dependencies: []
parent_task_id: TASK-15
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prove the shrink-wrap layout and confirm no behaviour, docs or scope regressions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U4: npm run typecheck exits 0; full npm test exits 0 with 84 tests; mobile, provider-id and RegExp audits are clean
- [x] #2 U5: README.md and OVERVIEW.md remain byte-identical; only client/picker.tsx and backlog/ change
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U4: client/picker.tsx:60-65,114-183 - npm run typecheck exited 0 (tsc --noEmit). Full unfiltered npm test exited 0: Test Files 8 passed (8), Tests 84 passed (84), Duration 4.43s. Mobile audit, quote-delimited provider-id audit (claude/codex/opencode/pi/copilot), and rg -n RegExp client/ all returned no matches (exit 1). TypeScript AST comparison against the pre-edit snapshot passed for every existing non-layout node and attribute. Full git diff read; inherited TASK-12 work preserved. No build/lint scripts exist (package.json scripts contains only typecheck and test). Tooling observations filed in TASK-16; no test files edited.

U5: README.md and OVERVIEW.md read completely; neither claims a fixed popover height or internal list scroller (rg returned no matches). git diff --exit-code -- README.md OVERVIEW.md exited 0. SHA256 before/after identical: README 80e314d37bf3ed69bcddc2ce68e3f8e8836e5d808646faaddeb3f239ec44d50f; OVERVIEW 14ce99e6ecf5eceebe815aef85e778f5f7ffb13aac9962e951c94306cfeb17e5. rg --files --hidden excluding node_modules, backlog, test/.tmp and .git enumerated 29 files. Hash comparison of all files since dispatch confirms only client/picker.tsx and authorized Backlog files changed; existing TASK-12..14 changes remain intact.

Claude audit: independent typecheck exit 0; full npm test 8 files/84 tests; mobile and RegExp audits clean; README/OVERVIEW hashes match the pre-dispatch snapshot; only client/picker.tsx and backlog changed. Live checks: shrink-wrap, pinned footer, stable width, multi-provider collapse (Claude collapsed while Codex stayed expanded). Verified.
<!-- SECTION:NOTES:END -->

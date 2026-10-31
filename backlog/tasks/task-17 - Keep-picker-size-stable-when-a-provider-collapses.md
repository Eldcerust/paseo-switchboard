---
id: TASK-17
title: Keep picker size stable when a provider collapses
status: In Progress
assignee: []
created_date: '2026-10-31T09:49:00Z'
updated_date: '2026-10-31T13:07:00Z'
labels:
  - bug
dependencies: []
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User report: with the shrink-wrap body, collapsing a provider minimizes/closes the whole window instead of only collapsing that provider. Revert to a stable body size, keep the footer pinned, stop the press event from reaching the host dismiss handler, and show an empty-state hint when all providers are collapsed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: the popover body keeps a stable height and width while a provider is toggled; it never resizes or closes on collapse
- [x] #2 AC2: collapsing a provider removes only that provider's model rows; other expanded providers stay expanded and the footer stays pinned
- [x] #3 AC3: when every provider is collapsed, the list shows a clear hint instead of a silent blank area
- [x] #4 AC4: the provider header press stops propagation so the host popover is not dismissed
- [x] #5 AC5: npm run typecheck exits 0, full npm test passes 84 tests, only client/picker.tsx changes, audits clean
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: live web client measured popover 416x438 with OpenCode expanded and 416x438 after collapsing it - no resize, popover stayed open. AC2: collapse OpenCode removed only its rows; footer stayed at y=543; expand Claude/Codex unaffected. AC3: 'All providers are collapsed. Expand one to choose a model.' appears when all are collapsed and disappears on expand. AC4: provider header onPress now calls event.stopPropagation(). AC5: npm run typecheck exit 0; npm test 84/84; mobile/RegExp audits clean; only client/picker.tsx changed.

Superseded by TASK-18: the host still dismissed the popover on provider collapse even with a stable size. The picker now opens as a screen; do not treat the popover layout as the current surface.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reverted the shrink-wrap body to a stable height sized from the host cap, kept the footer pinned and the width stable, added event.stopPropagation on provider headers, and an empty-state hint when all providers are collapsed. Verified live: size unchanged on collapse, popover stays open, footer fixed. Typecheck 0, 84/84 tests.
<!-- SECTION:FINAL_SUMMARY:END -->

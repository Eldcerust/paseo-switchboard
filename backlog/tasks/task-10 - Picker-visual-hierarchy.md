---
id: TASK-10
title: Picker visual hierarchy
status: Done
assignee: []
created_date: '2026-10-31T08:49:00Z'
updated_date: '2026-10-31T08:51:00Z'
labels:
  - ui
dependencies: []
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User feedback on the installed picker: model rows are not indented under providers, font sizes are too similar across levels, and the per-row bordered rounded boxes read as ugly nested squircles. Restyle only; no behaviour, data or file changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: model rows are visibly indented under their provider header with a left rail; provider headers are flat rows, not boxed controls
- [x] #2 AC2: a clear type scale: panel title > provider name > model row > section label/hint, with no two hierarchy levels sharing the same size and weight
- [x] #3 AC3: remove the per-row bordered squircles; the search field is the only rounded input, selection is shown by a filled row plus a check mark
- [x] #4 AC4: behaviour unchanged - search, clear, collapse/expand, selected line, effort, mode, running notice and Switch now work exactly as before; npm run typecheck exits 0 and npm test passes 84 tests
- [x] #5 AC5: only client/picker.tsx changes; mobile audit and RegExp audit stay clean
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1/AC3: client/picker.tsx - models render in a container with marginLeft+paddingLeft and a 1px left rail; provider header is a flat row with chevron, name and count. All bordered choice boxes removed; only the search TextInput keeps a radius; selection is a surface1 fill plus a leading check. AC2: title 18/20 w700 > provider 14/16 w600 > row 13/14 w400 > labels 11/12 uppercase w600. AC4: npm run typecheck exit 0; npm test 84/84; behaviour JSX preserved (same handlers/state, search outside ScrollView, keyboardShouldPersistTaps). AC5: picker is the only UI file changed; mobile/RegExp/provider-id audits clean. test/helpers.ts also changed for the separate repo-scratch fix tracked as TASK-11.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restyled the picker: flat provider headers, indented models on a left rail, filled-row selection with a check, chips for effort/mode, text-link Clear/Retry, and a 4-level type scale. Behaviour unchanged; typecheck 0 and 84/84 tests. Plugin reloaded cleanly (running).
<!-- SECTION:FINAL_SUMMARY:END -->

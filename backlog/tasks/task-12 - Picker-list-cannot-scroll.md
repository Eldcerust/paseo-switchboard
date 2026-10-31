---
id: TASK-12
title: Picker list cannot scroll
status: Done
assignee: []
created_date: '2026-10-31T08:59:00Z'
labels:
  - bug
dependencies: []
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User report: the picker list would not scroll after the restyle. Cause: maxHeight on the outer View clamped the panel but left the ScrollView sized to its content, so it had no internal overflow and the host clipped it. Fix: compute panel and list heights from useWindowDimensions and put maxHeight on the ScrollView itself.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AC1: the ScrollView gets its own bounded maxHeight derived from the window height, instead of relying on maxHeight on the outer panel
- [ ] #2 AC2: the search bar stays fixed above the scrolling list and the Switch now button stays reachable
- [ ] #3 AC3: npm run typecheck exits 0, npm test passes 84 tests, and only client/picker.tsx changes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
client/picker.tsx:58-62 computes panelMaxHeight and listMaxHeight from useWindowDimensions; root uses panelMaxHeight and ScrollView style uses maxHeight:listMaxHeight at :110. npm run typecheck exit 0; npm test 8 files/84 tests. Mobile audit clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The list now has its own bounded height, so it scrolls while the search bar and Switch now stay in place. Typecheck 0, 84/84 tests, plugin reloaded cleanly.
<!-- SECTION:FINAL_SUMMARY:END -->

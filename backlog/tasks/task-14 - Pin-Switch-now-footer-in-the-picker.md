---
id: TASK-14
title: Pin Switch now footer in the picker
status: In Progress
assignee: []
created_date: '2026-10-31T09:14:00Z'
updated_date: '2026-10-31T09:15:00Z'
labels:
  - ui
dependencies: []
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User feedback after the host-scroll fix: scrolling works, but Switch now is pushed away by the scroll. Pin the footer: a fixed-height popover body, a single inner list ScrollView, and the footer outside it. Behaviour and content stay unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: the picker body has a bounded height derived from Paseo's 440px popover surface (minus host padding and slack), so the host surface does not scroll
- [x] #2 AC2: the provider/model/effort/mode list scrolls in its own ScrollView while the search row and Switch now stay fixed outside it
- [x] #3 AC3: the Switch now button remains visible at the bottom at all scroll positions and for a long list; loading/error/empty and mutation error states still render
- [x] #4 AC4: typecheck exits 0, full npm test passes 84 tests, only client/picker.tsx changes, and the mobile audit stays clean
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1/AC2: client/picker.tsx:57-63 computes panelHeight from the host's 440px popover cap (min(440, window-16) - 40, leaving 16px slack for the host's 12px padding); root uses height:panelHeight. The list is a host ScrollView with flex:1, minHeight:0 at :119-172; title, search and Switch now are outside it, so the footer is pinned. AC3: loading/error/empty/no-match, mutation error and all content remain; the footer is the last sibling and stays below the list. AC4: npm run typecheck exit 0; full npm test 8 files/84 tests; only client/picker.tsx plus backlog changed; mobile/provider-id/RegExp audits clean. Plugin reloaded: stop->load->ready, running.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pinned the Switch now footer: bounded 440px-derived body, single inner list ScrollView, footer outside it. Typecheck 0, 84/84 tests, plugin reloaded cleanly.
<!-- SECTION:FINAL_SUMMARY:END -->

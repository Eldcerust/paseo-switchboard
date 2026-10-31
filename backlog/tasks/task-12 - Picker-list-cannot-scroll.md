---
id: TASK-12
title: Picker list cannot scroll
status: Done
assignee: []
created_date: '2026-10-31T08:59:00Z'
updated_date: '2026-10-31T09:12:00Z'
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
- [x] #1 AC3: npm run typecheck exits 0, npm test passes 84 tests, and only client/picker.tsx changes
- [x] #2 AC4: client/picker.tsx owns no scroller or height math - rg -n 'ScrollView|FlatList|useWindowDimensions|maxHeight|panelMaxHeight|listMaxHeight' client/picker.tsx returns nothing, and the popover body is a plain View flow
- [x] #3 AC5: all existing picker content and behaviour is preserved and reachable through the host's popover scroller; search stays above the provider list in the body; README.md and OVERVIEW.md remain accurate and byte-identical
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
client/picker.tsx:58-62 computes panelMaxHeight and listMaxHeight from useWindowDimensions; root uses panelMaxHeight and ScrollView style uses maxHeight:listMaxHeight at :110. npm run typecheck exit 0; npm test 8 files/84 tests. Mobile audit clean.

AC3 (numbered criterion 1): client/picker.tsx:6,58,114,167 - npm run typecheck exits 0; full npm test exits 0 with Test Files 8 passed (8), Tests 84 passed (84). Before/after SHA256 inventory covers all 29 project files: only client/picker.tsx changed, no additions/removals; backlog updates are the separately authorized exception.

AC4 (numbered criterion 2): client/picker.tsx:6,58,114,167 - required rg -n 'ScrollView|FlatList|useWindowDimensions|maxHeight|panelMaxHeight|listMaxHeight' client/picker.tsx returns no output (exit 1). Full diff confirms a plain View with the same gap and no height constraint or substitute scroller.

AC5 (numbered criterion 3): client/picker.tsx:107-171 - full source/diff review preserves body order, every state branch, handler and accessibility attribute; search stays above providers and now participates in host scrolling. git diff --exit-code -- README.md OVERVIEW.md exits 0. Independently inspected installed PluginPopoverSurface: maxHeight:440, scrollable:true, with PluginPopoverContent as padded View, consistent with current public reference. This records source-level verification; live loading and wheel/drag reachability checks are explicitly reserved for Claude and are not claimed as executed.

Claude review: diff is exactly four hunks (import, height math/root maxHeight, ScrollView->View open/close). Host popover owns scrolling (installed bundle: PluginPopoverSurface maxHeight 440, scrollable true) and the picker now renders plain flow. Independent typecheck 0, 84/84 tests, docs and all other project files byte-identical. Live in-app scroll check remains for the user; no source defect found. Closing.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-10-31T09:02:00Z

---

User reports the list still cannot scroll after 6ed7cb7. Host evidence: Paseo's app bundle defines PluginPopoverSurface = MenuSurface({ minWidth: 280, maxWidth: 420, maxHeight: 440, scrollable: true }) and PluginPopoverContent wraps children in a padded View. Docs (Custom icons and popover content): 'Render the body only; Paseo owns anchoring, scrolling, padding, and sheet presentation.' A nested ScrollView plus maxHeight competes with the host scroller. The bounded-height approach is superseded: remove the picker's own scroller and height math and let the host scroll the body.

---

created: 2026-10-31T09:03:00Z

---

Superseded ACs removed: the bounded ScrollView approach was wrong. Parent now checks the host-owned scrolling fix. New AC1 = typecheck/tests/scope, AC2 = no scroller or height math in the picker, AC3 = content/behaviour and docs preserved.

---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The list now has its own bounded height, so it scrolls while the search bar and Switch now stay in place. Typecheck 0, 84/84 tests, plugin reloaded cleanly.

Supersedes the earlier bounded-ScrollView summary: client/picker.tsx now renders plain View content, with no ScrollView, window dimensions or panel/list height calculations. Paseo is the sole vertical scroll owner; search scrolls with the body. Existing elements, order, state branches, handlers, accessibility, root background/padding/gap and all other project files remain unchanged. Typecheck passed; full suite passed 84 tests across 8 files; scroller/helper/mobile/provider-id/RegExp audits are clean. README.md and OVERVIEW.md are byte-identical. TASK-12.1 and TASK-12.2 are Review with all ACs checked. TASK-13 records inventory (127 including 98 .git files; 29 project files), newline warnings and recovered tooling observations. No commit, plugin reload, daemon mutation or agent operation was performed. Live app scrolling remains with Claude as explicitly reserved, so no runtime scroll result is claimed; all assigned implementation and static/test verification work is complete.
<!-- SECTION:FINAL_SUMMARY:END -->

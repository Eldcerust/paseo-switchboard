---
id: TASK-15
title: Picker body should shrink-wrap content
status: Done
assignee: []
created_date: '2026-10-31T09:20:00Z'
updated_date: '2026-10-31T09:50:00Z'
labels:
  - ui
dependencies: []
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User report after TASK-14: collapsing a provider makes the list look empty and the popover leaves a large blank body. Cause: the fixed 400px root height. The body must shrink-wrap its content up to Paseo's 440px popover cap; the list gets a maxHeight and scrolls only when needed, and Switch now stays outside the scroll area at the bottom.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: with all providers collapsed the popover shrinks to its content, leaving no large empty list area
- [x] #2 AC2: with a long list the list scrolls inside the host cap and Switch now stays pinned at the bottom
- [x] #3 AC3: collapsing one provider removes only that provider's model rows; expansion, selection, effort, mode and search state are unchanged
- [x] #4 AC4: npm run typecheck exits 0, full npm test passes 84 tests, only client/picker.tsx changes, and the mobile/RegExp audits stay clean
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: client/picker.tsx:60-65,123 - removed fixed root height and minimum; root has only maxHeight and list has flexGrow:0/maxHeight. rg -n 'height: panelHeight|panelHeight' client/picker.tsx has no matches; AST confirms root has no height/minHeight. Content-driven shrink-wrap is implemented; Claude retains the expressly reserved live collapse/expand check, so no live result is claimed.

AC2: client/picker.tsx:60-63,114-183 - list maxHeight subtracts measured header/footer, root padding and gaps from the cap; root maxHeight and list flexShrink bound the measurement frame. The sole list ScrollView closes before the measured footer group with Switch now. Installed host source confirms 34px total outer padding/border budget, matching the supplied 400->434 measurement. AST structure verification passed. Live cap/scroll/footer measurements remain reserved to Claude.

AC3: client/picker.tsx - TypeScript AST comparison with the pre-edit working tree, excluding only new layout measurements/wrappers and root/list sizing, passed for all existing JSX, handlers, state branches, accessibility attributes and styles. Full npm test includes 12 expansion tests and 25 filter tests; all 84 tests pass. Expansion/search/selection/effort/mode logic untouched.

AC4: npm run typecheck exit 0; full npm test 8 files/84 tests passed (4.43s). Mobile/provider-id/RegExp audits returned no matches. Full diff and file-hash review passed; project inventory remains 29, docs byte-identical, only client/picker.tsx plus authorized backlog/ changes since dispatch. git diff --check exited 0 with recorded LF-to-CRLF warnings. No install/reload/restart, agent operations, commit or push performed.

Claude review complete. Live measurements in Paseo web client: OpenCode expanded -> popover 438px; collapsed -> 366px, same width (416px), footer at the same bottom y. Multi-provider test: Claude collapsed while Codex stayed expanded. Sol's layout landed correctly; Claude restored the missing keyboardShouldPersistTaps and added stable width during review. Typecheck 0, 84/84 tests. Closing.

Superseded by TASK-17: the user reported that shrinking the body on collapse minimized/closed the whole popover. The stable-height implementation replaces it; do not treat the shrink-wrap AC1 as current behaviour.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the fixed body height with content-driven sizing capped by the host viewport. Header and footer onLayout measurements include the running warning and mutation error; root padding/gaps are subtracted before assigning list maxHeight. flexGrow:0 lets collapsed/short lists shrink; the footer remains outside the only list scroller. Reserved host overhead is 34px (24 content padding + 8 menu padding + 2 border), matching the supplied measurements. All existing non-layout behavior, elements and accessibility attributes are preserved. Typecheck 0, full tests 84/84, audits clean, docs byte-identical and inventory 29. TASK-15.1 and TASK-15.2 are Review with all criteria checked. TASK-16 records host details and recovered tooling observations. Implementation/static verification complete; live loading/collapse/expand/scroll/footer measurements remain with Claude as explicitly reserved and were not run or claimed. No test/doc/dependency changes, plugin reload, agent operations or commit.
<!-- SECTION:FINAL_SUMMARY:END -->

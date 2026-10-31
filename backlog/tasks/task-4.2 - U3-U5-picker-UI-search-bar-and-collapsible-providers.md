---
id: TASK-4.2
title: 'U3-U5: picker UI - search bar and collapsible providers'
status: Done
assignee: []
created_date: '2026-10-31T06:28:00Z'
updated_date: '2026-10-31T08:10:00Z'
labels: []
dependencies: []
parent_task_id: TASK-4
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UI in client/picker.tsx only (React Native primitives, theme colors, compact layout). Files under C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard. The switch flow (mutation, toast, close, open the new agent, running notice, effort and mode choice) must behave exactly as before.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U3: client/picker.tsx - a search bar at the top of the list: React Native TextInput with accessibilityLabel 'Search models', placeholder, autoCapitalize none, autoCorrect off, colors from theme.colors; a clear control shown only when the query is non-empty; when the filtered result is empty show a 'No models match' message that includes the query and offers clearing it
- [x] #2 U4: client/picker.tsx - each provider header is a Pressable button with a chevron glyph, the provider label and its model count, accessibilityRole 'button' and accessibilityState expanded; models render only while the provider is expanded; initial expansion comes from initialExpanded and is computed once when data first arrives and is NOT reset when the snapshot refetches; the user's toggles persist across refetches; while the query is non-empty every provider that has matches is shown expanded (its manual state is ignored, the header shows 'N of M' matches and is not toggleable) and clearing the query restores the manual state
- [x] #3 U5: client/picker.tsx - a 'Selected: <provider label> · <model label>' line above the Effort section so a selection stays visible when its provider is collapsed or filtered out; the ScrollView uses keyboardShouldPersistTaps='handled'; choosing a model, effort and mode and pressing Switch now behaves as before
- [x] #4 Z2: done by deriving the visible list with filterTargets and the expanded set with initialExpanded/toggleProvider (no duplicate filtering logic in JSX), keeping state in the component so a refetch does not reset it; point to the lines
- [x] #5 Z3: done by React Native primitives only, every Text and TextInput colored from theme.colors, layout.compact respected, headers and search input accessible; the mobile audit grep is clean
- [x] #6 Z5: done by leaving server/, shared/, index files, package files and every other client file byte-identical (Claude diffs against the baseline snapshot)
- [x] #7 Search: rg -n 'RegExp' client/ returns nothing
- [x] #8 R2-U12: client/picker.tsx uses isSearching(search) everywhere the old `search.length > 0` check was used; a whitespace-only query behaves exactly like an empty one (providers keep their manual expansion and interactive headers, no Clear control, no 'No models match'); the TextInput keeps the raw text the user typed
- [x] #9 R2-U13: client/picker.tsx initialises expansion through resolveExpansion(expanded, providers) so it happens on the first catalog that has at least one provider, never resets on refetch, and the old `if (query.data && expanded === null) ...` initialisation is gone
- [x] #10 R2-U14: exactly one 'Clear search' control exists in client/picker.tsx and it is rendered if and only if isSearching(search); the 'No models match' message no longer contains its own button
- [x] #11 R2-U15: the search TextInput and the Clear search control are rendered above the ScrollView (outside it, inside the root View) so they stay visible while the list scrolls; keyboardShouldPersistTaps='handled' stays on the ScrollView
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U3: client/picker.tsx:78-87 - inspected TextInput and both Clear search controls; themed text/background/border/placeholder, compact padding and no-match message includes literal query. npm run typecheck exit 0.

U4: client/picker.tsx:32-37 and :89-105 - null state is latched only once when query.data exists; render derives isExpanded from search OR manual membership; search heading is a non-Pressable Text with N of M; toggleProvider updates only manual state; collapsed models are not rendered. npm run typecheck exit 0; expanded/accessibility rg hits :95-96.

U5: client/picker.tsx:39-40, :77, :100-108 - selection still resolves against unfiltered providers; Selected line immediately precedes Effort; keyboardShouldPersistTaps handled. Read baseline diff: mutation, error/toast, close/open, defaultSelection, effort, mode, current marker and running notice unchanged. npm run typecheck exit 0.

Z2: client/picker.tsx:32-37, :90, :97 - initialExpanded only under query.data AND expanded===null; no refetch reset and no search write to manual state. filterTargets derives visibleProviders, toggleProvider creates manual updates. Source reviewed; live host check reserved for Claude.

Z3: client/picker.tsx:56-65, :77-108 - all Text and TextInput colors trace to theme.colors; spacing uses layout.compact. rg -n 'document\.|window\.|localStorage|navigator\.|<[a-z]+[ >]|className=|onClick=' client/ returned no output, exit 1 (no matches); search label and expanded accessibilityState present.

Z5: SHA256 comparison against TEMP/switchboard-r2-baseline-files: Baseline files 27; byte-identical 25; changed 2 (client/picker.tsx, client/targets.ts). Only added files test/filter.test.ts and test/expand.test.ts; current count 29. All prohibited baseline paths identical.

Search: rg -n 'RegExp' client/ returned no output, exit 1 (no matches).

U3 round-2 re-verification: client/picker.tsx:78-87 - reread whole component; raw value/onChangeText preserved; accessible native TextInput is themed, above ScrollView; only one Clear search at :80 (guarded by searching = isSearching(search)), including no-match state whose message at :87 includes raw query. npm run typecheck exit 0; exact mobile audit returns no matches.

U4 round-2 re-verification: client/picker.tsx:33-38 and :90-105 - resolveExpansion initializes only the first nonempty catalog and never replaces a user Set; toggleProvider remains immutable. isSearching alone controls automatic expansion and noninteractive N of M headers; clearing restores manual state. Native header labels/expanded states and current marker unchanged. Full npm test exit 0: 12 expansion cases, 84 total passed.

R2-U12: client/picker.tsx:37, :80, :86, :90 and :93 - all activity decisions use searching = isSearching(search). rg -n 'search\.length' client/picker.tsx returned no output (exit 1, no matches); raw input at :79 unchanged. Full npm test exit 0: 84 passed, including whitespace activity cases.

R2-U13: client/picker.tsx:35-36 - resolveExpansion returns current until a first nonempty catalog initializes once; rg -n 'query\.data && expanded' client/picker.tsx returned no output (exit 1, no matches). Full npm test exit 0: 12 expansion tests including cold start, refetch identity and emptied Set.

R2-U14: client/picker.tsx:80 and :86-88 - rg -n 'Clear search' client/picker.tsx returns exactly one line (:80), guarded by searching = isSearching(search); no-match block contains only its message. npm run typecheck exit 0; full source/diff reread confirmed.

R2-U15: client/picker.tsx:78-81 - rg -n '<TextInput|<ScrollView|keyboardShouldPersistTaps' client/picker.tsx returns TextInput :78 before ScrollView :81 with handled taps retained; Clear :80 is also outside ScrollView. All loading/error/empty/no-match/provider/Selected/Effort/Mode content stays inside the scroll view. npm run typecheck exit 0.

Claude audit (independent): read the full diff and final client/picker.tsx. One 'Clear search' at :80 guarded by isSearching(search); TextInput :78 above ScrollView :81 with keyboardShouldPersistTaps retained; expansion via resolveExpansion at :35, no query.data init left; no search.length; whitespace query renders normal interactive headers. Round-1 behaviour (independent toggles, N of M while searching, Selected line, effort/mode, Switch now) unchanged. Live plugin reloaded: stop -> load -> ready, status running, no errors. Verified done.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-10-31T06:54:00Z

---

Round 2 (Claude review of round 1; all four findings are gaps in Claude's brief, not Sol failures): (1) a whitespace-only query counted as searching (every provider expanded, headers disabled); (2) the no-match state rendered two 'Clear search' buttons; (3) expansion was initialised on the first snapshot even when it had no ready providers, so nothing started expanded; (4) the search bar sat inside the ScrollView and scrolled out of view.

---
<!-- COMMENTS:END -->

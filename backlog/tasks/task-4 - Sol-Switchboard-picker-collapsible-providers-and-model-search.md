---
id: TASK-4
title: 'Sol: Switchboard picker - collapsible providers and model search'
status: Done
assignee: []
created_date: '2026-10-31T06:28:00Z'
updated_date: '2026-10-31T08:10:00Z'
labels: []
dependencies: []
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GOAL: in the Switchboard plugin picker (client/picker.tsx), make each provider section collapsible/expandable and add a search bar that filters the models. USER REQUEST (verbatim): 'make a collapse expand for each provider and a search bar to search for models to use'. Workdir: C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard. BASELINE (2026-10-31, before dispatch): `npm run typecheck` exits 0; `npm test` exits 0 with 6 test files and 47 tests passing (handoff 5, paths 2, repo-facts 2, switch 22, targets 3, slash 13). No lint or build step exists. Baseline files are copied to C:\Users\Alvin\AppData\Local\Temp\switchboard-r2-baseline-files.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: cd workdir; npm run typecheck exits 0 (verify: run it, show the exit code)
- [x] #2 AC2: npm test (full vitest run, no filters) exits 0; all 47 baseline tests still pass and the new test files (test/filter.test.ts, test/expand.test.ts) add tests (verify: show file list and summary line; total must be greater than 47)
- [x] #3 AC3: mobile audit clean (verify: rg -n 'document\.|window\.|localStorage|navigator\.|<[a-z]+[ >]|className=|onClick=' client/ returns nothing)
- [x] #4 AC4: no hardcoded provider ids (verify: rg -n -i '[\x22\x27\x60](claude|codex|opencode|copilot|omp|pi)[\x22\x27\x60]' client server shared index.client.tsx index.server.ts returns nothing)
- [x] #5 AC5: user text is never turned into a RegExp (verify: rg -n 'RegExp' client/ returns nothing) and queries made of regex metacharacters are covered by a passing test
- [x] #6 AC6: scope: only client/picker.tsx, client/targets.ts, test/filter.test.ts, test/expand.test.ts, OVERVIEW.md, README.md and backlog/ changed (verify: Claude diffs against the baseline snapshot; server/, shared/, index.client.tsx, index.server.ts, package.json, package-lock.json, paseo-plugin.json, tsconfig.json, .gitignore and the other client files must be byte-identical)
- [x] #7 AC7: docs: OVERVIEW.md and README.md describe the search bar and the collapsible providers (verify: rg -n -i 'search' OVERVIEW.md README.md and rg -n -i 'collaps|expand' OVERVIEW.md README.md each hit in both files); OVERVIEW.md keeps the listing contract (rg -n '\x{2014}' OVERVIEW.md and rg -n -i 'paseo plugin (install|add)' OVERVIEW.md return nothing)
- [x] #8 AC8: accessibility hooks present (verify: rg -n 'expanded' client/picker.tsx hits an accessibilityState; rg -n -i 'accessibilityLabel=.Search' client/picker.tsx hits the search input)
- [x] #9 AC9: round 2 - full unfiltered npm test exits 0 with more than the 70 round-1 tests, all 70 still passing (verify: show file list and summary line)
- [x] #10 AC10: round 2 scope - only client/picker.tsx, client/targets.ts, test/filter.test.ts, test/expand.test.ts and backlog/ changed since the round-2 baseline; everything else byte-identical (verify: Claude diffs against the snapshot at C:\Users\Alvin\AppData\Local\Temp\switchboard-r3-baseline-files)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: npm run typecheck exit 0 after all changes; output: paseo-switchboard@0.0.0 typecheck / tsc --noEmit.

AC2: npm test (unchanged full vitest run, approved outside sandbox) exit 0: Test Files 8 passed (8), Tests 70 passed (70), Duration 3.75s. All 47 baseline tests plus test/filter.test.ts 17 and test/expand.test.ts 6 passed.

AC3: rg -n 'document\.|window\.|localStorage|navigator\.|<[a-z]+[ >]|className=|onClick=' client/ returned no output, exit 1 (no matches).

AC4: rg -n -i '[\x22\x27\x60](claude|codex|opencode|copilot|omp|pi)[\x22\x27\x60]' client server shared index.client.tsx index.server.ts returned no output, exit 1 (no matches).

AC5: rg -n 'RegExp' client/ returned no output, exit 1 (no matches). test/filter.test.ts:60 covers [, (, backslash, *, ., + and ? as literals; all 17 filter tests passed. Required OR mutation caused 4 failures, then restored AND passed.

AC6: final SHA256 comparison against TEMP/switchboard-r2-baseline-files: 27 baseline files; 23 byte-identical; changed only OVERVIEW.md, README.md, client/picker.tsx and client/targets.ts. Added only test/filter.test.ts and test/expand.test.ts, count 29 excluding node_modules/backlog/test scratch. Backlog modified only via CLI: TASK-4, TASK-4.1, TASK-4.2, TASK-4.3; new noticed TASK-5, TASK-6 and TASK-7.

AC7: rg -n -i 'search' and 'collaps|expand' OVERVIEW.md README.md each hit OVERVIEW.md:7 and README.md:17. rg -n '\x{2014}' OVERVIEW.md and rg -n -i 'paseo plugin (install|add)' OVERVIEW.md returned no output. Old lists-the-enabled wording has no hits.

AC8: rg -n 'expanded' client/picker.tsx includes :95 accessibilityState={{ expanded: isExpanded, disabled: mutation.isPending }}; rg -n -i 'accessibilityLabel=.Search' client/picker.tsx returns :78 TextInput accessibilityLabel Search models.

AC9 round 2: client/targets.ts:20, :42; test/filter.test.ts:8; test/expand.test.ts:5 - unchanged full npm test (approved outside sandbox) exit 0: test/expand.test.ts 12, targets 3, handoff 5, slash 13, paths 2, filter 25, switch 22, repo-facts 2; Test Files 8 passed (8), Tests 84 passed (84), Duration 3.77s. All 70 baseline cases retained unchanged. Final npm run typecheck exit 0 (tsc --noEmit). Both required mutations failed and restored source passed; TASK-8 records all outcomes.

AC10 round 2: direct bytes comparison against TEMP/switchboard-r3-baseline-files plus full unified diff reread: 29 files, identical path sets, no additions/removals; 25 files byte-identical; changed only client/picker.tsx, client/targets.ts, test/filter.test.ts and test/expand.test.ts. README.md, OVERVIEW.md, test/helpers.ts, other tests, server/shared, other client files and package/config/index files identical. Existing cases in both edited tests reconstructed exactly after removing only the new describe blocks and import extensions. Scratch entries 0. Backlog changed only via CLI: TASK-4, TASK-4.1, TASK-4.2 and newly created noticed TASK-8/TASK-9. Final exact mobile, provider-id, RegExp, search.length and old-initialization audits all return no matches.

R2-Z2/Z3: reread the entire final client/picker.tsx and full four-file diff. Unchanged provider toggles/chevrons/counts and expanded accessibility states; search N of M noninteractive headers; manual state restored when cleared; Selected immediately above Effort and Mode; current marker, running notice, defaultSelection, mutation/reset/toast/close/open and Switch now unchanged. Search and sole Clear moved above ScrollView; all required list content remains inside, handled taps retained. Text/Input colors from theme, spacing from layout.compact. No DOM/server imports/new controls or dependencies. Tooling disclosures: TASK-9 prose lost literal quote characters around the id type key through native CLI argument handling; actual source uses the existing TargetProvider id indexed type, whose value type is string, and was verified directly. No runtime/source change was made to accommodate that prose rendering.

Claude review complete. Independent typecheck 0 and 84/84 tests; both required mutations caught in a scratch copy; scope exactly 4 files of 29 with all other files byte-identical; Backlog integrity intact (older tasks untouched, only TASK-4/4.1/4.2 edited plus noticed TASK-8/9). Plugin reloaded cleanly and is running. UI look-and-feel on desktop/mobile still needs the user's eyes; no defects found in code review.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-10-31T06:54:00Z

---

Round 2 (Claude review of round 1; all four findings are gaps in Claude's brief, not Sol failures): (1) a whitespace-only query counted as searching (every provider expanded, headers disabled); (2) the no-match state rendered two 'Clear search' buttons; (3) expansion was initialised on the first snapshot even when it had no ready providers, so nothing started expanded; (4) the search bar sat inside the ScrollView and scrolled out of view.

---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented U1-U8: literal AND model/provider search, immutable expansion helpers, accessible native search/clear/no-match controls, independently collapsible provider sections, first-snapshot expansion preserved across refetches, search-only expansion override and restoration, Selected line, mobile tap handling, and updated usage docs. Full typecheck passed; full suite 70/70 passed across 8 files, retaining all 47 baseline tests. Required AND-to-OR mutation caused 4 failures, then restored source passed. Inventory is 29 files with only two new tests; 23 other baseline files byte-identical and scratch empty. All subtask and parent ACs verified and checked. No implementation items remain. Live daemon/app loading and desktop/mobile/theme interaction are reserved for Claude per task scope; plugin was not installed or reloaded. No build or lint scripts exist. Observations filed as TASK-5 (sandbox EPERM, intentional mutation and missing optional Backlog.md read), TASK-6 (read-only Git line-ending warnings), TASK-7 (initial tool-output truncation followed by chunked rereads). No commits, dependencies, server/shared changes or agent orchestration.

Round 2 fixes all four review findings with isSearching and resolveExpansion pure helpers, one Clear search control, and fixed search controls above the scrolling list. Added 8 activity cases and 6 initialization cases without altering 70 baseline tests. Final typecheck exit 0; full npm test exit 0, 8 files and 84 tests passed; both required mutation runs failed as expected and restored source passed. Every exact audit passes. Inventory remains 29 identical names, 25 files byte-identical and only the four allowed source/test files changed; docs and helpers untouched. All new parent/subtask ACs and reopened U3/U4 verified and checked; TASK-4.1 and TASK-4.2 in Review. Observed sandbox EPERM, intentional mutation failures, output truncation/capture failure, mobile generic-type match and tool elapsed timing documented in noticed TASK-8/TASK-9. No implementation item remains incomplete. Live daemon/app checks reserved for Claude; no installation, reload, commits, dependency/config changes or agent orchestration performed.
<!-- SECTION:FINAL_SUMMARY:END -->

---
id: TASK-4.1
title: 'U1-U2 + U6-U7: pure filter/expand logic and its tests'
status: Done
assignee: []
created_date: '2026-10-31T06:28:00Z'
updated_date: '2026-10-31T08:10:00Z'
labels: []
dependencies: []
parent_task_id: TASK-4
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pure functions in client/targets.ts and their tests. Files under C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard. Existing exports of client/targets.ts (buildTargets, defaultSelection, parseSwitchArgs and the types) must keep their behaviour.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U1: client/targets.ts - export filterTargets(providers, query): trims and lowercases the query, splits on whitespace into terms, empty/whitespace-only query returns the providers unchanged; a model is kept when EVERY term is a literal substring of the lowercased text `${provider.label} ${provider.id} ${model.label} ${model.id}`; providers with no kept model are dropped; the model objects (including `current`) are returned unchanged
- [x] #2 U2: client/targets.ts - export initialExpanded(providers): the Set of provider ids to expand first = the provider containing the model flagged `current`, otherwise the first provider, otherwise an empty Set; and toggleProvider(expanded, id): returns a NEW Set with id added or removed, never mutating its input
- [x] #3 U6: test/filter.test.ts - covers: empty and whitespace-only query, case-insensitivity, model label match, model id match including a slash id such as openai/gpt-6-luna-fast, provider label match, provider id match, two terms in either order, a term that matches nothing, providers dropped when none of their models match, the `current` flag preserved, and metacharacter queries ([ ( \ * . + ?) that must not throw and must match literally
- [x] #4 U7: test/expand.test.ts - covers: initialExpanded with a current model, without a current model, with no providers; toggleProvider add, remove, and non-mutation of the input Set
- [x] #5 Z1: done by implementing the search as the pure function above with literal substring matching (no RegExp built from user text, no matching on the model label only); show the function and the test that proves the multi-term AND behaviour
- [x] #6 Z4: done by running the real functions in vitest; show one mutation you tried (for example make the terms OR instead of AND, or make the match case-sensitive) with the failing test output, then show the restored source passing
- [x] #7 Search: rg -n 'RegExp' client/ returns nothing
- [x] #8 R2-U9: client/targets.ts exports isSearching(query): true only when query.trim() is non-empty (the same normalisation filterTargets uses); '', spaces and tabs/newlines are false
- [x] #9 R2-U10: client/targets.ts exports resolveExpansion(current, providers): returns `current` itself (same reference) whenever it is non-null, never re-initialising it; when `current` is null it returns null while providers is empty, otherwise initialExpanded(providers)
- [x] #10 R2-U11: tests - test/filter.test.ts covers isSearching (empty, spaces, tab/newline false; ' a ' and 'a' true; consistent with filterTargets returning the original array exactly when isSearching is false); test/expand.test.ts covers resolveExpansion (null with no providers stays null; null then a catalog expands the current provider (cold start); an existing Set is returned by reference after a refetch with different providers; a Set the user emptied stays empty and is not re-initialised)
- [x] #11 R2-Z5: done by showing a mutation for each new helper (for example make isSearching use query.length, make resolveExpansion re-initialise an empty Set) with the failing test output, then the restored source passing
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U1: client/targets.ts:20 - npm test exit 0, test/filter.test.ts 17 passed; literal case-insensitive AND filter preserves model objects.

U2: client/targets.ts:33 and :38 - npm test exit 0, test/expand.test.ts 6 passed; current/fallback/empty initialization and immutable toggles.

U6: test/filter.test.ts:9-74 - npm test exit 0; 17 filter tests cover empty input, labels/ids, slash ids, case, all terms, no matches, identity and all seven literal metacharacters.

U7: test/expand.test.ts:6-53 - npm test exit 0; 6 expansion tests cover current, fallback, empty, add/remove/non-mutation and filtering purity.

Z1: client/targets.ts:27 uses terms.every with text.includes; test/filter.test.ts:35 tests codex sol, sol codex and whitespace/case. npm test exit 0, 70 passed.

Z4: Temporarily changed terms.every to terms.some at client/targets.ts:27. Full npm test exit 1: 1 failed | 7 passed files, 4 failed | 66 passed tests; codex sol incorrectly included Terra. Restored every; unchanged full npm test exit 0: 8 passed files, 70 passed tests.

Search: rg -n 'RegExp' client/ returned no output (rg exit 1 means no matches).

R2-U9: client/targets.ts:20 and test/filter.test.ts:8 - isSearching trims only for activity; full npm test exit 0, test/filter.test.ts 25 passed (8 added activity cases); empty, spaces and tab/newline false, a and surrounding-spaces true.

R2-U10: client/targets.ts:42 and test/expand.test.ts:5 - resolveExpansion retains null for an empty/loading catalog; uses initialExpanded on first nonempty catalog; returns every non-null Set by the same reference, including empty. Full npm test exit 0, test/expand.test.ts 12 passed.

R2-U11: test/filter.test.ts:8-17 and test/expand.test.ts:5-53 - 14 new real-function cases on buildTargets(snapshot()) catalogs cover activity/filter array identity, cold start, current/fallback initialization, refetch changes and collapse-all Set identity. Full npm test exit 0: 8 passed files, 84 passed tests; all 70 original cases unchanged (verified against round-2 baseline).

R2-Z5: client/targets.ts:20 and :42 - required full-suite mutations run: isSearching using raw query.length caused 2 failed / 82 passed; restored source passed 84/84. resolveExpansion reinitializing empty sets caused 1 failed / 83 passed; restored source passed 84/84. Final full npm test exit 0: 8 passed files, 84 passed tests. Observations TASK-8 and TASK-9.

Claude audit (independent): npm run typecheck exit 0; npm test exit 0 with 8 files/84 tests (70 baseline + 8 isSearching + 6 resolveExpansion). Scratch-copy mutations: isSearching -> query.length produced 2 failed/82 passed; resolveExpansion re-initialising an empty Set produced 1 failed/83 passed; restored source passed 84/84. Byte comparison against TEMP/switchboard-r3-baseline-files: 29 files, only the four authorised files changed, test/helpers.ts and all other tests byte-identical. Mobile/provider-id/RegExp audits clean. Verified done.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-10-31T06:54:00Z

---

Round 2 (Claude review of round 1; all four findings are gaps in Claude's brief, not Sol failures): (1) a whitespace-only query counted as searching (every provider expanded, headers disabled); (2) the no-match state rendered two 'Clear search' buttons; (3) expansion was initialised on the first snapshot even when it had no ready providers, so nothing started expanded; (4) the search bar sat inside the ScrollView and scrolled out of view.

---
<!-- COMMENTS:END -->

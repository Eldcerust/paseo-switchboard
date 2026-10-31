---
id: TASK-11
title: Isolate test scratch dirs from the repository
status: Done
assignee: []
created_date: '2026-10-31T08:51:00Z'
updated_date: '2026-10-31T08:51:00Z'
labels:
  - test
dependencies: []
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creating the project git repo made test/.tmp a subdirectory of a repository, so the 'tolerates a directory that is not a git repository' test found the parent repo and failed. Move the scratch root to the OS temp dir so tests never inherit the project repo. Found while verifying the picker restyle (TASK-10).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: test scratch directories are created under the OS temp dir, not test/.tmp inside the repo
- [x] #2 AC2: the non-git directory test passes now that the project is a git repository; full suite is 84/84
- [x] #3 AC3: only test/helpers.ts changes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
test/helpers.ts:10 now uses path.join(tmpdir(), 'paseo-switchboard-tests'). npm run typecheck exit 0; npm test 8 files / 84 tests passed. No production code changed.

AC1: test/helpers.ts:10 uses path.join(tmpdir(), 'paseo-switchboard-tests'); no test files live under the repo. AC2: test/repo-facts.test.ts 'tolerates a directory that is not a git repository' passes; full suite 84/84 after the change. AC3: git status shows only test/helpers.ts for this fix.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Scratch dirs now live under the OS temp dir, so tests cannot discover the project repo as a parent. Full suite 84/84.
<!-- SECTION:FINAL_SUMMARY:END -->

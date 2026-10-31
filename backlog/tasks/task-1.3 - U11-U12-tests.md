---
id: TASK-1.3
title: 'U11-U12: tests'
status: Done
assignee: []
created_date: '2026-10-31T05:40:00Z'
updated_date: '2026-10-31T06:16:00Z'
labels: []
dependencies: []
parent_task_id: TASK-1
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vitest tests in C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard\test. Template for style and fakes: C:\Users\Alvin\.paseo\plugin-sources\paseo-baton test/controller.test.ts and test/timeline-summary.test.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U11: test/handoff.test.ts, test/paths.test.ts, test/repo-facts.test.ts, test/switch.test.ts - real switch logic against a fake PaseoApi that records call order: idle switch (write, create, row, archive), running switch (write, archive, poll, create), stop timeout (error, no create), create failure (error names the path, idle source not archived), concurrent switch rejected, provider/model string including slash model ids, effort and mode pass-through, unicode and path-unsafe title never reaching the file name
- [x] #2 U12: test/targets.test.ts and test/slash.test.ts - snapshot to target list (disabled and unavailable providers dropped, current flagged, defaults), argument parsing including slash model ids and bad input
- [x] #3 Z5: done by running the real logic under test with only the Paseo API faked; show one test that fails when the stop-before-create order is swapped (describe the mutation you tried and its failing output)
- [x] #4 Search: npm test (no filter flags) shows every test file listed above ran and passed
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U11: test/handoff.test.ts (5), paths.test.ts (2), repo-facts.test.ts (2), switch.test.ts (22) all passed in full npm test. Real filesystem/git logic, fake Paseo API recording safety order.

U12: test/targets.test.ts (3) and test/slash.test.ts (13) passed in full npm test, covering disabled/unavailable providers, defaults, live additions and both requested examples.

Z5: unchanged full npm test with archive/poll moved after creation failed 7 tests (running/initializing: expected 11 to be less than 7). Correct source restored; final full npm test exit 0, 47 passed.

Search: npm test unfiltered exit 0; all six required test files listed; Test Files 6 passed (6), Tests 47 passed (47). Vitest worker spawn required approved escalation; no tooling config changes.
<!-- SECTION:NOTES:END -->

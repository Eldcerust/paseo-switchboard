---
id: TASK-18
title: Move the picker from the popover to a screen
status: Done
assignee: []
created_date: '2026-10-31T13:07:00Z'
updated_date: '2026-10-31T13:07:00Z'
labels:
  - bug
dependencies: []
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The host popover dismisses itself when the picker content changes, so the picker now opens as a plugin screen with a centered card. The picker receives the agent source fields through screen params, avoiding the workspace-panel-only useAgent hook.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: the Switch pill opens a dedicated picker screen instead of a host popover, so provider toggles cannot dismiss it
- [x] #2 AC2: the screen renders the existing picker card with search, providers, effort, mode and a pinned Switch now footer
- [x] #3 AC3: collapsing a provider changes only that provider's rows; the screen stays open and shows the empty-state hint when all are collapsed
- [x] #4 AC4: npm run typecheck exits 0, full npm test passes 84 tests, mobile/RegExp audits clean
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Live web client: pill navigates to /plugin/switchboard/surface/switchboard-picker; card renders 440x408; OpenCode collapse leaves the screen open, footer fixed and the empty-state hint visible. Typecheck 0; npm test 84/84; audits clean. TASK-17's popover-size fix is superseded by this screen because the host still dismissed the popover.

AC1: client/switch-pill.tsx now registers an action that calls client.openScreen(PICKER_SCREEN_ID) instead of a popover Content. AC2: client/picker.tsx createPickerScreen renders the picker card; index.client.tsx registers the screen. AC3: live web client - OpenCode collapse left the screen mounted with the empty hint; footer fixed. AC4: npm run typecheck exit 0; npm test 84/84; mobile and RegExp audits clean.
<!-- SECTION:NOTES:END -->

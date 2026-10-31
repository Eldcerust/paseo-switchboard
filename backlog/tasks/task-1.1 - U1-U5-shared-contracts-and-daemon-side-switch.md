---
id: TASK-1.1
title: 'U1-U5: shared contracts and daemon-side switch'
status: Done
assignee: []
created_date: '2026-10-31T05:40:00Z'
updated_date: '2026-10-31T06:16:00Z'
labels: []
dependencies: []
parent_task_id: TASK-1
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Server half. Files under C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard. Templates (read-only): C:\Users\Alvin\.paseo\plugin-sources\paseo-baton (server/controller.ts, server/timeline-summary.ts, server/handoff.ts, server/repo-facts.ts, server/paths.ts, shared/baton.ts).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U1: shared/switchboard.ts - Zod contracts via defineRpc: switch RPC (input agentId, provider, model, optional thinkingOptionId and modeId; output agentId, title, handoffPath) and the 'switched' timeline row schema (kind 'switched', version 1)
- [x] #2 U2: server/handoff.ts - builds the handoff markdown mechanically (no model call) from agent snapshot, timeline entries and repo facts: Created line, switched-from/to, original request, user messages and assistant replies (bounded, start and end of long messages kept), files touched, latest plan or task list, errors and failed commands (program and exit code only), repo state, and an 'interrupted mid-turn' note with the last partial assistant text when the source was running
- [x] #3 U3: server/paths.ts and server/repo-facts.ts - handoff file <agent cwd>/.paseo/switchboard/<agentId>-<UTC timestamp without colons>.md (never built from the title), directory created, read-only git facts (branch --show-current, status --short, log -n 8) with core.fsmonitor off and no optional locks, tolerant of non-git folders
- [x] #4 U4: server/switch.ts - orchestration in this exact order: refresh source, refetch timeline, build handoff, write and verify the file, stop the source if running (archive interrupts) and poll until it is no longer running, create the new agent in the same workspace on the chosen provider/model with the chosen thinkingOptionId and modeId, append the 'switched' row to the old agent, archive the old agent if not already archived, return the result; in-flight guard per agent; subagents and archived agents are rejected
- [x] #5 U5: index.server.ts - registers the handler through server.handle and returns cleanup; scaffold greeting handler removed
- [x] #6 Z1: done by archiving the running source and polling refresh() until status is not running (bounded wait, error on timeout) BEFORE creating the new agent; show the code path and the test that proves the order
- [x] #7 Z2: done by writing and verifying the handoff file BEFORE any archive or create call; a create failure surfaces an error that names the handoff path and says whether the original was archived
- [x] #8 Z6: done by building handoff content from real timeline data; the test feeds a multi-message fixture and asserts the original request, a user message, an assistant reply, a touched file and the repo state appear in the output
- [x] #9 Search: rg -n 'greeting' server shared index.server.ts returns nothing
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U1: shared/switchboard.ts:12 and :24 define validated switchboard.switch and switched v1 contracts; npm run typecheck exit 0.

U2: server/handoff.ts:53 builds real snapshot/timeline handoffs; test/handoff.test.ts passed all 5 tests in full npm test.

U3: server/paths.ts:4 and server/repo-facts.ts:12; real persistence and read-only git tests passed (2 paths, 2 repo-facts).

U4: server/switch.ts:91 orchestrates refresh, guard, history, verified file, confirmed stop, workspace create, row, archive; 22 orchestration tests passed.

U5: index.server.ts:5 registers handler with Paseo context and disposes switcher; typecheck exit 0; sample handler removed.

Z1: server/switch.ts:123 archives and polls refresh before create; test/switch.test.ts:30 running/initializing order tests passed. Deliberately moving stop after create caused 7 failures; restored source passed full suite.

Z2: server/paths.ts:11 writes exclusively and verifies stat before mutation; test/switch.test.ts:20, :30, :77 and write-failure tests passed; create errors identify handoff and archive state.

Z6: test/handoff.test.ts:10 feeds multiple real timeline item types and checks first request, later user message, assistant reply, src/login.ts and branch/status; full npm test passed.

Search: rg -n -i greeting server shared index.server.ts returned no matches; exit 1.
<!-- SECTION:NOTES:END -->

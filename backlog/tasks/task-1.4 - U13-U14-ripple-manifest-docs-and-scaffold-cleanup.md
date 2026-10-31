---
id: TASK-1.4
title: 'U13-U14 + ripple: manifest, docs and scaffold cleanup'
status: Done
assignee: []
created_date: '2026-10-31T05:40:00Z'
updated_date: '2026-10-31T06:16:00Z'
labels: []
dependencies: []
parent_task_id: TASK-1
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ripple and packaging for C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard. Listing contract: OVERVIEW.md written for someone deciding whether to install: what it is, how it works, setup, settings and capabilities, what it reads or sends and where, limits. Sentence case, plain facts, no em dashes, no install commands, no badges, changelog, license or marketing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U13: OVERVIEW.md (listing contract) and README.md (install from a local path, use, development commands) written for this plugin; scaffold guidance comment gone
- [x] #2 U14: paseo-plugin.json (id switchboard, name, description, requirements.paseo >=0.14.0), package.json files list covers client/, server/, shared/, both entry files, manifest, OVERVIEW.md, README.md; scaffold sample files client/greeting.tsx, server/greeting.ts, shared/greeting.ts deleted; client/web.ts kept only if something uses it
- [x] #3 Ripple: every import resolves, no relative import of a code file in the plugin root, client does not import server/, server does not import client/, typecheck and full tests still pass after cleanup
- [x] #4 Ripple: the OVERVIEW data section states that the handoff file contains a conversation summary, where it is stored, that no model call or network request is made, and that it should stay out of version control
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U13: OVERVIEW.md:1 and README.md:1 complete. Listing headings and data/limits present; no scaffold comment, em dash or install command in OVERVIEW; required rg searches empty.

U14: node -e manifest/package validation passed: switchboard, paseo >=0.14.0, 8 required package paths. Manifest hash matches supplied baseline. Sample files and unused web bridge removed.

Ripple: npm run typecheck exit 0 and full npm test exit 0 (6 files, 47 tests). Client/server boundary rg searches empty; all runtime imports reviewed.

Ripple: OVERVIEW.md:15 describes conversation summary, workspace-local path, no model/network summary generation and version-control exclusion; reviewed and listing checks passed.
<!-- SECTION:NOTES:END -->

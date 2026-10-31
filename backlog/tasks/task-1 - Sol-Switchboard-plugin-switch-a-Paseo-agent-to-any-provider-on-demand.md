---
id: TASK-1
title: 'Sol: Switchboard plugin (switch a Paseo agent to any provider on demand)'
status: Done
assignee: []
created_date: '2026-10-31T05:39:00Z'
updated_date: '2026-10-31T06:16:00Z'
labels: []
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GOAL: new standalone Paseo plugin 'switchboard' at C:\Users\Alvin\.paseo\plugin-sources\paseo-switchboard that lets the user switch a running or idle agent to ANY provider and model on demand, so Paseo is no longer stuck continuing on the same provider (Baton's Continue from handoff reuses the source agent's provider; an agent's provider cannot be changed in place). USER REQUEST (verbatim): 'with this, import skills plugin for paseo and baton, and figure out with these two templates how to forcefully pass paseo from being stuck with claude to be able to switch on demand'. DECISIONS: standalone plugin (not a patch of Baton), any provider and model, switch now even mid-turn (interrupt, write handoff, new agent in same workspace on chosen target, archive the old one). BASELINE (2026-10-31, before dispatch, scaffold from `paseo plugin init` plus package/manifest edits): `npm run typecheck` exits 0 with no output errors; `npm test` (vitest run) exits 1 with "No test files found" because no tests exist yet; scaffold still has the greeting sample (client/greeting.tsx, server/greeting.ts, shared/greeting.ts). No lint config exists. No build step exists (Paseo bundles the plugin source). Baseline files are copied to $TEMP/switchboard-baseline-files.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 AC1: cd workdir; npm run typecheck exits 0 (verify: run it, show exit code)
- [x] #2 AC2: cd workdir; npm test (full vitest run, no filters) exits 0 and runs tests for handoff builder, switch orchestration, target builder and slash parsing (verify: show test file list and summary line)
- [x] #3 AC3: scaffold greeting sample removed (verify: rg -i greeting --glob '!backlog/**' --glob '!node_modules/**' returns nothing)
- [x] #4 AC4: mobile audit clean (verify: rg -n 'document\.|window\.|localStorage|navigator\.|<[a-z]+[ >]|className=|onClick=' client/ has no hit outside client/web.ts)
- [x] #5 AC5: no hardcoded provider ids in source (verify: rg -n -i '"(claude|codex|opencode|copilot|omp|pi)"' client server shared index.client.tsx index.server.ts returns nothing)
- [x] #6 AC6: paseo-plugin.json valid JSON with id 'switchboard' and requirements.paseo '>=0.14.0'; package.json files list includes every runtime dir/file (verify: node -e)
- [x] #7 AC7: OVERVIEW.md follows the listing contract (verify: rg '—' OVERVIEW.md empty; rg -i 'paseo plugin (install|add)' OVERVIEW.md empty; sections: what it is, how it works, setup, data and limits)
- [x] #8 AC8: nothing changed outside the workdir; paseo-baton and the skills plugin folders untouched (verify: Claude checks)
- [x] #9 AC9: switch order proven by tests: handoff file written before archive or create; for a running source, archive and a confirmed stop before create; a create failure error names the handoff path (verify: the named tests and their output)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC1: npm run typecheck exit 0; output: > tsc --noEmit; no errors.

AC2: npm test exit 0; test/targets.test.ts (3), handoff.test.ts (5), slash.test.ts (13), paths.test.ts (2), switch.test.ts (22), repo-facts.test.ts (2); Test Files 6 passed (6), Tests 47 passed (47).

AC3: required rg -n -i greeting with backlog/node_modules/package-lock exclusions returned no output (exit 1). Explicit runtime search also empty; deleted files verified in baseline comparison.

AC4: required mobile-audit rg on client/ returned no output, exit 1; source review confirms themed Text and compact spacing.

AC5: required quote-delimited provider-id rg on client/server/shared/entries returned no output, exit 1; fixtures are confined to test/.

AC6: corrected Windows-safe node -e check exit 0: AC6 PASS: switchboard; paseo >=0.14.0; all 8 runtime/package paths included. Manifest, lockfile and tsconfig identical to baseline hashes.

AC7: overview em-dash and install-command rg searches empty (exit 1); headings What it is, How it works, Setup, Data, Limits at OVERVIEW.md:1,5,11,15,21.

AC8: direct authored writes outside the workdir: none. No template edits, live agent actions, config writes or daemon-state commands. Claude retains independent outside-folder verification as requested; root has no .git and test scratch is empty.

AC9: running and initializing order tests, real-file verification, timeout/no-create and creation-failure path/archive-state tests passed. Deliberately swapping stop after create made 7 tests fail; restored source passed all 47.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented all U1-U14 as a standalone Switchboard plugin: live provider/model/effort/mode picker, owned per-agent pill, slash parsing, switched row and agent navigation; verified mechanical handoff before mutations, archive-and-poll stop before replacement creation, recovery errors, and same-workspace continuation. Replaced scaffold sample, added listing/README and package entries. Final typecheck exits 0 and full suite passes all 47 tests in 6 files. Deliberate order mutation caused 7 failures and was restored. All required source/listing audits are clean. No authored outside-workdir writes, dependency changes, project commits or live daemon/plugin actions. Live app/daemon loading and independent template-folder comparison remain with Claude by explicit scope; no implementation unit is incomplete. Noticed records TASK-2 and TASK-3 contain local SDK differences and the complete verification/retry history.
<!-- SECTION:FINAL_SUMMARY:END -->

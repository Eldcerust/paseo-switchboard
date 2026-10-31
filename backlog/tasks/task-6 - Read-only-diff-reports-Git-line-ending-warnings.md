---
id: TASK-6
title: Read-only diff reports Git line-ending warnings
status: To Do
assignee: []
created_date: '2026-10-31T06:37:00Z'
labels:
  - noticed
dependencies: []
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
While reviewing TASK-4 changes with git diff --no-index against TEMP/switchboard-r2-baseline-files, Git printed LF will be replaced by CRLF the next time Git touches it for both baseline and current client/picker.tsx and client/targets.ts. This was a read-only comparison in a git-less folder; no Git configuration or line endings were changed to suppress the warning. SHA256 audit confirmed all other baseline files remained byte-identical. No product fix is required; disclose this warning in the final report.
<!-- SECTION:DESCRIPTION:END -->

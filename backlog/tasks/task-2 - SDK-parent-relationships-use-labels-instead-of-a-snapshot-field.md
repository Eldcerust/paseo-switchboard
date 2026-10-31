---
id: TASK-2
title: SDK parent relationships use labels instead of a snapshot field
status: To Do
assignee: []
created_date: '2026-10-31T05:48:00Z'
labels:
  - noticed
dependencies: []
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Installed protocol 0.14.0 AgentSnapshotPayload has no parentAgentId. agent-labels.js defines paseo.parent-agent-id. Switchboard will check the canonical label as well as a defensive parentAgentId field; templates remain unchanged. Also observed Windows rg glob path errors during reference inspection; corrected with directory plus -g. Official llms.txt fetch failed with unsupported text/markdown; local SDK is the reference.
<!-- SECTION:DESCRIPTION:END -->

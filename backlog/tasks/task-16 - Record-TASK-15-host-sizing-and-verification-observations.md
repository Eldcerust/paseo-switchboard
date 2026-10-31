---
id: TASK-16
title: Record TASK-15 host sizing and verification observations
status: To Do
assignee: []
created_date: '2026-10-31T09:27:00Z'
labels:
  - noticed
dependencies: []
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-15 verification observations only; no additional product change requested. Read-only inspection of the installed Paseo 0.14.0 app-dist web bundle confirmed PluginPopoverContent padding 12 on each side, MenuPage paddingVertical spacing[1] (4), and AnchoredSurface borderWidth 1. The supplied root 400 / outer scroller 432 / surface 434 measurements match these extra 34 pixels; the scoped picker cap reserves all 34. Git diff and diff --check emitted LF-will-be-replaced-by-CRLF warnings for client/picker.tsx and the existing TASK-12 working copy, also documented in TASK-13; no line-ending or Git configuration change was made. An initial rg with literal task-15*, task-14*, task-13* path arguments failed on Windows with os error 123; rerun using directory plus -g globs succeeded. The first node -e baseline capture lost double quotes through Windows PowerShell native argument handling and exited 1 with SyntaxError: missing ) after argument list; the orchestration JSON.parse then failed because it received the error text. A literal PowerShell here-string piped to node captured the snapshot successfully. The first extra AST preservation assertion failed because the here-string pipe encoded Unicode glyphs as question marks in the embedded baseline; rerun with Unicode escapes preserved the same assertion and passed. No production glyph changed (file read UTF-8 and baseline hashes retained). Some combined read outputs were truncated; relevant files/sections and full picker diff were reread in smaller outputs. No UI test files were edited under the explicit task scope; live plugin reload, collapse/expand and scrolling checks remain reserved to Claude. Build and lint scripts are absent, as confirmed by package.json scripts; typecheck and the full test suite passed. These observations need no out-of-scope implementation.
<!-- SECTION:DESCRIPTION:END -->

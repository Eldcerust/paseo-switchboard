---
id: TASK-15.1
title: 'U1-U3: shrink-wrap body and measured list cap'
status: Done
assignee: []
created_date: '2026-10-31T09:20:00Z'
updated_date: '2026-10-31T09:33:00Z'
labels: []
dependencies: []
parent_task_id: TASK-15
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the fixed root height with content-driven height up to the host cap. Measure the fixed header and footer chrome (including the running warning and mutation error) and cap the list ScrollView at the remaining space. Footer stays outside the ScrollView.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U1: client/picker.tsx - remove the fixed root height; root height follows content
- [x] #2 U2: client/picker.tsx - list ScrollView gets a maxHeight derived from the host cap minus the measured header/footer chrome; long content scrolls, short content shrinks
- [x] #3 U3: client/picker.tsx - warning and mutation error are accounted for in the chrome measurement so they cannot push the footer or the list past the host cap
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U1: client/picker.tsx:60-65 - root now uses maxHeight: bodyMaxHeight, with no fixed height or minimum. rg -n 'height: panelHeight|panelHeight' client/picker.tsx returned no matches (exit 1); TypeScript AST check confirms no root height/minHeight.

U2: client/picker.tsx:60-63,123,176-183 - list maxHeight is bodyMaxHeight minus measured header/footer and four spacing units (two root pads plus two group gaps). flexGrow:0 allows short lists to shrink; flexShrink:1/minHeight:0 bounds the initial measurement frame. Switch now remains after/outside the only ScrollView. AST structure check passed; live scrolling remains reserved to Claude.

U3: client/picker.tsx:114-122,177-183 - onLayout measures header including the conditional running warning and footer including the conditional mutation error; wrapping/content/width changes update each height. Root maxHeight plus list flexShrink constrains layout while measurements update. Existing text, handlers and accessibility preserved by pre-edit snapshot AST comparison. Host budget includes 24px plugin padding, 8px menu padding and 2px border; see TASK-16.

Claude audit: diff is the expected layout change. Root maxHeight + measured header/footer + list maxHeight; single inner list ScrollView; footer outside. Live web-client check: collapse OpenCode shrank the popover 438 -> 366px with the popover bottom fixed; Switch now stayed at y=543. Sol dropped keyboardShouldPersistTaps=handled from the ScrollView; Claude restored it during review. Claude also added a stable desktop width (392, bounded by window) because the popover width jumped 420 -> 306 when a long provider collapsed; width is now 416 before and after. Verified.
<!-- SECTION:NOTES:END -->

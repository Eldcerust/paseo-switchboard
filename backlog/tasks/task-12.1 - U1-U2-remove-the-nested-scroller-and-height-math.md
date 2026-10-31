---
id: TASK-12.1
title: 'U1-U2: remove the nested scroller and height math'
status: Done
assignee: []
created_date: '2026-10-31T09:02:00Z'
updated_date: '2026-10-31T09:12:00Z'
labels: []
dependencies: []
parent_task_id: TASK-12
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The picker body must stop owning vertical scrolling. Replace the ScrollView with a plain View, delete useWindowDimensions and the panel/list maxHeight calculations, and leave root padding/background/gap as they are. Keep all content in the same order and every Pressable/TextInput behaviour unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 U1: client/picker.tsx - remove ScrollView from the react-native import and replace the <ScrollView> element with a plain <View>; all children (messages, providers, selected line, effort, mode) stay in the same order
- [x] #2 U2: client/picker.tsx - remove useWindowDimensions, windowHeight, panelMaxHeight and listMaxHeight; root style has no maxHeight and no other height constraint
- [x] #3 Z1: done by deleting the picker's scroll owner entirely, not resizing, hiding or nesting it (verify: rg -n 'ScrollView|FlatList|useWindowDimensions|maxHeight' client/picker.tsx returns nothing)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
U1: client/picker.tsx:6,114,167 - git diff -- client/picker.tsx reviewed in full: ScrollView import and element removed; plain View keeps gap: space and every child, handler, branch, label and accessibility attribute in the original order.

U2: client/picker.tsx:56-58 - deleted useWindowDimensions and all window/panel/list height math; root retains backgroundColor, gap and padding. rg -n 'height|Height|overflow|scroll|flexGrow|flexBasis|minHeight' client/picker.tsx returned no output (exit 1, no matches).

Z1: client/picker.tsx:6,58,114 - rg -n 'ScrollView|FlatList|useWindowDimensions|maxHeight' client/picker.tsx and the full six-term enumeration both returned no output (exit 1). Installed app bundle independently confirms PluginPopoverSurface maxHeight:440, scrollable:true; current public reference assigns scrolling to Paseo. No substitute scroller or constraint added.

Claude audit: read the full picker diff. ScrollView import and element are gone; plain View keeps gap:space and every child/branch/handler/accessibility attribute in order. No height/scroll substitute remains (rg for ScrollView|FlatList|useWindowDimensions|maxHeight|panelMaxHeight|listMaxHeight returns nothing). Verified done.
<!-- SECTION:NOTES:END -->

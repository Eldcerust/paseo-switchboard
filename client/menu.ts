/** A measured box inside the picker, in px, relative to the picker's own top-left corner. */
export interface Frame {
  x: number;
  y: number;
  width: number;
}

export const MENU_ITEM_HEIGHT = 34;
/** Tall enough for the longest list the providers offer (about seven options), so a menu does not scroll. */
export const MENU_MAX_HEIGHT = 260;
/** The menu's inner padding and the gap between its items. */
const MENU_PADDING = 4;
const MENU_ITEM_GAP = 2;
/** Clear space between the menu and the button it belongs to. */
const MENU_OFFSET = 6;

/** The height a menu of this many options needs, before it is capped. */
export function menuContentHeight(optionCount: number): number {
  if (optionCount <= 0) return 0;
  return optionCount * MENU_ITEM_HEIGHT + (optionCount - 1) * MENU_ITEM_GAP + MENU_PADDING * 2;
}

/**
 * Where the Effort or Mode menu goes: directly above the row of buttons, as wide as the row, and no
 * taller than the room above it. It is placed from the picker's own frame, not from inside the
 * button, because on iOS and Android a touch only reaches a view that lies inside every one of its
 * parents. A menu hanging out of a 38px button above it could be seen but not tapped or dragged, and
 * its touches fell through to the model list and the sheet underneath.
 */
export function menuPlacement(row: Frame, optionCount: number): { left: number; width: number; top: number; height: number } {
  const room = Math.max(0, row.y - MENU_OFFSET);
  const height = Math.min(MENU_MAX_HEIGHT, menuContentHeight(optionCount), room);
  return { left: row.x, width: row.width, top: Math.max(0, row.y - MENU_OFFSET - height), height };
}

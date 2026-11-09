import { describe, expect, it } from "vitest";
import { MENU_ITEM_HEIGHT, MENU_MAX_HEIGHT, menuContentHeight, menuPlacement } from "../client/menu";

describe("menuContentHeight", () => {
  it("is nothing for no options", () => {
    expect(menuContentHeight(0)).toBe(0);
  });

  it("covers each item, the gaps between them and the padding", () => {
    expect(menuContentHeight(1)).toBe(MENU_ITEM_HEIGHT + 8);
    expect(menuContentHeight(3)).toBe(3 * MENU_ITEM_HEIGHT + 2 * 2 + 8);
  });
});

describe("menuPlacement", () => {
  const row = { x: 12, y: 400, width: 300 };

  it("sits directly above the row, as wide as it and starting where it starts", () => {
    const placed = menuPlacement(row, 3);
    expect(placed).toMatchObject({ left: 12, width: 300, height: menuContentHeight(3) });
    // Its bottom edge is the row's top edge less the clear space.
    expect(placed.top + placed.height).toBe(row.y - 6);
  });

  it("stops growing at the maximum and leaves the rest to scrolling", () => {
    const placed = menuPlacement(row, 12);
    expect(placed.height).toBe(MENU_MAX_HEIGHT);
    expect(placed.top).toBe(row.y - 6 - MENU_MAX_HEIGHT);
  });

  it("shrinks to the room above the row instead of leaving the picker", () => {
    const placed = menuPlacement({ ...row, y: 100 }, 12);
    expect(placed.top).toBe(0);
    expect(placed.height).toBe(94);
  });

  it("never has a negative top or height when the row is at the very top", () => {
    for (const y of [0, 3, 6]) {
      const placed = menuPlacement({ ...row, y }, 4);
      expect(placed.top).toBeGreaterThanOrEqual(0);
      expect(placed.height).toBe(0);
    }
  });

  it("has no height for no options", () => {
    expect(menuPlacement(row, 0).height).toBe(0);
  });
});

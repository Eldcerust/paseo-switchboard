import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { appendInterruption, handoffPathFor, writeHandoff } from "../server/paths";
import { cleanup, scratch } from "./helpers";

let directory: string;
afterEach(async () => { if (directory) await cleanup(directory); });
describe("handoff paths and real file persistence", () => {
  it("uses only a safe id and UTC stamp, creates its directory, and verifies a nonempty file", async () => {
    directory = await scratch("paths");
    const file = handoffPathFor(directory, "source-1", Date.UTC(2026, 9, 31, 5, 30, 12));
    expect(file).toBe(path.join(directory, ".paseo", "switchboard", "source-1-20261031T053012Z.md"));
    await writeHandoff(file, "Actual handoff");
    expect(await readFile(file, "utf8")).toBe("Actual handoff");
    expect((await stat(file)).size).toBeGreaterThan(0);
    await appendInterruption(file, "\nInterrupted mid-turn");
    expect(await readFile(file, "utf8")).toBe("Actual handoff\nInterrupted mid-turn");
  });
  it("rejects traversal and empty content, and never overwrites an earlier handoff", async () => {
    directory = await scratch("paths-safe");
    for (const unsafe of ["../title", "x/y", "x\\y", "x:foo", "😀"]) expect(() => handoffPathFor(directory, unsafe, Date.now())).toThrow("Unsafe");
    expect(() => handoffPathFor("relative", "id", Date.now())).toThrow("absolute");
    const file = handoffPathFor(directory, "id", Date.now());
    await expect(writeHandoff(file, " ")).rejects.toThrow("empty");
    await writeHandoff(file, "first");
    await expect(writeHandoff(file, "second")).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe("first");
    expect(await readdir(path.dirname(file))).toHaveLength(1);
  });
});

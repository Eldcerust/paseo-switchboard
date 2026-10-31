import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { gatherRepoFacts } from "../server/repo-facts";
import { cleanup, scratch } from "./helpers";

const exec = promisify(execFile);
let directory: string;
afterEach(async () => { if (directory) await cleanup(directory); });
describe("read-only repo facts", () => {
  it("tolerates a directory that is not a git repository", async () => {
    directory = await scratch("not-git");
    expect(await gatherRepoFacts(directory)).toContain("Git facts unavailable");
  });
  it("reads real branch, status and last eight commit titles with fsmonitor disabled", async () => {
    directory = await scratch("git-facts");
    const git = (args: string[]) => exec("git", ["-C", directory, ...args], { windowsHide: true });
    await git(["init", "-b", "switchboard-test"]);
    await git(["config", "core.fsmonitor", "missing-fsmonitor-test-command"]);
    for (let index = 1; index <= 9; index++) await git(["-c", "core.fsmonitor=false", "-c", "core.hooksPath=", "-c", "user.name=Switchboard test",
      "-c", "user.email=switchboard@example.invalid", "commit", "--allow-empty", "--no-gpg-sign", "-m", `Fixture commit ${index}`]);
    await writeFile(path.join(directory, "changed.txt"), "test");
    const facts = await gatherRepoFacts(directory);
    expect(facts).toContain("Branch:\nswitchboard-test"); expect(facts).toContain("?? changed.txt");
    expect(facts).toContain("Fixture commit 9"); expect(facts).toContain("Fixture commit 2"); expect(facts).not.toContain("Fixture commit 1");
    expect(facts.split("Last 8 commit titles:\n")[1].split("\n")).toHaveLength(8);
  }, 15_000);
});

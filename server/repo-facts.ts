import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await exec("git", ["-c", "core.fsmonitor=false", "--no-optional-locks", ...args], {
    cwd, timeout: 5000, maxBuffer: 256 * 1024, windowsHide: true,
  });
  return stdout.trim();
}

export async function gatherRepoFacts(cwd: string): Promise<string> {
  const results = await Promise.allSettled([
    git(cwd, ["branch", "--show-current"]),
    git(cwd, ["status", "--short"]),
    git(cwd, ["log", "-n", "8", "--format=%s"]),
  ]);
  const labels = ["Branch", "Status --short", "Last 8 commit titles"];
  if (results.every((result) => result.status === "rejected")) {
    return "Git facts unavailable (not a repository, Git unavailable, or commands failed).";
  }
  return results.map((result, index) => `${labels[index]}:\n${result.status === "fulfilled"
    ? result.value || (index === 0 ? "(detached HEAD or unborn branch)" : "(none)")
    : "(unavailable)"}`).join("\n\n");
}

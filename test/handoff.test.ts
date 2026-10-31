import { describe, expect, it } from "vitest";
import { buildHandoff, cutMiddle, shellProgram, switchTitle } from "../server/handoff";
import { agent, conversation } from "./helpers";

const input = () => ({ agent: agent(process.cwd()), target: { provider: "codex", model: "gpt-6.1-sol" },
  items: conversation, historyCut: false, interrupted: true, now: Date.UTC(2026, 9, 31, 5, 30, 12), repoFacts: "Branch: feature/login\n M src/login.ts\nFix callback" });

describe("mechanical handoff", () => {
  it("uses real timeline messages, original request, files, latest plan, tasks, failures and repo state", () => {
    const document = buildHandoff(input());
    for (const text of ["Created: 2026-10-31T05:30:12.000Z", "Switched from claude/claude-sonnet-5-5 to codex/gpt-6.1-sol",
      "Fix the login redirect", "Also preserve the return URL.", "I fixed the callback", "src/login.ts", "Validate the callback", "[x] Fix callback",
      "[~] Run tests", "npm (exit 1)", "Branch: feature/login", "Interrupted mid-turn", "The return URL fix is complete"]) expect(document).toContain(text);
    for (const secret of ["TOP_SECRET", "PRIVATE TOOL", "SECRET ERROR", "--token"]) expect(document).not.toContain(secret);
  });
  it("keeps the beginning and end of long text and bounds the conversation", () => {
    const long = "START" + "x".repeat(100_000) + "END";
    expect(cutMiddle(long, 100)).toHaveLength(100);
    expect(cutMiddle(long, 100)).toMatch(/^START[\s\S]*END$/);
    const document = buildHandoff({ ...input(), items: Array.from({ length: 50 }, (_, index) => ({ type: "user_message" as const, text: `${index} ${long}` })) });
    expect(document).toContain("Earlier history was cut");
    expect(document.split("## Conversation")[1].split("## Files")[0].length).toBeLessThan(61_000);
    expect(document).toContain("START"); expect(document).toContain("END");
  });
  it("reports history cuts and compaction and handles missing records without invention", () => {
    const document = buildHandoff({ ...input(), historyCut: true, interrupted: false, items: [{ type: "compaction", status: "completed" }] });
    expect(document).toContain("No user request captured"); expect(document).toContain("compaction");
    expect(document).toContain("Earlier history was cut"); expect(document).not.toContain("Interrupted mid-turn");
  });
  it("names only programs, including quoted Windows executables", () => {
    expect(shellProgram('cd repo && "C:\\Program Files\\nodejs\\node.exe" --token secret')).toBe("node.exe");
    expect(shellProgram("TOKEN=secret npm test")).toBe("npm");
    expect(shellProgram("$(secret) --flag")).toBe("command");
  });
  it("limits the entire title to 60 characters without splitting Unicode", () => {
    expect(switchTitle("Fix   login\nextra")).toBe("[Switch] Fix login");
    expect(switchTitle("😀".repeat(100)).length).toBeLessThanOrEqual(60);
    expect(switchTitle(undefined)).toBe("[Switch] Continue task");
  });
});

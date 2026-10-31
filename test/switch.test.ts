import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AgentTimelineItem } from "@getpaseo/protocol/agent-types";
import { createSwitcher } from "../server/switch";
import { switchedRowSchema } from "../shared/switchboard";
import { cleanup, fakePaseo, scratch } from "./helpers";

const target = { agentId: "source-1", provider: "codex", model: "gpt-6.1-sol", thinkingOptionId: "xhigh", modeId: "full-access" };
let directory: string;
let clock: number;
function switcher(options: Parameters<typeof createSwitcher>[0] = {}) {
  return createSwitcher({ now: () => clock, sleep: async (ms) => { clock += ms; }, ...options });
}
beforeEach(async () => { directory = await scratch("switch"); clock = Date.UTC(2026, 9, 31, 5, 30, 12); });
afterEach(async () => { await cleanup(directory); });

describe("real switch orchestration", () => {
  it("idle: writes and verifies the real file before create, appends a row, then archives", async () => {
    const { paseo, state } = fakePaseo(directory);
    const result = await switcher().switchAgent(target, paseo);
    expect(result.title).toBe("[Switch] Fix the login redirect");
    expect(await readFile(result.handoffPath, "utf8")).toContain("Also preserve the return URL.");
    expect(state.events.filter((event) => !event.startsWith("refresh:") && event !== "providers" && !event.startsWith("timeline:")))
      .toEqual(["workspace:workspace-1", "verified-file:create", "create", "row", "verified-file:archive", "archive"]);
    expect(state.created[0].config).toEqual({ provider: "codex/gpt-6.1-sol", thinkingOptionId: "xhigh", modeId: "full-access" });
    expect(state.created[0].prompt).toContain(JSON.stringify(result.handoffPath));
    for (const instruction of ["IN FULL", "git status", "Do not redo finished work", "may have been cut off"]) expect(state.created[0].prompt).toContain(instruction);
    expect(switchedRowSchema.parse(state.rows[0].data)).toMatchObject({ newAgentId: result.agentId, interrupted: false, to: { providerLabel: "Codex", modelLabel: "GPT-6.1 Sol" } });
  });
  it.each(["running", "initializing"] as const)("%s: verifies the file, archives and confirms stopped before create", async (status) => {
    const { paseo, state } = fakePaseo(directory, { status });
    const result = await switcher().switchAgent(target, paseo);
    const archive = state.events.indexOf("archive");
    const confirmedStop = state.events.indexOf("refresh:closed");
    const create = state.events.indexOf("create");
    expect(state.events.indexOf("verified-file:archive")).toBeLessThan(archive);
    expect(archive).toBeLessThan(confirmedStop);
    expect(confirmedStop).toBeLessThan(create);
    expect(state.events.indexOf("verified-file:create")).toBeLessThan(create);
    expect(state.events.filter((event) => event === "archive")).toHaveLength(1);
    expect(await readFile(result.handoffPath, "utf8")).toContain("## Interrupted mid-turn");
    expect(switchedRowSchema.parse(state.rows[0].data).interrupted).toBe(true);
  });
  it("stop timeout names the saved handoff and creates nothing", async () => {
    const { paseo, state } = fakePaseo(directory, { status: "running" });
    state.neverStop = true;
    await expect(switcher({ stopTimeoutMs: 500 }).switchAgent(target, paseo)).rejects.toThrow(/did not stop.*Handoff path:.*source-1-20261031T053012Z.md.*was archived/);
    expect(state.created).toHaveLength(0); expect(state.events).not.toContain("create");
    expect(clock).toBe(Date.UTC(2026, 9, 31, 5, 30, 12) + 500);
  });
  it("detects a turn started during handoff capture and adds its interruption note before archiving", async () => {
    const { paseo, state } = fakePaseo(directory);
    const handle = paseo.agents.ref("source-1");
    let refreshes = 0;
    paseo.agents.ref = () => ({ ...handle, async refresh() {
      if (++refreshes === 3) state.source.status = "running";
      return handle.refresh();
    } });
    const result = await switcher().switchAgent(target, paseo);
    const text = await readFile(result.handoffPath, "utf8");
    expect(text).toContain("## Interrupted mid-turn");
    expect(text.match(/# Switchboard handoff/g)).toHaveLength(1);
    expect(state.events.indexOf("refresh:closed")).toBeLessThan(state.events.indexOf("create"));
  });
  it("bounds even an RPC that never resolves during stop confirmation", async () => {
    const { paseo, state } = fakePaseo(directory, { status: "running" });
    state.hangAfterArchive = true;
    await expect(switcher({ stopTimeoutMs: 20 }).switchAgent(target, paseo)).rejects.toThrow(/timed out.*Handoff path:/);
    expect(state.events).not.toContain("create");
  });
  it("does not treat a missing refresh result as proof that the source stopped", async () => {
    const { paseo, state } = fakePaseo(directory, { status: "running" }); state.nullAfterArchive = true;
    await expect(switcher().switchAgent(target, paseo)).rejects.toThrow(/stop could be confirmed.*Handoff path:/);
    expect(state.events).not.toContain("create");
  });
  it.each(["idle", "running"] as const)("create failure on %s names the handoff and original archive state", async (status) => {
    const { paseo, state } = fakePaseo(directory, { status }); state.createError = true;
    await expect(switcher().switchAgent(target, paseo)).rejects.toThrow(status === "idle"
      ? /Creation failed.*Handoff path:.*\.md.*was not archived/
      : /Creation failed.*Handoff path:.*\.md.*was archived.*restorable/);
    expect(state.archived).toBe(status === "running");
    const files = await readdir(path.join(directory, ".paseo", "switchboard"));
    expect((await readFile(path.join(directory, ".paseo", "switchboard", files[0]), "utf8")).length).toBeGreaterThan(0);
  });
  it("a file write failure prevents archive and create and includes its intended path", async () => {
    const { paseo, state } = fakePaseo(directory, { status: "running" });
    await writeFile(path.join(directory, ".paseo"), "Blocks directory creation");
    await expect(switcher().switchAgent(target, paseo)).rejects.toThrow(/Handoff path:.*\.md/);
    expect(state.events).not.toContain("archive"); expect(state.events).not.toContain("create");
  });
  it("rejects a second in-flight switch for the same source", async () => {
    const { paseo, state } = fakePaseo(directory);
    let enter!: () => void; let release!: () => void;
    const entered = new Promise<void>((resolve) => { enter = resolve; });
    const barrier = new Promise<void>((resolve) => { release = resolve; });
    state.beforeTimeline = () => { enter(); return barrier; };
    const service = switcher();
    const first = service.switchAgent(target, paseo);
    await entered;
    await expect(service.switchAgent(target, paseo)).rejects.toThrow("already in progress");
    release(); await first;
    expect(state.created).toHaveLength(1);
  });
  it.each([{ archivedAt: "2026-10-31T00:00:00Z" }, { labels: { "paseo.parent-agent-id": "parent-1" } }])("rejects archived sources and delegated agents", async (overrides) => {
    const { paseo, state } = fakePaseo(directory, overrides);
    await expect(switcher().switchAgent(target, paseo)).rejects.toThrow(/archived|Subagents/);
    expect(state.events).toHaveLength(1);
  });
  it("rejects a missing source", async () => {
    const { paseo, state } = fakePaseo(directory);
    const handle = paseo.agents.ref("source-1");
    paseo.agents.ref = () => ({ ...handle, refresh: async () => null });
    await expect(switcher().switchAgent(target, paseo)).rejects.toThrow("no longer exists");
    expect(state.events).not.toContain("create");
  });
  it("validates provider, model, effort and mode before destructive calls", async () => {
    for (const change of [{ provider: "nope" }, { model: "nope" }, { thinkingOptionId: "nope" }, { modeId: "nope" }]) {
      const { paseo, state } = fakePaseo(directory);
      await expect(switcher().switchAgent({ ...target, ...change }, paseo)).rejects.toThrow("Unknown");
      expect(state.events).not.toContain("archive"); expect(state.events).not.toContain("create");
    }
  });
  it("switches an arbitrary source to a slash-containing target model", async () => {
    const { paseo, state } = fakePaseo(directory, { provider: "future-provider", model: "future/source" });
    await switcher().switchAgent({ agentId: "source-1", provider: "opencode", model: "openai/gpt-6-luna-fast", thinkingOptionId: "high" }, paseo);
    expect(state.created[0].config).toEqual({ provider: "opencode/openai/gpt-6-luna-fast", thinkingOptionId: "high" });
    expect(switchedRowSchema.parse(state.rows[0].data).from.provider).toBe("future-provider");
  });
  it("supports the same provider with a different model and never uses a title for the file name", async () => {
    const unsafe = "😀 ../../unsafe:<title>?".repeat(10);
    const { paseo, state } = fakePaseo(directory, { provider: "codex", model: "gpt-6.1-terra", title: unsafe }, [{ type: "user_message", text: unsafe }]);
    const result = await switcher().switchAgent(target, paseo);
    expect(path.basename(result.handoffPath)).toBe("source-1-20261031T053012Z.md");
    expect(result.title.length).toBeLessThanOrEqual(60); expect(state.created[0].config.provider).toBe("codex/gpt-6.1-sol");
  });
  it("logs a row append failure and completes the switch", async () => {
    const { paseo, state } = fakePaseo(directory); state.rowError = true;
    const logs: string[] = [];
    await switcher({ log: (message) => logs.push(message) }).switchAgent(target, paseo);
    expect(logs[0]).toContain("Append failed"); expect(state.archived).toBe(true);
  });
  it("preserves replacement identity if final archiving fails", async () => {
    const { paseo, state } = fakePaseo(directory); state.archiveError = true;
    await expect(switcher().switchAgent(target, paseo)).rejects.toThrow(/Archive failed.*Handoff path:.*Replacement agent already created: replacement-1/);
    expect(state.created).toHaveLength(1);
  });
  it("rejects timeline errors before writing or archiving", async () => {
    const { paseo, state } = fakePaseo(directory); state.timelineError = true;
    await expect(switcher().switchAgent(target, paseo)).rejects.toThrow("Timeline read failed");
    expect(state.events).not.toContain("archive"); expect(state.events).not.toContain("create");
  });
  it("caps paged history at 2000 entries and preserves the original request plus recent replies", async () => {
    const items: AgentTimelineItem[] = [{ type: "user_message", text: "FIRST ORIGINAL REQUEST" },
      ...Array.from({ length: 2400 }, (_, index) => ({ type: "assistant_message" as const, text: `reply-${index}` }))];
    const { paseo, state } = fakePaseo(directory, {}, items);
    const result = await switcher().switchAgent(target, paseo);
    const text = await readFile(result.handoffPath, "utf8");
    expect(text).toContain("FIRST ORIGINAL REQUEST"); expect(text).toContain("reply-2399"); expect(text).toContain("Earlier history was cut");
    expect(state.events.filter((event) => event.startsWith("timeline:"))).toHaveLength(12);
    expect(state.events).toContain("timeline:after");
  });
  it("stopping the plugin prevents a pending switch from archiving or creating", async () => {
    const { paseo, state } = fakePaseo(directory);
    const service = switcher(); service.dispose();
    await expect(service.switchAgent(target, paseo)).rejects.toThrow("stopped");
    expect(state.events).not.toContain("archive"); expect(state.events).not.toContain("create");
  });
});

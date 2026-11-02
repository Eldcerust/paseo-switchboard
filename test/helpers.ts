import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { PaseoAgent, PaseoAgentTimelineRefetchOptions, PaseoWorkspaceAgentCreateOptions } from "@getpaseo/client";
import type { AgentTimelineItem, PluginTimelineItem } from "@getpaseo/protocol/agent-types";
import type { ProviderSnapshot } from "../shared/catalog";
import type { SwitchApi } from "../server/switch";
import { FetchAgentTimelineRequestMessageSchema } from "@getpaseo/protocol/messages";

// Scratch dirs live outside the repository so git commands cannot discover it as a parent repo.
const scratchRoot = path.join(tmpdir(), "paseo-switchboard-tests");
export async function scratch(prefix: string) {
  await mkdir(scratchRoot, { recursive: true });
  return mkdtemp(path.join(scratchRoot, `${prefix}-`));
}
export async function cleanup(directory: string) {
  const absolute = path.resolve(directory);
  if (!absolute.startsWith(scratchRoot + path.sep)) throw new Error(`Refusing cleanup outside test scratch: ${absolute}`);
  await rm(absolute, { recursive: true, force: true });
}

export function agent(cwd: string, overrides: Partial<PaseoAgent> = {}): PaseoAgent {
  return { id: "source-1", provider: "claude", model: "claude-sonnet-5-5", cwd, workspaceId: "workspace-1",
    createdAt: "2026-10-31T05:30:12Z", updatedAt: "2026-10-31T05:30:12Z", lastUserMessageAt: null,
    status: "idle", capabilities: { supportsStreaming: true, supportsSessionPersistence: true, supportsDynamicModes: true,
      supportsMcpServers: true, supportsReasoningStream: true, supportsToolInvocations: true },
    currentModeId: "full-access", availableModes: [], pendingPermissions: [], persistence: null, title: "Original title", labels: {}, ...overrides };
}

export function snapshot(): ProviderSnapshot {
  return { requestId: "providers", generatedAt: "2026-10-31T05:30:12Z", entries: [
    { provider: "claude", label: "Claude", enabled: true, status: "ready", models: [
      { provider: "claude", id: "claude-sonnet-5-5", label: "Sonnet" } ], modes: [] },
    { provider: "codex", label: "Codex", enabled: true, status: "ready", models: [
      { provider: "codex", id: "gpt-6.1-sol", label: "GPT-6.1 Sol", defaultThinkingOptionId: "medium",
        thinkingOptions: [{ id: "medium", label: "Medium" }, { id: "xhigh", label: "Extra high" }] },
      { provider: "codex", id: "gpt-6.1-terra", label: "GPT-6.1 Terra" },
    ], modes: [{ id: "full-access", label: "Full access" }, { id: "auto", label: "Auto" }] },
    { provider: "opencode", enabled: true, status: "ready", models: [
      { provider: "opencode", id: "openai/gpt-6-luna-fast", label: "Luna", thinkingOptions: [{ id: "high", label: "High", isDefault: true }] },
    ], modes: [{ id: "build", label: "Build" }] },
    { provider: "disabled", enabled: false, status: "ready", models: [{ provider: "disabled", id: "x", label: "X" }] },
    { provider: "unavailable", enabled: true, status: "unavailable", models: [{ provider: "unavailable", id: "x", label: "X" }] },
    { provider: "loading", enabled: true, status: "loading" }, { provider: "broken", enabled: true, status: "error" },
  ] };
}

export const conversation: AgentTimelineItem[] = [
  { type: "user_message", text: "Fix the login redirect\nPreserve session handling." },
  { type: "assistant_message", text: "I fixed the callback and will run tests." },
  { type: "tool_call", callId: "edit-1", name: "edit", status: "completed", error: null,
    detail: { type: "edit", filePath: "src/login.ts", newString: "PRIVATE TOOL CONTENT" } },
  { type: "user_message", text: "Also preserve the return URL." },
  { type: "tool_call", callId: "plan-1", name: "plan", status: "completed", error: null,
    detail: { type: "plan", text: "Validate the callback, then rerun integration tests." } },
  { type: "todo", items: [{ text: "Fix callback", completed: true }, { text: "Run tests", completed: false, status: "in_progress" }] },
  { type: "tool_call", callId: "shell-1", name: "shell", status: "failed", error: "SECRET ERROR",
    detail: { type: "shell", command: "npm test --token=TOP_SECRET", output: "PRIVATE TOOL OUTPUT", exitCode: 1 } },
  { type: "error", message: "SECRET ERROR DETAILS" },
  { type: "assistant_message", text: "The return URL fix is complete; tests are still running." },
];

export function fakePaseo(cwd: string, overrides: Partial<PaseoAgent> = {}, items = conversation) {
  const state = {
    source: agent(cwd, overrides), events: [] as string[], created: [] as PaseoWorkspaceAgentCreateOptions[],
    rows: [] as Array<Omit<PluginTimelineItem, "pluginId">>, targetSnapshot: snapshot(),
    archived: false, stopAfter: 2, polls: 0, neverStop: false, createError: false, rowError: false, archiveError: false,
    nullAfterArchive: false, hangAfterArchive: false, timelineError: false, gap: false,
    beforeTimeline: undefined as (() => Promise<void>) | undefined,
  };
  async function recordFile(operation: string) {
    const directory = path.join(cwd, ".paseo", "switchboard");
    const names = await readdir(directory);
    const content = await readFile(path.join(directory, names[0]), "utf8");
    state.events.push(content.length ? `verified-file:${operation}` : `empty-file:${operation}`);
  }
  const source = {
    async refresh() {
      if (state.archived) {
        if (state.hangAfterArchive) return new Promise<null>(() => { /* Deliberately unresolved fake RPC, for the bounded-wait test. */ });
        if (state.nullAfterArchive) return null;
        state.polls++;
        if (!state.neverStop && state.polls >= state.stopAfter) state.source.status = "closed";
      }
      state.events.push(`refresh:${state.source.status}`);
      return { agent: { ...state.source }, project: null };
    },
    async archive() {
      await recordFile("archive");
      state.events.push("archive");
      if (state.archiveError) throw new Error("Archive failed");
      state.archived = true;
      state.source.archivedAt = "2026-10-31T05:30:12Z";
      return { archivedAt: state.source.archivedAt };
    },
    timeline: {
      async refetch(options: PaseoAgentTimelineRefetchOptions = {}) {
        FetchAgentTimelineRequestMessageSchema.parse({ type: "fetch_agent_timeline_request", agentId: state.source.id, requestId: "timeline", ...options });
        await state.beforeTimeline?.();
        state.events.push(`timeline:${options.direction}`);
        const limit = options.limit ?? 200;
        const indexed = items.map((item, index) => ({ provider: state.source.provider, item, timestamp: state.source.createdAt,
          seqStart: index, seqEnd: index, sourceSeqRanges: [{ startSeq: index, endSeq: index }], collapsed: [] }));
        const entries = options.direction === "before" ? indexed.filter((entry) => entry.seqStart < (options.cursor?.seq ?? 0)).slice(-limit)
          : options.direction === "after" ? indexed.filter((entry) => entry.seqStart > (options.cursor?.seq ?? -1)).slice(0, limit) : indexed.slice(-limit);
        const start = entries[0]?.seqStart ?? 0;
        const end = entries.at(-1)?.seqEnd ?? 0;
        return { requestId: "timeline", agentId: state.source.id, agent: state.source, direction: options.direction ?? "tail",
          projection: "projected" as const, epoch: "epoch", reset: false, staleCursor: false, gap: state.gap,
          window: { minSeq: 0, maxSeq: items.length - 1, nextSeq: items.length },
          startCursor: entries.length ? { epoch: "epoch", seq: start } : null,
          endCursor: entries.length ? { epoch: "epoch", seq: end } : null,
          hasOlder: start > 0, hasNewer: end < items.length - 1, entries, error: state.timelineError ? "Read failed" : null };
      },
      async append(row: Omit<PluginTimelineItem, "pluginId">) {
        state.events.push("row");
        if (state.rowError) throw new Error("Append failed");
        state.rows.push(row);
        return { seq: 100, epoch: "epoch" };
      },
    },
  };
  const paseo: SwitchApi = {
    agents: { ref(id) { if (id !== state.source.id) throw new Error("Unexpected source"); return source; } },
    providers: {
      async snapshot() { state.events.push("providers"); return state.targetSnapshot; },
      async waitForReady() { return state.targetSnapshot; },
    },
    workspaces: { ref(id) {
      state.events.push(`workspace:${id}`);
      return { agents: { async create(options) {
        await recordFile("create");
        state.events.push("create");
        if (state.createError) throw new Error("Creation failed");
        state.created.push(options);
        return { id: "replacement-1" };
      } } };
    } },
  };
  return { state, paseo };
}

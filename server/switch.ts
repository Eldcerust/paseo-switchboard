import type { PaseoAgent, PaseoAgentHandle, PaseoWorkspaceAgentCreateOptions } from "@getpaseo/client";
import type { RpcInput } from "@getpaseo/plugin";
import { loadCatalog, resolveTarget, type CatalogApi } from "../shared/catalog";
import { HISTORY_ENTRIES, ROW_KIND, ROW_VERSION, isRunning, isSubagent, switchRpc } from "../shared/switchboard";
import { buildHandoff, firstRequest, switchTitle } from "./handoff";
import { appendInterruption, handoffPathFor, writeHandoff } from "./paths";
import { gatherRepoFacts } from "./repo-facts";

type Input = RpcInput<typeof switchRpc>;
type SourceHandle = Pick<PaseoAgentHandle, "refresh" | "archive"> & {
  timeline: Pick<PaseoAgentHandle["timeline"], "refetch" | "append">;
};
export interface SwitchApi {
  agents: { ref(id: string): SourceHandle };
  providers: CatalogApi;
  workspaces: { ref(id: string): { agents: { create(options: PaseoWorkspaceAgentCreateOptions): Promise<{ id: string }> } } };
}
interface Timing {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  stopTimeoutMs?: number;
  log?: (message: string) => void;
}

function assertSource(agent: PaseoAgent | undefined | null): asserts agent is PaseoAgent & { workspaceId: string } {
  if (!agent) throw new Error("The source agent no longer exists.");
  if (agent.archivedAt) throw new Error("The source agent is archived.");
  if (isSubagent(agent)) throw new Error("Subagents cannot be switched. Switch the top-level agent.");
  if (!agent.workspaceId) throw new Error("The source agent has no workspace.");
}

async function readTimeline(source: SourceHandle) {
  const size = 200;
  let page = await source.timeline.refetch({ direction: "tail", limit: size });
  const epoch = page.epoch;
  function check() {
    if (page.error) throw new Error(`Timeline read failed: ${page.error}`);
    if (page.epoch !== epoch || page.staleCursor || page.gap) throw new Error("Timeline changed during handoff; retry the switch.");
  }
  check();
  let overflow = page.entries.length > HISTORY_ENTRIES;
  let items = page.entries.slice(-HISTORY_ENTRIES).map((entry) => entry.item);
  const oldestSeq = page.window.minSeq;
  while (page.hasOlder && items.length < HISTORY_ENTRIES) {
    if (!page.startCursor) throw new Error("Timeline has older entries but no cursor; cannot safely capture context.");
    const previous = page.startCursor.seq;
    page = await source.timeline.refetch({ direction: "before", cursor: page.startCursor, limit: Math.min(size, HISTORY_ENTRIES - items.length) });
    check();
    if (!page.entries.length || !page.startCursor || page.startCursor.seq >= previous) throw new Error("Timeline pagination made no progress.");
    const combined = [...page.entries.map((entry) => entry.item), ...items];
    overflow ||= combined.length > HISTORY_ENTRIES;
    items = combined.slice(-HISTORY_ENTRIES);
  }
  const historyCut = page.hasOlder || overflow;
  if (historyCut) {
    // The tail alone would mistake a recent correction for the original request.
    // Cursor sequences are nonnegative. A before query includes even an oldest row at seq 0.
    page = await source.timeline.refetch({ direction: "before", cursor: { epoch, seq: oldestSeq + 1 }, limit: 1 });
    check();
    const prefix = page.entries.slice(0, size).map((entry) => entry.item);
    if (prefix.length < size && page.hasNewer && page.endCursor) {
      page = await source.timeline.refetch({ direction: "after", cursor: page.endCursor, limit: size - prefix.length });
      check();
      prefix.push(...page.entries.slice(0, size - prefix.length).map((entry) => entry.item));
    }
    items = [...prefix, ...items.slice(-(HISTORY_ENTRIES - prefix.length))];
  }
  return { items, historyCut };
}

async function boundedRefresh(source: SourceHandle, remaining: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      source.refresh(),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("Stop confirmation timed out.")), remaining); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function createSwitcher(timing: Timing = {}) {
  const inFlight = new Set<string>();
  const now = timing.now ?? Date.now;
  const sleep = timing.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const timeout = timing.stopTimeoutMs ?? 15_000;
  const log = timing.log ?? ((message: string) => console.error(`[switchboard] ${message}`));
  let disposed = false;

  async function switchAgent(input: Input, paseo: SwitchApi) {
    const source = paseo.agents.ref(input.agentId);
    const initial = await source.refresh();
    assertSource(initial?.agent);
    if (inFlight.has(input.agentId)) throw new Error("A switch for this agent is already in progress.");
    if (disposed) throw new Error("Switchboard has stopped.");
    inFlight.add(input.agentId);
    let handoffPath: string | undefined;
    let archived = false;
    let archiveAttempted = false;
    let newAgentId: string | undefined;
    try {
      const agent = initial.agent;
      const target = resolveTarget(await loadCatalog(paseo.providers, agent.cwd, { provider: input.provider }), input);
      const history = await readTimeline(source);
      const repoFacts = await gatherRepoFacts(agent.cwd);
      const latest = await source.refresh();
      assertSource(latest?.agent);
      if (latest.agent.cwd !== agent.cwd || latest.agent.workspaceId !== agent.workspaceId) throw new Error("The source workspace changed; retry the switch.");
      let interrupted = isRunning(agent.status) || isRunning(latest.agent.status);
      const createdAt = now();
      handoffPath = handoffPathFor(agent.cwd, agent.id, createdAt);
      await writeHandoff(handoffPath, buildHandoff({ agent, target: input, ...history, repoFacts, now: createdAt, interrupted }));
      if (disposed) throw new Error("Switchboard stopped before the switch could finish.");
      // Recheck because a new turn may have started during capture.
      const beforeStop = await source.refresh();
      assertSource(beforeStop?.agent);
      if (!interrupted && isRunning(beforeStop.agent.status)) {
        interrupted = true;
        const document = buildHandoff({ agent, target: input, ...history, repoFacts, now: createdAt, interrupted });
        await appendInterruption(handoffPath, "\n\n" + document.slice(document.indexOf("## Interrupted mid-turn")));
      }
      if (isRunning(beforeStop.agent.status) || interrupted) {
        archiveAttempted = true;
        await source.archive();
        archived = true;
        const deadline = now() + timeout;
        let stopped = false;
        while (now() < deadline) {
          const refreshed = await boundedRefresh(source, deadline - now());
          if (!refreshed) throw new Error("Source disappeared before stop could be confirmed.");
          if (!isRunning(refreshed.agent.status)) { stopped = true; break; }
          await sleep(Math.min(250, Math.max(0, deadline - now())));
        }
        if (!stopped) throw new Error("Source did not stop within the bounded wait; no new agent was created.");
      }
      if (disposed) throw new Error("Switchboard stopped before creating the new agent.");
      const title = switchTitle(firstRequest(history.items));
      const prompt = [
        "You are taking over a task from another coding agent that was switched off.",
        `Read the handoff file at this absolute path IN FULL: ${JSON.stringify(handoffPath)}`,
        "Run git status and inspect the real repository state before acting. Do not redo finished work.",
        "A command the previous agent started may have been cut off. Check its effects before continuing.",
      ].join("\n");
      const replacement = await paseo.workspaces.ref(agent.workspaceId).agents.create({
        config: { provider: `${input.provider}/${input.model}`,
          ...(input.thinkingOptionId ? { thinkingOptionId: input.thinkingOptionId } : {}),
          ...(input.modeId ? { modeId: input.modeId } : {}) }, title, prompt,
      });
      newAgentId = replacement.id;
      try {
        await source.timeline.append({ type: "plugin", id: `switchboard-${agent.id}-${createdAt}`, kind: ROW_KIND, version: ROW_VERSION,
          data: { from: { provider: agent.provider, model: agent.model },
            to: { provider: input.provider, model: input.model, providerLabel: target.provider.label ?? input.provider, modelLabel: target.model.label },
            ...(input.thinkingOptionId ? { thinkingOptionId: input.thinkingOptionId } : {}),
            ...(input.modeId ? { modeId: input.modeId } : {}),
            newAgentId, handoffPath, switchedAt: new Date(now()).toISOString(), interrupted: interrupted || isRunning(beforeStop.agent.status) },
        });
      } catch (error: unknown) {
        log(`Could not append switch row for ${agent.id}: ${String(error)}`);
      }
      if (!archived) { archiveAttempted = true; await source.archive(); archived = true; }
      return { agentId: newAgentId, title, handoffPath };
    } catch (error: unknown) {
      if (!handoffPath) throw error;
      throw new Error(`${error instanceof Error ? error.message : String(error)} Handoff path: ${handoffPath}. ` +
        (archived ? "The original agent was archived and is restorable from the app's archived list." : archiveAttempted
          ? "Archiving was attempted but its result is unknown; check the original agent in the app before retrying."
          : "The original agent was not archived.") +
        (newAgentId ? ` Replacement agent already created: ${newAgentId}. Open it instead of retrying.` : " No replacement agent was confirmed created."));
    } finally {
      inFlight.delete(input.agentId);
    }
  }
  return { switchAgent, dispose() { disposed = true; } };
}

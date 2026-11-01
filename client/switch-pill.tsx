import type { PaseoAgent } from "@getpaseo/client";
import type { PluginButtonRegistration, PluginClientContext } from "@getpaseo/plugin/client";
import { isSubagent } from "../shared/switchboard";
import { createPickerPopover } from "./picker";

export function contributePills(client: PluginClientContext) {
  const picker = createPickerPopover((input) => client.openScreen(input));
  const lifetime = new AbortController();
  const pills = new Map<string, { workspaceId: string; registration: PluginButtonRegistration }>();
  function remove(id: string) { pills.get(id)?.registration.remove(); pills.delete(id); }
  function observe(agent: PaseoAgent) {
    if (lifetime.signal.aborted) return;
    const workspaceId = agent.workspaceId;
    if (!workspaceId || agent.archivedAt || isSubagent(agent)) { remove(agent.id); return; }
    if (pills.get(agent.id)?.workspaceId === workspaceId) return;
    remove(agent.id);
    pills.set(agent.id, { workspaceId, registration: client.addComposerPill({
      id: "switch", workspaceId, agentId: agent.id,
      button: { title: "Switch", label: "Switch", icon: "Play", behavior: { kind: "popover", Content: picker } },
    }) });
  }
  void client.paseo.agents.list({ subscribe: {}, signal: lifetime.signal }).then(({ subscription }) => {
    if (lifetime.signal.aborted) return;
    subscription.subscribe({
      snapshot: ({ entries }) => {
        const ids = new Set(entries.map(({ agent }) => agent.id));
        for (const id of pills.keys()) if (!ids.has(id)) remove(id);
        for (const { agent } of entries) observe(agent);
      },
      update: (message) => {
        if (message.type !== "agent_update") return;
        if (message.payload.kind === "upsert") observe(message.payload.agent);
        else remove(message.payload.agentId);
      },
      error: (error: unknown) => console.error(`[switchboard] Agent observation failed: ${String(error)}`),
    });
  }).catch((error: unknown) => {
    if (!lifetime.signal.aborted) console.error(`[switchboard] Agent list failed: ${String(error)}`);
  });
  return () => { lifetime.abort(); for (const id of pills.keys()) remove(id); };
}

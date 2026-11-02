import type { PluginClientContext } from "@getpaseo/plugin/client";
import { createOpenAgentScreen } from "./client/open-agent";
import { contributePills } from "./client/switch-pill";
import { createSwitchedRow } from "./client/switched-row";
import { parseSwitchArgs } from "./client/targets";
import { loadCatalog } from "./shared/catalog";
import { OPEN_AGENT_SCREEN_ID, ROW_KIND, ROW_VERSION, switchRpc, switchedRowSchema } from "./shared/switchboard";

export default function contribute(client: PluginClientContext) {
  const openScreen: PluginClientContext["openScreen"] = (input) => client.openScreen(input);
  const remove = [
    client.addScreen({ id: OPEN_AGENT_SCREEN_ID, title: "Switchboard", Component: createOpenAgentScreen() }),
    client.addTimelineRenderer({ kind: ROW_KIND, version: ROW_VERSION, schema: switchedRowSchema, Component: createSwitchedRow(openScreen) }),
    client.addSlashCommand({ name: "switch", description: "Switch this task to another provider and model",
      argumentHint: "<provider>/<model> [effort]", context: "agent",
      async onSubmit({ args, paseo, agent, rpc, openScreen: open }) {
        const snapshot = await loadCatalog(paseo.providers, agent.cwd);
        const target = parseSwitchArgs(args, snapshot, agent);
        const result = await rpc(switchRpc, { agentId: agent.id, ...target });
        open({ screenId: OPEN_AGENT_SCREEN_ID, params: { agentId: result.agentId } });
      },
    }),
    contributePills(client),
  ];
  return () => { for (const cleanup of remove.reverse()) cleanup(); };
}

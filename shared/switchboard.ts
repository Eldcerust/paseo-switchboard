import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const ROW_KIND = "switched";
export const ROW_VERSION = 1;
export const OPEN_AGENT_SCREEN_ID = "switchboard-open-agent";
export const HISTORY_ENTRIES = 2000;
export const CONVERSATION_CHARS = 60_000;
export const SWITCH_USAGE = "Usage: /switch <provider>/<model> [effort]";

const id = z.string().trim().min(1).max(512);
export const switchRpc = defineRpc({
  name: "switchboard.switch",
  input: z.object({
    agentId: id,
    provider: id.refine((value) => !value.includes("/"), "Provider id cannot contain a slash"),
    model: id,
    thinkingOptionId: id.optional(),
    modeId: id.optional(),
  }),
  output: z.object({ agentId: id, title: z.string(), handoffPath: z.string() }),
});

export const switchedRowSchema = z.object({
  from: z.object({ provider: id, model: z.string().nullable() }),
  to: z.object({ provider: id, model: id, providerLabel: z.string(), modelLabel: z.string() }),
  thinkingOptionId: id.optional(),
  modeId: id.optional(),
  newAgentId: id,
  handoffPath: z.string(),
  switchedAt: z.string(),
  interrupted: z.boolean(),
});
export type SwitchedRowData = z.output<typeof switchedRowSchema>;

// 0.14 snapshots store parentage in labels. Also accept a direct field from a future host.
export function isSubagent(agent: { parentAgentId?: string | null; labels?: Record<string, string> }): boolean {
  return Boolean(agent.parentAgentId?.trim() || agent.labels?.["paseo.parent-agent-id"]?.trim());
}

export function isRunning(status: string): boolean {
  return status === "running" || status === "initializing";
}

import type { PaseoAgent } from "@getpaseo/client";
import type { AgentTimelineItem } from "@getpaseo/protocol/agent-types";
import { CONVERSATION_CHARS } from "../shared/switchboard";

export function cutMiddle(text: string, max: number): string {
  const marker = "\n[... text cut ...]\n";
  if (text.length <= max) return text;
  if (max <= marker.length) return text.slice(0, max);
  const head = Math.ceil((max - marker.length) / 2);
  return text.slice(0, head) + marker + text.slice(text.length - (max - marker.length - head));
}

export function firstRequest(items: readonly AgentTimelineItem[]): string | undefined {
  for (const item of items) {
    if (item.type === "user_message" && item.text.trim()) return item.text;
  }
  return undefined;
}

export function switchTitle(request: string | undefined): string {
  const short = request?.split(/\r?\n/)[0].replace(/\s+/g, " ").trim() || "Continue task";
  let title = "[Switch] ";
  for (const char of short) {
    if (title.length + char.length > 60) break;
    title += char;
  }
  return title;
}

/** Only the executable basename; neither arguments nor shell output enter the handoff. */
export function shellProgram(command: string): string {
  const skipped = new Set(["cd", "set", "export", "source", ".", "&"]);
  for (const part of command.split(/&&|\|\||[;|\r\n]/)) {
    const words = part.trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
    const word = words.find((value) => !/^[\w$]+=.*/.test(value));
    if (!word || skipped.has(word.toLowerCase())) continue;
    const base = word.replace(/^["']|["']$/g, "").split(/[\\/]/).pop() ?? "";
    return /^[\w.+-]{1,64}$/.test(base) ? base : "command";
  }
  return "command";
}

export interface HandoffInput {
  agent: PaseoAgent;
  target: { provider: string; model: string };
  items: readonly AgentTimelineItem[];
  historyCut: boolean;
  interrupted: boolean;
  now: number;
  repoFacts: string;
}

export function buildHandoff(input: HandoffInput): string {
  const { agent, items } = input;
  const messages = items.filter((item) => item.type === "user_message" || item.type === "assistant_message");
  const conversation: string[] = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const item = messages[i];
    const heading = item.type === "user_message" ? "### User\n" : "### Assistant\n";
    const text = heading + cutMiddle(item.text, 8000) + "\n";
    if (used + text.length > CONVERSATION_CHARS) break;
    conversation.unshift(text);
    used += text.length;
  }
  const files = new Set<string>();
  const failures: string[] = [];
  if (agent.lastError) failures.push("- Source snapshot records an error (details omitted).");
  let plan = "None recorded.";
  let todos = "None recorded.";
  let partial = "No assistant text captured yet.";
  for (const item of items) {
    if (item.type === "assistant_message" && item.text.trim()) partial = cutMiddle(item.text, 8000);
    if (item.type === "error") failures.push("- Agent error recorded (message and tool output omitted).");
    if (item.type === "notification" && item.level === "error") failures.push("- Error notification recorded (details omitted).");
    if (item.type === "todo") todos = item.items.slice(0, 100).map((todo) =>
      `- [${todo.completed || todo.status === "completed" ? "x" : todo.status === "in_progress" ? "~" : " "}] ${cutMiddle(todo.text, 300)}`).join("\n") || "Empty task list.";
    if (item.type !== "tool_call") continue;
    const detail = item.detail;
    if (detail.type === "edit" || detail.type === "write" || detail.type === "read") files.add(detail.filePath);
    if (detail.type === "search") detail.filePaths?.forEach((file) => files.add(file));
    if (detail.type === "plan") plan = cutMiddle(detail.text, 8000);
    if (detail.type === "shell" && (item.status === "failed" || (typeof detail.exitCode === "number" && detail.exitCode !== 0))) {
      failures.push(`- ${shellProgram(detail.command)} (exit ${detail.exitCode ?? "unknown"})`);
    } else if (item.status === "failed") failures.push("- Tool failed (command and output omitted).");
  }
  const cut = input.historyCut || messages.length > conversation.length;
  const compactions = items.filter((item) => item.type === "compaction").length;
  const shownFiles = [...files].slice(-100);
  return [
    "# Switchboard handoff", `Created: ${new Date(input.now).toISOString()}`,
    `Switched from ${agent.provider}/${agent.model ?? "(default)"} to ${input.target.provider}/${input.target.model}`,
    `Agent: ${agent.id}`, `Workspace: ${agent.workspaceId}`, `Working directory: ${agent.cwd}`,
    "", "## Original request", cutMiddle(firstRequest(items) ?? "No user request captured in retained history.", 12_000),
    "", "## Conversation", ...(cut ? ["Earlier history was cut or messages were omitted to fit the 2000-entry / 60,000-character limit. The oldest retained page and recent messages are preserved; gaps are unknown."] : []),
    ...(compactions ? ["The source conversation contains compaction; some earlier context may exist only as a summary."] : []),
    ...conversation, "", "## Files touched or inspected", ...(files.size > shownFiles.length ? ["Earlier files omitted."] : []),
    shownFiles.map((file) => `- ${cutMiddle(file, 1000)}`).join("\n") || "None recorded.",
    "", "## Latest plan", plan, "", "## Latest task list", todos,
    "", "## Errors and failed commands", failures.slice(-40).join("\n") || "None recorded.",
    "", "## Repo state", cutMiddle(input.repoFacts, 30_000),
    ...(input.interrupted ? ["", "## Interrupted mid-turn", "The previous turn was interrupted. A command may have been cut off; check the actual repository and processes before continuing.", "Last partial assistant text:", partial] : []), "",
  ].join("\n\n");
}

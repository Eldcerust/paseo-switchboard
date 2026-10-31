import { describe, expect, it } from "vitest";
import { parseSwitchArgs } from "../client/targets";
import { snapshot } from "./helpers";

describe("/switch argument parsing against the live snapshot", () => {
  it("parses the requested Sol example and explicit effort", () => {
    expect(parseSwitchArgs("codex/gpt-6.1-sol xhigh", snapshot())).toEqual({ provider: "codex", model: "gpt-6.1-sol", thinkingOptionId: "xhigh", modeId: undefined });
  });
  it("splits only the first slash for nested model ids", () => {
    expect(parseSwitchArgs("opencode/openai/gpt-6-luna-fast high", snapshot())).toEqual({ provider: "opencode", model: "openai/gpt-6-luna-fast", thinkingOptionId: "high", modeId: undefined });
  });
  it("uses default effort and a compatible source mode when effort is omitted", () => {
    expect(parseSwitchArgs(" codex/gpt-6.1-sol ", snapshot(), { provider: "codex", model: null, currentModeId: "auto" }))
      .toEqual({ provider: "codex", model: "gpt-6.1-sol", thinkingOptionId: "medium", modeId: "auto" });
  });
  it.each(["", "codex", "/model", "codex/", "codex/gpt-6.1-sol xhigh extra"])("shows usage for malformed input %s", (text) => {
    expect(() => parseSwitchArgs(text, snapshot())).toThrow("Usage: /switch");
  });
  it.each([["nope/x", "provider"], ["disabled/x", "provider"], ["unavailable/x", "provider"], ["codex/missing", "model"], ["codex/gpt-6.1-sol impossible", "effort"]])
    ("rejects %s with a clear %s error", (text, kind) => { expect(() => parseSwitchArgs(text, snapshot())).toThrow(new RegExp(kind, "i")); });
});

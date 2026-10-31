import { describe, expect, it } from "vitest";
import { buildTargets, defaultSelection } from "../client/targets";
import { snapshot } from "./helpers";

describe("live target catalog", () => {
  it("retains every model and effort on ready enabled providers and flags the current model", () => {
    const targets = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    expect(targets.map((entry) => entry.id)).toEqual(["claude", "codex", "opencode"]);
    expect(targets[1].models).toHaveLength(2);
    expect(targets[1].models[0].thinkingOptions.map((option) => option.id)).toEqual(["medium", "xhigh"]);
    expect(targets[1].models[0].current).toBe(true); expect(targets[1].models[1].current).toBe(false);
    expect(targets[2].models[0].id).toBe("openai/gpt-6-luna-fast");
  });
  it("preselects model effort and a matching source mode, otherwise leaves mode unset", () => {
    const targets = buildTargets(snapshot());
    expect(defaultSelection(targets[1], targets[1].models[0], { provider: "claude", model: null, currentModeId: "full-access" }))
      .toEqual({ thinkingOptionId: "medium", modeId: "full-access" });
    expect(defaultSelection(targets[2], targets[2].models[0], { provider: "codex", model: null, currentModeId: "full-access" }))
      .toEqual({ thinkingOptionId: "high", modeId: undefined });
    expect(defaultSelection(targets[0], targets[0].models[0])).toEqual({ thinkingOptionId: undefined, modeId: undefined });
  });
  it("discovers providers added after installation without a code change", () => {
    const live = snapshot();
    live.entries.push({ provider: "future-provider", enabled: true, status: "ready", models: [{ provider: "future-provider", id: "future/model", label: "Future" }] });
    expect(buildTargets(live).at(-1)?.models[0].id).toBe("future/model");
  });
});

import { describe, expect, it } from "vitest";
import { PROVIDER_DEFAULT, buildTargets, choiceId, choiceValue, defaultSelection, effortChoices, modeChoices, modelLabel } from "../client/targets";
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
  it("prefixes namespaced model ids with their upstream so same-named models stay distinguishable", () => {
    expect(buildTargets(snapshot())[2].models[0].label).toBe("openai/Luna");
    expect(modelLabel("openrouter/moonshotai/kimi-k3.1-pro", "Kimi K3.1 Pro")).toBe("openrouter/Kimi K3.1 Pro");
    expect(modelLabel("opencode-go/kimi-k3.1-pro", "Kimi K3.1 Pro")).toBe("opencode-go/Kimi K3.1 Pro");
  });
  it("leaves plain ids and already-prefixed labels alone", () => {
    expect(modelLabel("gpt-6.1-sol", "GPT-6.1 Sol")).toBe("GPT-6.1 Sol");
    expect(modelLabel("openai/gpt-6", "OpenAI/GPT-6")).toBe("OpenAI/GPT-6");
  });
  it("builds effort and mode dropdown choices with an explicit provider-default entry first", () => {
    const targets = buildTargets(snapshot());
    expect(effortChoices(targets[1].models[0])).toEqual([
      { label: "Provider default", value: PROVIDER_DEFAULT }, { label: "Medium", value: "medium" }, { label: "Extra high", value: "xhigh" }]);
    expect(modeChoices(targets[1])).toEqual([
      { label: "Provider default", value: PROVIDER_DEFAULT }, { label: "Full access", value: "full-access" }, { label: "Auto", value: "auto" }]);
    expect(effortChoices(targets[0].models[0])).toEqual([{ label: "Provider default", value: PROVIDER_DEFAULT }]);
  });
  it("shows a placeholder choice until a model is selected", () => {
    expect(effortChoices()).toEqual([{ label: "Select a model first", value: PROVIDER_DEFAULT }]);
    expect(modeChoices()).toEqual([{ label: "Select a model first", value: PROVIDER_DEFAULT }]);
  });
  it("round-trips an unset choice through the dropdown sentinel without colliding with a real mode id", () => {
    expect(choiceValue(undefined)).toBe(PROVIDER_DEFAULT);
    expect(choiceId(PROVIDER_DEFAULT)).toBeUndefined();
    expect(choiceId(choiceValue("default"))).toBe("default");
    expect(choiceId(choiceValue("xhigh"))).toBe("xhigh");
  });
});

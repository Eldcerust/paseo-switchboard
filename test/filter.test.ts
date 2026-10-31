import { describe, expect, it } from "vitest";
import { buildTargets, filterTargets, isSearching } from "../client/targets";
import { snapshot } from "./helpers";

const targets = () => buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
const ids = (query: string) => filterTargets(targets(), query).flatMap((provider) => provider.models.map((model) => model.id));

describe("search activity", () => {
  it.each([
    ["", false], ["   ", false], ["\t\n", false],
    ["a", true], [" a ", true], [" sol ", true], ["codex", true], ["nonexistent", true],
  ] as const)("normalizes %j consistently with filtering", (query, active) => {
    const providers = targets();
    expect(isSearching(query)).toBe(active);
    expect(filterTargets(providers, query) === providers).toBe(!isSearching(query));
  });
});

describe("model search", () => {
  it.each(["", "  \t\n "])("returns the original providers for an empty query %j", (query) => {
    const providers = targets();
    expect(filterTargets(providers, query)).toBe(providers);
  });

  it("matches model labels regardless of case and surrounding whitespace", () => {
    expect(ids("  sOl  ")).toEqual(["gpt-6.1-sol"]);
    expect(ids("SONNET")).toEqual(["claude-sonnet-5-5"]);
  });

  it("matches model ids including slashes", () => {
    expect(ids("gpt-6.1")).toEqual(["gpt-6.1-sol", "gpt-6.1-terra"]);
    expect(ids("OPENAI/gpt")).toEqual(["openai/gpt-6-luna-fast"]);
    expect(ids("claude-sonnet-5-5")).toEqual(["claude-sonnet-5-5"]);
  });

  it("matches provider labels and ids independently of model names", () => {
    const providers = targets();
    // Give a real catalog provider a label distinct from its id to exercise both fields.
    providers[1] = { ...providers[1], label: "Coding service" };
    expect(filterTargets(providers, "CODING SERVICE")[0].models).toEqual(providers[1].models);
    expect(filterTargets(providers, "CODEX")[0].models).toEqual(providers[1].models);
    expect(ids("codex")).toEqual(["gpt-6.1-sol", "gpt-6.1-terra"]);
    expect(ids("opencode")).toEqual(["openai/gpt-6-luna-fast"]);
  });

  it.each(["codex sol", "sol codex", " \tCODEX\n sol "])("requires every word in %j", (query) => {
    expect(ids(query)).toEqual(["gpt-6.1-sol"]);
  });

  it("drops providers without a match and rejects a query with any unmatched term", () => {
    expect(filterTargets(targets(), "luna").map((provider) => provider.id)).toEqual(["opencode"]);
    expect(ids("codex terra")).toEqual(["gpt-6.1-terra"]);
    expect(ids("codex nonexistent")).toEqual([]);
    expect(ids("codex luna")).toEqual([]);
    expect(ids("nonexistent")).toEqual([]);
    expect(filterTargets([], "sol")).toEqual([]);
  });

  it("preserves model identity, current flags, effort options and provider modes without mutating the catalog", () => {
    const providers = targets();
    const before = structuredClone(providers);
    const filtered = filterTargets(providers, "codex sol");
    expect(filtered[0].models[0]).toBe(providers[1].models[0]);
    expect(filtered[0].models[0].current).toBe(true);
    expect(filtered[0].models[0].thinkingOptions).toBe(providers[1].models[0].thinkingOptions);
    expect(filtered[0].modes).toBe(providers[1].modes);
    expect(filterTargets(providers, "terra")[0].models[0].current).toBe(false);
    expect(providers).toEqual(before);
  });

  it.each(["[", "(", "\\", "*", ".", "+", "?"])("treats %j as literal text without throwing", (query) => {
    const providers = targets();
    // Add the character to one model from the real catalog; other models must not match it.
    const literalModel = { ...providers[2].models[0], label: `Luna ${query}` };
    providers[2] = { ...providers[2], models: [literalModel] };
    expect(() => filterTargets(providers, query)).not.toThrow();
    const matchedModels = filterTargets(providers, query).flatMap((provider) => provider.models);
    expect(matchedModels).toContain(literalModel);
    expect(matchedModels).not.toContain(providers[0].models[0]);
    // The period also occurs literally in both GPT-6.1 model labels and ids.
    expect(matchedModels).toEqual(query === "." ? [...providers[1].models, literalModel] : [literalModel]);
    expect(ids(query)).toEqual(query === "." ? ["gpt-6.1-sol", "gpt-6.1-terra"] : []);
  });
});

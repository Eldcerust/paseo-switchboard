import { describe, expect, it } from "vitest";
import { buildTargets, filterTargets, initialExpanded, resolveExpansion, toggleProvider } from "../client/targets";
import { snapshot } from "./helpers";

describe("expansion initialization", () => {
  it("stays uninitialized with no providers", () => {
    const empty = snapshot();
    empty.entries = [];
    expect(resolveExpansion(null, buildTargets(empty))).toBeNull();
  });

  it("waits through a loading catalog then expands the current provider on cold start", () => {
    const loading = snapshot();
    loading.entries = loading.entries.filter((entry) => entry.status === "loading");
    const pending = resolveExpansion(null, buildTargets(loading));
    expect(pending).toBeNull();
    const ready = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    expect(resolveExpansion(pending, ready)).toEqual(new Set(["codex"]));
  });

  it("falls back to the first provider when initializing without a current model", () => {
    expect(resolveExpansion(null, buildTargets(snapshot()))).toEqual(new Set(["claude"]));
  });

  it("preserves the initialized set by reference after a refetch changes the current provider", () => {
    const expanded = resolveExpansion(null, buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" }));
    const fresh = buildTargets(snapshot(), { provider: "opencode", model: "openai/gpt-6-luna-fast" });
    expect(resolveExpansion(expanded, fresh)).toBe(expanded);
    expect(expanded).toEqual(new Set(["codex"]));
  });

  it("preserves manual expansion by reference when a refetch reports different providers or none", () => {
    const providers = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    const expanded = toggleProvider(initialExpanded(providers), providers[0].id);
    const fresh = snapshot();
    fresh.entries = fresh.entries.filter((entry) => entry.provider === "opencode");
    expect(resolveExpansion(expanded, buildTargets(fresh))).toBe(expanded);
    fresh.entries = [];
    expect(resolveExpansion(expanded, buildTargets(fresh))).toBe(expanded);
    expect(expanded).toEqual(new Set(["codex", "claude"]));
  });

  it("keeps the same empty set after the user collapses every provider", () => {
    const providers = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    const collapsed = toggleProvider(initialExpanded(providers), providers[1].id);
    expect(collapsed.size).toBe(0);
    expect(resolveExpansion(collapsed, buildTargets(snapshot()))).toBe(collapsed);
    const empty = snapshot();
    empty.entries = [];
    expect(resolveExpansion(collapsed, buildTargets(empty))).toBe(collapsed);
    expect(collapsed.size).toBe(0);
  });
});

describe("provider expansion", () => {
  it("starts with only the provider containing the current model expanded", () => {
    const providers = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    expect([...initialExpanded(providers)]).toEqual(["codex"]);
    expect([...initialExpanded(buildTargets(snapshot(), { provider: "opencode", model: "openai/gpt-6-luna-fast" }))])
      .toEqual(["opencode"]);
  });

  it("falls back to the first provider when no model is current", () => {
    expect([...initialExpanded(buildTargets(snapshot()))]).toEqual(["claude"]);
    expect([...initialExpanded(buildTargets(snapshot(), { provider: "codex", model: "missing" }))]).toEqual(["claude"]);
  });

  it("returns an empty set when no providers exist", () => {
    const live = snapshot();
    live.entries = [];
    expect([...initialExpanded(buildTargets(live))]).toEqual([]);
  });

  it("adds a provider in a new set without mutating the input", () => {
    const providers = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    const expanded = initialExpanded(providers);
    const next = toggleProvider(expanded, providers[0].id);
    expect(next).not.toBe(expanded);
    expect([...next]).toEqual(["codex", "claude"]);
    expect([...expanded]).toEqual(["codex"]);
  });

  it("removes a provider in a new set without mutating the input", () => {
    const providers = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    const expanded = initialExpanded(providers);
    const next = toggleProvider(expanded, providers[1].id);
    expect(next).not.toBe(expanded);
    expect([...next]).toEqual([]);
    expect([...expanded]).toEqual(["codex"]);
    expect([...toggleProvider(next, providers[1].id)]).toEqual(["codex"]);
  });

  it("does not alter manual expansion when filtering a fresh catalog", () => {
    const providers = buildTargets(snapshot(), { provider: "codex", model: "gpt-6.1-sol" });
    const expanded = toggleProvider(initialExpanded(providers), providers[0].id);
    const fresh = buildTargets(snapshot(), { provider: "opencode", model: "openai/gpt-6-luna-fast" });
    expect(filterTargets(fresh, "luna").map((provider) => provider.id)).toEqual(["opencode"]);
    expect([...expanded]).toEqual(["codex", "claude"]);
    expect(filterTargets(fresh, "")).toBe(fresh);
    expect([...expanded]).toEqual(["codex", "claude"]);
  });
});

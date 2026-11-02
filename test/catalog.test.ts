import { describe, expect, it } from "vitest";
import { buildTargets } from "../client/targets";
import { expandCatalog, isDiscovering, loadCatalog, type CatalogApi, type ProviderSnapshot } from "../shared/catalog";
import { snapshot } from "./helpers";

type Compact = NonNullable<ProviderSnapshot["compactSnapshot"]>;

const high = { id: "high", label: "High", isDefault: true };
const compactEntries = (status: "ready" | "loading"): Compact["entries"] => [
  status === "ready"
    ? { provider: "claude", enabled: true, status: "ready", models: [
      { id: "claude-sonnet-5-5", label: "Sonnet", thinkingSet: 0 }, { id: "claude-haiku-5-5", label: "Haiku" } ] }
    : { provider: "claude", enabled: true, status: "loading" },
  { provider: "codex", enabled: false, status: "unavailable" },
];

// Wire form, as the Paseo app delivers it: `entries` is empty and the catalog is in `compactSnapshot`.
const wire = (status: "ready" | "loading", thinkingSets: Compact["thinkingSets"] = [{ options: [high], defaultOptionId: "high" }]): ProviderSnapshot =>
  ({ ...snapshot(), entries: [], compactSnapshot: { entries: compactEntries(status), thinkingSets } });

describe("expandCatalog", () => {
  it("returns an already expanded snapshot untouched", () => {
    const plain = snapshot();
    expect(expandCatalog(plain)).toBe(plain);
  });

  it("rebuilds entries from a wire-form snapshot, resolving thinking sets and adding the provider to each model", () => {
    const [claude, codex] = expandCatalog(wire("ready")).entries;
    expect(claude.models).toEqual([
      { provider: "claude", id: "claude-sonnet-5-5", label: "Sonnet", thinkingOptions: [high], defaultThinkingOptionId: "high" },
      { provider: "claude", id: "claude-haiku-5-5", label: "Haiku" },
    ]);
    expect(codex).toEqual({ provider: "codex", enabled: false, status: "unavailable" });
  });

  it("feeds the picker's target list, which was empty before the wire form was handled", () => {
    const targets = buildTargets(expandCatalog(wire("ready")));
    expect(targets.map((entry) => entry.id)).toEqual(["claude"]);
    expect(targets[0].models.map((model) => model.id)).toEqual(["claude-sonnet-5-5", "claude-haiku-5-5"]);
    expect(targets[0].models[0].defaultThinkingOptionId).toBe("high");
  });

  it("rejects a model that points at a missing thinking set", () => {
    expect(() => expandCatalog(wire("ready", []))).toThrow(RangeError);
  });
});

describe("isDiscovering", () => {
  it("is true only while an enabled provider is loading", () => {
    expect(isDiscovering(expandCatalog(wire("loading")))).toBe(true);
    expect(isDiscovering(expandCatalog(wire("ready")))).toBe(false);
    expect(isDiscovering(undefined)).toBe(false);
  });

  it("can be scoped to one provider", () => {
    const loading = expandCatalog(wire("loading"));
    expect(isDiscovering(loading, "claude")).toBe(true);
    expect(isDiscovering(loading, "opencode")).toBe(false);
  });
});

// A scripted daemon: each snapshot() call returns the next frame, then repeats the last one.
function daemon(frames: ProviderSnapshot[]) {
  let calls = 0;
  const providers: CatalogApi = { async snapshot() { return frames[Math.min(calls++, frames.length - 1)]; } };
  let clock = 0;
  const timing = { timeoutMs: 1000, intervalMs: 100, now: () => clock, sleep: async (ms: number) => { clock += ms; } };
  return { providers, timing, calls: () => calls };
}

describe("loadCatalog", () => {
  it("returns a ready snapshot after a single read", async () => {
    const plain = { ...snapshot(), entries: snapshot().entries.filter((entry) => entry.status !== "loading") };
    const { providers, timing, calls } = daemon([plain]);
    expect(await loadCatalog(providers, "/repo", timing)).toBe(plain);
    expect(calls()).toBe(1);
  });

  it("polls a cold cwd until discovery finishes, then expands the wire-form result", async () => {
    const { providers, timing, calls } = daemon([wire("loading"), wire("loading"), wire("ready")]);
    const catalog = await loadCatalog(providers, "/repo", timing);
    expect(calls()).toBe(3);
    expect(buildTargets(catalog)[0].models).toHaveLength(2);
  });

  it("does not wait on disabled providers that report loading", async () => {
    const withDisabled = { ...snapshot(), entries: [...snapshot().entries.slice(0, 1), { provider: "pi", enabled: false, status: "loading" as const }] };
    const { providers, timing, calls } = daemon([withDisabled]);
    await loadCatalog(providers, "/repo", timing);
    expect(calls()).toBe(1);
  });

  it("waits only for the named provider, so an unrelated slow one cannot stall a switch", async () => {
    const stuck = { ...snapshot(), entries: [snapshot().entries[0], { provider: "slow", enabled: true, status: "loading" as const }] };
    const { providers, timing, calls } = daemon([stuck]);
    await loadCatalog(providers, "/repo", { ...timing, provider: "claude" });
    expect(calls()).toBe(1);
  });

  it("keeps waiting while the named provider is still loading", async () => {
    const { providers, timing, calls } = daemon([wire("loading"), wire("ready")]);
    await loadCatalog(providers, "/repo", { ...timing, provider: "claude" });
    expect(calls()).toBe(2);
  });

  it("gives up at the timeout and returns the providers that are ready", async () => {
    const stuck = { ...snapshot(), entries: [snapshot().entries[0], { provider: "slow", enabled: true, status: "loading" as const }] };
    const { providers, timing, calls } = daemon([stuck]);
    const catalog = await loadCatalog(providers, "/repo", timing);
    expect(calls()).toBe(11);
    expect(buildTargets(catalog).map((entry) => entry.id)).toEqual(["claude"]);
  });
});

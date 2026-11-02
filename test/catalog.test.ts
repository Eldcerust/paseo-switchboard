import { describe, expect, it } from "vitest";
import { loadCatalog, type CatalogApi, type ProviderSnapshot } from "../shared/catalog";
import { snapshot } from "./helpers";

const entries = (status: "ready" | "loading") => ({ ...snapshot(), entries: [
  status === "ready"
    ? { provider: "claude", enabled: true, status: "ready" as const, models: [{ provider: "claude", id: "claude-sonnet-5-5", label: "Sonnet" }] }
    : { provider: "claude", enabled: true, status: "loading" as const },
  { provider: "codex", enabled: false, status: "unavailable" as const },
] });

function api(first: ProviderSnapshot, waited: () => Promise<ProviderSnapshot>) {
  const calls: string[] = [];
  const providers: CatalogApi = {
    async snapshot() { calls.push("snapshot"); return calls.length === 1 ? first : entries("ready"); },
    async waitForReady() { calls.push("wait"); return waited(); },
  };
  return { providers, calls };
}

describe("loadCatalog", () => {
  it("returns the first snapshot untouched when no enabled provider is loading", async () => {
    const ready = entries("ready");
    const { providers, calls } = api(ready, async () => { throw new Error("must not wait"); });
    expect(await loadCatalog(providers, "/repo")).toBe(ready);
    expect(calls).toEqual(["snapshot"]);
  });

  it("waits for discovery when the daemon has not scanned the cwd yet", async () => {
    const { providers, calls } = api(entries("loading"), async () => entries("ready"));
    const catalog = await loadCatalog(providers, "/repo");
    expect(calls).toEqual(["snapshot", "wait"]);
    expect(catalog.entries[0].models).toHaveLength(1);
  });

  it("ignores disabled providers that report loading", async () => {
    const disabledLoading = { ...entries("ready"), entries: [...entries("ready").entries, { provider: "pi", enabled: false, status: "loading" as const }] };
    const { providers, calls } = api(disabledLoading, async () => { throw new Error("must not wait"); });
    await loadCatalog(providers, "/repo");
    expect(calls).toEqual(["snapshot"]);
  });

  it("falls back to a fresh snapshot when discovery times out", async () => {
    const { providers, calls } = api(entries("loading"), async () => { throw new Error("timed out"); });
    const catalog = await loadCatalog(providers, "/repo");
    expect(calls).toEqual(["snapshot", "wait", "snapshot"]);
    expect(catalog.entries[0].status).toBe("ready");
  });
});

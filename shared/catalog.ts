import type { PaseoApi, PaseoProviderSnapshotResult } from "@getpaseo/client";

export type ProviderSnapshot = PaseoProviderSnapshotResult;
export type CatalogApi = Pick<PaseoApi["providers"], "snapshot">;

// The Paseo app keeps provider snapshots in wire form: `entries` is empty and the catalog sits in
// `compactSnapshot`, where each model points into a shared table of thinking-option sets. Rebuild the
// plain `entries` (mirrors expandProviderSnapshot in @getpaseo/protocol) so every reader sees one shape.
export function expandCatalog(snapshot: ProviderSnapshot): ProviderSnapshot {
  const compact = snapshot.compactSnapshot;
  if (!compact || snapshot.entries.length) return snapshot;
  const entries = compact.entries.map(({ models: compactModels, ...entry }) => {
    if (!compactModels) return entry;
    const models = compactModels.map(({ thinkingSet, ...model }) => {
      if (thinkingSet === undefined) return { provider: entry.provider, ...model };
      const set = compact.thinkingSets[thinkingSet];
      if (!set) throw new RangeError(`Provider snapshot references missing thinking set ${thinkingSet}`);
      return { provider: entry.provider, ...model, thinkingOptions: set.options,
        ...(set.defaultOptionId !== undefined ? { defaultThinkingOptionId: set.defaultOptionId } : {}) };
    });
    return { ...entry, models };
  });
  return { ...snapshot, entries };
}

// The daemon discovers providers lazily per cwd: the first snapshot for a cwd it has not scanned yet
// returns immediately with every enabled provider `loading` and no models (discovery takes a few seconds).
// Reading that as final leaves the catalog empty, so callers keep reading until discovery settles.
export function isDiscovering(snapshot: ProviderSnapshot | undefined, provider?: string): boolean {
  return Boolean(snapshot?.entries.some((entry) => entry.enabled && entry.status === "loading" && (!provider || entry.provider === provider)));
}

export async function readCatalog(providers: CatalogApi, cwd: string): Promise<ProviderSnapshot> {
  return expandCatalog(await providers.snapshot({ cwd }));
}

export interface CatalogTiming { provider?: string; timeoutMs?: number; intervalMs?: number; now?: () => number; sleep?: (ms: number) => Promise<void> }

// Poll until discovery settles, for callers that need a definitive answer (the /switch command and the
// server-side switch). Pass `provider` to wait only for the one being switched to, so an unrelated slow
// provider cannot stall it. This polls `snapshot` rather than using `waitForReady`, which judges readiness
// from `entries` and so returns at once on wire-form snapshots. On timeout it returns what it has.
export async function loadCatalog(providers: CatalogApi, cwd: string, timing: CatalogTiming = {}): Promise<ProviderSnapshot> {
  const { provider, timeoutMs = 15_000, intervalMs = 400, now = Date.now, sleep = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)) } = timing;
  const deadline = now() + timeoutMs;
  for (;;) {
    const snapshot = await readCatalog(providers, cwd);
    if (!isDiscovering(snapshot, provider) || now() >= deadline) return snapshot;
    await sleep(intervalMs);
  }
}

export function availableProviders(snapshot: ProviderSnapshot) {
  return snapshot.entries.filter((entry) => entry.enabled && entry.status === "ready");
}

export function resolveTarget(snapshot: ProviderSnapshot, input: {
  provider: string; model: string; thinkingOptionId?: string; modeId?: string;
}) {
  const provider = availableProviders(snapshot).find((entry) => entry.provider === input.provider);
  if (!provider) throw new Error(`Unknown or unavailable provider: ${input.provider}`);
  const model = provider.models?.find((entry) => entry.id === input.model);
  if (!model) throw new Error(`Unknown model for ${input.provider}: ${input.model}`);
  if (input.thinkingOptionId && !model.thinkingOptions?.some((option) => option.id === input.thinkingOptionId)) {
    throw new Error(`Unknown effort for ${input.provider}/${input.model}: ${input.thinkingOptionId}`);
  }
  if (input.modeId && !provider.modes?.some((mode) => mode.id === input.modeId)) {
    throw new Error(`Unknown mode for ${input.provider}: ${input.modeId}`);
  }
  return { provider, model };
}

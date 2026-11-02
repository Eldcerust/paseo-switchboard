import type { PaseoApi, PaseoProviderSnapshotResult } from "@getpaseo/client";

export type ProviderSnapshot = PaseoProviderSnapshotResult;
export type CatalogApi = Pick<PaseoApi["providers"], "snapshot" | "waitForReady">;

// The daemon discovers providers lazily per cwd: the first snapshot for a cwd it has not scanned yet
// returns immediately with every enabled provider `loading` and no models. Reading that as final
// leaves the catalog empty, so wait for discovery to finish whenever any enabled provider is loading.
// If one provider never finishes, fall back to a fresh snapshot so the providers that are ready still show.
export async function loadCatalog(providers: CatalogApi, cwd: string): Promise<ProviderSnapshot> {
  const snapshot = await providers.snapshot({ cwd });
  if (!snapshot.entries.some((entry) => entry.enabled && entry.status === "loading")) return snapshot;
  try {
    return await providers.waitForReady({ cwd, timeoutMs: 30_000 });
  } catch {
    return providers.snapshot({ cwd });
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

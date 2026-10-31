import type { PaseoProviderSnapshotResult } from "@getpaseo/client";

export type ProviderSnapshot = PaseoProviderSnapshotResult;
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

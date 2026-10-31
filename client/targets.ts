import { availableProviders, resolveTarget, type ProviderSnapshot } from "../shared/catalog";
import { SWITCH_USAGE } from "../shared/switchboard";

export interface SourceTarget { provider: string; model: string | null; currentModeId?: string | null }
export function buildTargets(snapshot: ProviderSnapshot, source?: SourceTarget) {
  return availableProviders(snapshot).map((provider) => ({
    id: provider.provider, label: provider.label ?? provider.provider, modes: provider.modes ?? [],
    models: (provider.models ?? []).map((model) => ({
      id: model.id, label: model.label, thinkingOptions: model.thinkingOptions ?? [],
      defaultThinkingOptionId: model.defaultThinkingOptionId,
      current: source?.provider === provider.provider && source.model === model.id,
    })),
  }));
}

type TargetListBuilder = typeof buildTargets;
export type TargetProvider = ReturnType<TargetListBuilder>[number];
export type TargetModel = TargetProvider["models"][number];

export function isSearching(query: string): boolean {
  return query.trim().length > 0;
}

export function filterTargets(providers: TargetProvider[], query: string): TargetProvider[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return providers;
  const terms = normalized.split(/\s+/);
  return providers.flatMap((provider) => {
    const models = provider.models.filter((model) => {
      const text = `${provider.label} ${provider.id} ${model.label} ${model.id}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
    return models.length ? [{ ...provider, models }] : [];
  });
}

export function initialExpanded(providers: TargetProvider[]) {
  const provider = providers.find((entry) => entry.models.some((model) => model.current)) ?? providers[0];
  return new Set(provider ? [provider.id] : []);
}

export function resolveExpansion(current: Set<TargetProvider["id"]> | null, providers: TargetProvider[]): Set<TargetProvider["id"]> | null {
  if (current !== null) return current;
  if (!providers.length) return null;
  return initialExpanded(providers);
}

export function toggleProvider(expanded: ReadonlySet<TargetProvider["id"]>, id: TargetProvider["id"]) {
  const next = new Set(expanded);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function defaultSelection(provider: TargetProvider, model: TargetModel, source?: SourceTarget) {
  const thinkingOptionId = model.thinkingOptions.find((option) => option.id === model.defaultThinkingOptionId)?.id
    ?? model.thinkingOptions.find((option) => option.isDefault)?.id;
  const modeId = provider.modes.find((mode) => mode.id === source?.currentModeId)?.id;
  return { thinkingOptionId, modeId };
}

export function parseSwitchArgs(args: string, snapshot: ProviderSnapshot, source?: SourceTarget) {
  const parts = args.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 1 || parts.length > 2) throw new Error(SWITCH_USAGE);
  const slash = parts[0].indexOf("/");
  if (slash < 1 || slash === parts[0].length - 1) throw new Error(SWITCH_USAGE);
  const provider = parts[0].slice(0, slash);
  const model = parts[0].slice(slash + 1);
  const effort = parts[1];
  resolveTarget(snapshot, { provider, model, thinkingOptionId: effort });
  const choices = buildTargets(snapshot, source);
  const selectedProvider = choices.find((entry) => entry.id === provider)!;
  const selectedModel = selectedProvider.models.find((entry) => entry.id === model)!;
  const defaults = defaultSelection(selectedProvider, selectedModel, source);
  return { provider, model, ...defaults, ...(effort ? { thinkingOptionId: effort } : {}) };
}

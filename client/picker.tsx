import type { PluginClientContext, PluginScreenProps } from "@getpaseo/plugin/client";
import { usePaseo, useRpc } from "@getpaseo/plugin/client";
import { useToast } from "@getpaseo/plugin/client/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { OPEN_AGENT_SCREEN_ID, isRunning, switchRpc } from "../shared/switchboard";
import { buildTargets, defaultSelection, filterTargets, isSearching, resolveExpansion, toggleProvider, type SourceTarget, type TargetProvider } from "./targets";

type PickerSource = SourceTarget & { status: string; cwd: string };

// Opened from the composer pill as a screen. The host popover dismisses itself on some content
// changes, so the picker lives in a screen and renders its own centered card instead.
export function createPickerScreen(openScreen: PluginClientContext["openScreen"]) {
  return function PickerScreen({ params, theme, layout }: PluginScreenProps) {
    const agentId = params.agentId;
    const source: PickerSource = {
      provider: params.provider ?? "",
      model: params.model || null,
      currentModeId: params.currentModeId || null,
      status: params.status ?? "idle",
      cwd: params.cwd ?? "",
    };
    if (!agentId || !source.cwd) {
      return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: theme.colors.surface0 }}>
        <Text style={{ color: theme.colors.statusWarning }}>No agent was specified.</Text>
      </View>;
    }
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: layout.compact ? 12 : 24, backgroundColor: theme.colors.surface1 }}>
        <View style={{ width: "100%", maxWidth: 440, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border }}>
          <AgentPicker agentId={agentId} source={source} theme={theme} layout={layout} close={() => {}} openScreen={openScreen} />
        </View>
      </View>
    );
  };
}

function AgentPicker({ agentId, source, theme, layout, close, openScreen }: {
  agentId: string;
  source: PickerSource;
  theme: PluginScreenProps["theme"];
  layout: PluginScreenProps["layout"];
  close: () => void;
  openScreen: PluginClientContext["openScreen"];
}) {
  const paseo = usePaseo();
  const toast = useToast();
  const switchAgent = useRpc(switchRpc);
  const query = useQuery({ queryKey: ["switchboard-providers", agentId, source.cwd], enabled: Boolean(source.cwd),
    queryFn: () => paseo.providers.snapshot({ cwd: source.cwd }), staleTime: 0 });
  useEffect(() => paseo.providers.subscribe(() => { void query.refetch(); }), [paseo, query.refetch]);
  const providers = query.data ? buildTargets(query.data, source) : [];
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<TargetProvider["id"]> | null>(null);
  // Capture the first non-empty catalog once, including when it arrives after the initial render.
  const next = resolveExpansion(expanded, providers);
  if (next !== expanded) setExpanded(next);
  const searching = isSearching(search);
  const visibleProviders = filterTargets(providers, search);
  const noneExpanded = !searching && visibleProviders.length > 0 && !visibleProviders.some((entry) => expanded?.has(entry.id));
  const [selection, setSelection] = useState<{ provider: string; model: string; thinkingOptionId?: string; modeId?: string }>();
  const provider = providers.find((entry) => entry.id === selection?.provider);
  const model = provider?.models.find((entry) => entry.id === selection?.model);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selection || !model) throw new Error("Choose an available model.");
      return switchAgent({ agentId, ...selection });
    },
    onSuccess(result) {
      close();
      openScreen({ screenId: OPEN_AGENT_SCREEN_ID, params: { agentId: result.agentId } });
    },
    onError(error) {
      // Archiving removes the source pill and can unmount this picker before the RPC returns.
      toast.error(error.message);
    },
  });
  const space = layout.compact ? 8 : 12;
  // Reserve the host's 12px content padding, 4px menu padding and 1px border on each side.
  // Measure both chrome groups so wrapped warnings/errors leave the list only the remaining space.
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  // A stable body size matters: resizing the popover under the pointer makes Paseo dismiss it.
  // Size it once from the host cap and let only the list scroll.
  const bodyHeight = Math.max(200, Math.min(440, windowHeight - 16) - 34);
  const bodyWidth = Math.max(240, Math.min(392, windowWidth - 80));
  const styles = {
    root: { backgroundColor: theme.colors.surface0, gap: space, padding: space, height: bodyHeight, ...(layout.compact ? {} : { width: bodyWidth }) },
    title: { color: theme.colors.foreground, fontSize: layout.compact ? 18 : 20, fontWeight: "700" as const },
    sectionLabel: { color: theme.colors.foregroundMuted, fontSize: layout.compact ? 11 : 12, fontWeight: "600" as const, letterSpacing: 0.6, textTransform: "uppercase" as const },
    body: { color: theme.colors.foreground, fontSize: layout.compact ? 13 : 14 },
    hint: { color: theme.colors.foregroundMuted, fontSize: layout.compact ? 12 : 13 },
    error: { color: theme.colors.statusWarning, fontSize: layout.compact ? 12 : 13 },
    searchRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: space },
    search: { flex: 1, color: theme.colors.foreground, backgroundColor: theme.colors.surface1, borderRadius: 8,
      paddingHorizontal: space, paddingVertical: layout.compact ? 8 : 10, fontSize: layout.compact ? 13 : 14 },
    providerHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: space / 2, paddingVertical: layout.compact ? 6 : 8 },
    chevron: { color: theme.colors.foregroundMuted, fontSize: layout.compact ? 12 : 13 },
    provider: { color: theme.colors.foreground, fontSize: layout.compact ? 14 : 16, fontWeight: "600" as const },
    count: { color: theme.colors.foregroundMuted, fontSize: layout.compact ? 12 : 13 },
    models: { marginLeft: space / 2, paddingLeft: space, borderLeftWidth: 1, borderLeftColor: theme.colors.border, gap: 2 },
    option: { paddingVertical: layout.compact ? 6 : 7, paddingHorizontal: space / 2, borderRadius: 6 },
    optionSelected: { backgroundColor: theme.colors.surface1 },
    optionText: { color: theme.colors.foreground, fontSize: layout.compact ? 13 : 14 },
    optionTextSelected: { color: theme.colors.accent, fontWeight: "600" as const },
    chips: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: space / 2 },
    chip: { paddingVertical: layout.compact ? 5 : 6, paddingHorizontal: space, borderRadius: 999, backgroundColor: theme.colors.surface1 },
    chipSelected: { backgroundColor: theme.colors.accent },
    chipText: { color: theme.colors.foreground, fontSize: layout.compact ? 12 : 13 },
    chipTextSelected: { color: theme.colors.accentForeground, fontWeight: "600" as const },
    link: { paddingVertical: space / 2 },
    linkText: { color: theme.colors.accent, fontSize: layout.compact ? 12 : 13, fontWeight: "600" as const },
    button: { padding: space, backgroundColor: theme.colors.accent, borderRadius: 8, opacity: mutation.isPending || !model ? 0.5 : 1 },
    buttonText: { color: theme.colors.accentForeground, fontSize: layout.compact ? 14 : 15, fontWeight: "600" as const },
  };
  const option = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected, disabled: mutation.isPending }}
      accessibilityLabel={label} disabled={mutation.isPending} onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{selected ? "✓ " : ""}{label}</Text>
    </Pressable>
  );
  const chip = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected, disabled: mutation.isPending }}
      accessibilityLabel={label} disabled={mutation.isPending} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
  const link = (key: string, label: string, onPress: () => void) => (
    <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} disabled={mutation.isPending}
      onPress={onPress} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Switch provider and model</Text>
      {isRunning(source.status) ? <Text style={styles.error}>This agent is running and will be interrupted.</Text> : null}
      <View style={styles.searchRow}>
        <TextInput accessibilityLabel="Search models" placeholder="Search models" autoCapitalize="none" autoCorrect={false}
          value={search} onChangeText={setSearch} placeholderTextColor={theme.colors.foregroundMuted} style={styles.search} />
        {searching ? link("clear-search", "Clear search", () => setSearch("")) : null}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ gap: space }}>
        {query.isPending ? <Text style={styles.hint}>Loading providers...</Text> : null}
        {query.isError ? <Text style={styles.error}>{String(query.error)}</Text> : null}
        {query.isError ? link("retry", "Retry provider discovery", () => { void query.refetch(); }) : null}
        {query.isSuccess && !providers.some((entry) => entry.models.length) ? <Text style={styles.hint}>No enabled, available models were reported.</Text> : null}
        {query.isSuccess && searching && !visibleProviders.length ? <View>
          <Text style={styles.hint}>No models match "{search}"</Text>
        </View> : null}
        {query.isSuccess && noneExpanded ? <Text style={styles.hint}>All providers are collapsed. Expand one to choose a model.</Text> : null}
        {visibleProviders.map((entry) => {
          const isExpanded = searching || expanded?.has(entry.id) === true;
          const count = entry.models.length;
          const total = providers.find((candidate) => candidate.id === entry.id)!.models.length;
          return <View key={entry.id} style={{ gap: 2 }}>
            {searching ? <View style={styles.providerHeader}>
              <Text style={styles.chevron}>▾</Text>
              <Text style={styles.provider}>{entry.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.count}>{count} of {total}</Text>
            </View> : <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded, disabled: mutation.isPending }}
              accessibilityLabel={`${entry.label}, ${count} ${count === 1 ? "model" : "models"}, ${isExpanded ? "expanded" : "collapsed"}`}
              disabled={mutation.isPending} onPress={(event) => { event.stopPropagation(); setExpanded((value) => toggleProvider(value ?? new Set(), entry.id)); }} style={styles.providerHeader}>
              <Text style={styles.chevron}>{isExpanded ? "▾" : "▸"}</Text>
              <Text style={styles.provider}>{entry.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.count}>{count}</Text>
            </Pressable>}
            {isExpanded ? <View style={styles.models}>
              {entry.models.map((candidate) => option(`${entry.id}/${candidate.id}`, `${candidate.label}${candidate.current ? " (current)" : ""}`,
                selection?.provider === entry.id && selection.model === candidate.id, () => {
                  mutation.reset();
                  setSelection({ provider: entry.id, model: candidate.id, ...defaultSelection(entry, candidate, source) });
                }))}
            </View> : null}
          </View>;
        })}
        {model && selection ? <View style={{ gap: space }}>
          <Text style={styles.hint}>Selected: <Text style={styles.body}>{provider?.label} · {model.label}</Text></Text>
          <View style={{ gap: space / 2 }}>
            <Text style={styles.sectionLabel}>Effort</Text>
            {model.thinkingOptions.length ? <View style={styles.chips}>
              {model.thinkingOptions.map((entry) => chip(`effort-${entry.id}`, entry.label, selection.thinkingOptionId === entry.id,
                () => setSelection({ ...selection, thinkingOptionId: entry.id })))}
            </View> : <Text style={styles.hint}>Provider default</Text>}
          </View>
          <View style={{ gap: space / 2 }}>
            <Text style={styles.sectionLabel}>Mode</Text>
            <View style={styles.chips}>
              {chip("default-mode", "Provider default", !selection.modeId, () => setSelection({ ...selection, modeId: undefined }))}
              {provider?.modes.map((mode) => chip(`mode-${mode.id}`, mode.label, selection.modeId === mode.id,
                () => setSelection({ ...selection, modeId: mode.id })))}
            </View>
          </View>
        </View> : null}
      </ScrollView>
      {mutation.isError ? <Text selectable style={styles.error}>{String(mutation.error)}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Switch now" disabled={mutation.isPending || !model || query.isError}
        onPress={() => mutation.mutate()} style={styles.button}>
        <Text style={styles.buttonText}>{mutation.isPending ? "Switching..." : "Switch now"}</Text>
      </Pressable>
    </View>
  );
}

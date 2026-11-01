import type { PluginButtonContentProps, PluginClientContext } from "@getpaseo/plugin/client";
import { useAgent, usePaseo, useRpc } from "@getpaseo/plugin/client";
import { Modal, ScrollView, TextInput, useToast } from "@getpaseo/plugin/client/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { OPEN_AGENT_SCREEN_ID, isRunning, switchRpc } from "../shared/switchboard";
import { buildTargets, defaultSelection, filterTargets, isSearching, resolveExpansion, toggleProvider, type SourceTarget, type TargetProvider } from "./targets";

type PickerSource = SourceTarget & { status: string; cwd: string };

// The pill popover is only the mount point: it renders the host Modal, so the picker appears as a
// centered dialog (a sheet on compact layouts) and closing the dialog closes the popover.
export function createPickerPopover(openScreen: PluginClientContext["openScreen"]) {
  function AgentDialog({ agentId, theme, layout, close }: PluginButtonContentProps & { context: "agent" }) {
    const source = useAgent(agentId, (agent): PickerSource => ({
      provider: agent.provider, model: agent.model ?? null, currentModeId: agent.currentModeId ?? null,
      status: agent.status, cwd: agent.cwd,
    }));
    if (!source) return null;
    return (
      <Modal title="Switch provider and model" open onOpenChange={(open) => { if (!open) close(); }}>
        <Modal.Content scrollable={false} contentContainerStyle={{ padding: 0, gap: 0 }}>
          <AgentPicker agentId={agentId} source={source} theme={theme} layout={layout} close={close} openScreen={openScreen} />
        </Modal.Content>
      </Modal>
    );
  }
  return function PickerPopover(props: PluginButtonContentProps) {
    return props.context === "agent" ? <AgentDialog {...props} /> : null;
  };
}

function AgentPicker({ agentId, source, theme, layout, close, openScreen }: {
  agentId: string;
  source: PickerSource;
  theme: PluginButtonContentProps["theme"];
  layout: PluginButtonContentProps["layout"];
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
  const styles = {
    root: { flex: 1, minHeight: 0, gap: space, padding: space },
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

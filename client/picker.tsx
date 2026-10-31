import type { PluginButtonContentProps, PluginClientContext } from "@getpaseo/plugin/client";
import { useAgent, usePaseo, useRpc } from "@getpaseo/plugin/client";
import { useToast } from "@getpaseo/plugin/client/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { OPEN_AGENT_SCREEN_ID, isRunning, switchRpc } from "../shared/switchboard";
import { buildTargets, defaultSelection, filterTargets, isSearching, resolveExpansion, toggleProvider, type TargetProvider } from "./targets";

export function createPicker(openScreen: PluginClientContext["openScreen"]) {
  return function Picker(props: PluginButtonContentProps) {
    if (props.context !== "agent") return null;
    return <AgentPicker {...props} agentId={props.agentId} openScreen={openScreen} />;
  };
}

function AgentPicker({ agentId, theme, layout, close, openScreen }: PluginButtonContentProps & {
  agentId: string; openScreen: PluginClientContext["openScreen"];
}) {
  const paseo = usePaseo();
  const toast = useToast();
  const switchAgent = useRpc(switchRpc);
  const source = useAgent(agentId, (agent) => ({ provider: agent.provider, model: agent.model,
    currentModeId: agent.currentModeId, status: agent.status, cwd: agent.cwd }));
  const query = useQuery({ queryKey: ["switchboard-providers", agentId, source?.cwd], enabled: Boolean(source),
    queryFn: () => {
      if (!source) throw new Error("The source agent is no longer available.");
      return paseo.providers.snapshot({ cwd: source.cwd });
    }, staleTime: 0 });
  useEffect(() => paseo.providers.subscribe(() => { void query.refetch(); }), [paseo, query.refetch]);
  const providers = query.data ? buildTargets(query.data, source ?? undefined) : [];
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<TargetProvider["id"]> | null>(null);
  // Capture the first non-empty catalog once, including when it arrives after the initial render.
  const next = resolveExpansion(expanded, providers);
  if (next !== expanded) setExpanded(next);
  const searching = isSearching(search);
  const visibleProviders = filterTargets(providers, search);
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
    root: { backgroundColor: theme.colors.surface0, gap: space, padding: space, maxHeight: layout.compact ? 480 : 600 },
    title: { color: theme.colors.foreground, fontSize: layout.compact ? 16 : 18, fontWeight: "600" as const },
    label: { color: theme.colors.foregroundMuted }, text: { color: theme.colors.foreground }, error: { color: theme.colors.statusWarning },
    choice: { padding: space, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
    search: { color: theme.colors.foreground, backgroundColor: theme.colors.surface1 },
    selected: { backgroundColor: theme.colors.surface1, borderColor: theme.colors.accent },
    button: { padding: space, backgroundColor: theme.colors.accent, borderRadius: 8, opacity: mutation.isPending || !model ? 0.5 : 1 },
    buttonText: { color: theme.colors.accentForeground, fontWeight: "600" as const },
  };
  const button = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected, disabled: mutation.isPending }}
      accessibilityLabel={label} disabled={mutation.isPending} onPress={onPress} style={[styles.choice, selected && styles.selected]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
  if (!source) return <View style={styles.root}><Text style={styles.error}>The source agent is no longer available.</Text></View>;
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Switch provider and model</Text>
      {isRunning(source.status) ? <Text style={styles.error}>This agent is running and will be interrupted.</Text> : null}
      <TextInput accessibilityLabel="Search models" placeholder="Search models" autoCapitalize="none" autoCorrect={false}
        value={search} onChangeText={setSearch} placeholderTextColor={theme.colors.foregroundMuted} style={[styles.choice, styles.search]} />
      {searching ? button("clear-search", "Clear search", false, () => setSearch("")) : null}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: space }}>
        {query.isPending ? <Text style={styles.label}>Loading providers...</Text> : null}
        {query.isError ? <Text style={styles.error}>{String(query.error)}</Text> : null}
        {query.isError ? button("retry", "Retry provider discovery", false, () => { void query.refetch(); }) : null}
        {query.isSuccess && !providers.some((entry) => entry.models.length) ? <Text style={styles.label}>No enabled, available models were reported.</Text> : null}
        {query.isSuccess && searching && !visibleProviders.length ? <View style={{ gap: space }}>
          <Text style={styles.label}>No models match "{search}"</Text>
        </View> : null}
        {visibleProviders.map((entry) => {
          const isExpanded = searching || expanded?.has(entry.id) === true;
          const count = entry.models.length;
          return <View key={entry.id} style={{ gap: space }}>
            {searching ? <Text accessibilityRole="header" style={styles.title}>
              ▾ {entry.label} ({count} of {providers.find((candidate) => candidate.id === entry.id)!.models.length})
            </Text> : <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded, disabled: mutation.isPending }}
              accessibilityLabel={`${entry.label}, ${count} ${count === 1 ? "model" : "models"}, ${isExpanded ? "expanded" : "collapsed"}`}
              disabled={mutation.isPending} onPress={() => setExpanded((value) => toggleProvider(value ?? new Set(), entry.id))} style={styles.choice}>
              <Text style={styles.title}>{isExpanded ? "▾" : "▸"} {entry.label} ({count})</Text>
            </Pressable>}
            {isExpanded ? entry.models.map((candidate) => button(`${entry.id}/${candidate.id}`, `${candidate.label}${candidate.current ? " (current)" : ""}`,
              selection?.provider === entry.id && selection.model === candidate.id, () => {
                mutation.reset();
                setSelection({ provider: entry.id, model: candidate.id, ...defaultSelection(entry, candidate, source) });
              })) : null}
          </View>;
        })}
        {model && selection ? <View style={{ gap: space }}>
          <Text style={styles.label}>Selected: {provider?.label} · {model.label}</Text>
          <Text style={styles.title}>Effort</Text>
          {model.thinkingOptions.length ? model.thinkingOptions.map((option) => button(`effort-${option.id}`, option.label,
            selection.thinkingOptionId === option.id, () => setSelection({ ...selection, thinkingOptionId: option.id }))) : <Text style={styles.label}>Provider default</Text>}
          <Text style={styles.title}>Mode</Text>
          {button("default-mode", "Provider default", !selection.modeId, () => setSelection({ ...selection, modeId: undefined }))}
          {provider?.modes.map((mode) => button(`mode-${mode.id}`, mode.label, selection.modeId === mode.id,
            () => setSelection({ ...selection, modeId: mode.id })))}
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

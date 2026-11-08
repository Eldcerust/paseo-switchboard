import type { PluginButtonContentProps, PluginClientContext } from "@getpaseo/plugin/client";
import { useAgent } from "@getpaseo/plugin/client";
import { Modal, ScrollView, TextInput, useToast } from "@getpaseo/plugin/client/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { isDiscovering, readCatalog } from "../shared/catalog";
import { OPEN_AGENT_SCREEN_ID, isRunning, switchRpc } from "../shared/switchboard";
import { useHostedClient, usePaseo, useRpc } from "./hub-compat";
import { buildTargets, choiceId, choiceValue, defaultSelection, effortChoices, filterTargets, isSearching, modeChoices, type Choice, type SourceTarget, type TargetProvider } from "./targets";

type PickerSource = SourceTarget & { status: string; cwd: string };

const HOSTED_PICKER_MAX_HEIGHT = 340;
const MODAL_PICKER_MAX_HEIGHT = 420;
const RENDER_LIMIT = 200;
const DISCOVERY_POLL_MS = 400;
const DISCOVERY_POLL_LIMIT_MS = 30_000;

// The pill popover is only the mount point: it renders the host Modal, so the picker appears as a
// centered dialog (a sheet on compact layouts) and closing the dialog closes the popover.
// Inside the Pill hub it is a tab body instead: the picker is drawn inline, with a fixed height
// because its model list fills whatever space it is given and the hub's body has no height of its own.
export function createPickerPopover(openScreen: PluginClientContext["openScreen"]) {
  function AgentDialog({ agentId, theme, layout, close }: PluginButtonContentProps & { context: "agent" }) {
    const hosted = useHostedClient();
    const { height: windowHeight } = useWindowDimensions();
    const source = useAgent(agentId, (agent): PickerSource => ({
      provider: agent.provider, model: agent.model ?? null, currentModeId: agent.currentModeId ?? null,
      status: agent.status, cwd: agent.cwd,
    }));
    if (!source) return null;
    const picker = <AgentPicker agentId={agentId} source={source} theme={theme} layout={layout} close={close} openScreen={openScreen} />;
    // Keep the body at one size. Collapsing the last provider group shrinks the content, and a
    // resize under the pointer makes the host dismiss the popover instead of showing the hint.
    const bodyHeight = Math.max(280, Math.min(hosted ? HOSTED_PICKER_MAX_HEIGHT : MODAL_PICKER_MAX_HEIGHT, Math.round(windowHeight * 0.5)));
    if (hosted) return <View style={{ height: bodyHeight }}>{picker}</View>;
    return (
      <Modal title="Switch provider and model" open onOpenChange={(open) => { if (!open) close(); }}>
        <Modal.Content scrollable={false} contentContainerStyle={{ padding: 0, gap: 0, height: bodyHeight }}>
          {picker}
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
  // Show whatever is ready straight away and keep refreshing while providers are still being discovered,
  // so they appear as they finish instead of the dialog waiting on the slowest one (or showing nothing).
  const [openedAt] = useState(() => Date.now());
  const query = useQuery({ queryKey: ["switchboard-providers", agentId, source.cwd], enabled: Boolean(source.cwd),
    queryFn: () => readCatalog(paseo.providers, source.cwd), staleTime: 0,
    refetchInterval: (state) => isDiscovering(state.state.data) && Date.now() - openedAt < DISCOVERY_POLL_LIMIT_MS ? DISCOVERY_POLL_MS : false });
  const discovering = isDiscovering(query.data);
  useEffect(() => paseo.providers.subscribe(() => { void query.refetch(); }), [paseo, query.refetch]);
  const providers = query.data ? buildTargets(query.data, source) : [];
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState<"effort" | "mode" | null>(null);
  const [tab, setTab] = useState<TargetProvider["id"]>();
  const searching = isSearching(search);
  const visibleProviders = filterTargets(providers, search);
  // One provider at a time as tabs: the whole picker fits one fixed-size body, so nothing scrolls.
  const activeProvider = visibleProviders.find((entry) => entry.id === tab) ?? visibleProviders.find((entry) => entry.id === source.provider) ?? visibleProviders[0];
  // Only the model list scrolls; the rest of the body is fixed so the host never resizes or scrolls.
  const total = activeProvider?.models.length ?? 0;
  const shownModels = activeProvider?.models.slice(0, RENDER_LIMIT) ?? [];
  const hiddenCount = total - shownModels.length;
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
    root: { flex: 1, minHeight: 0, gap: 6, paddingHorizontal: space, paddingBottom: space, paddingTop: 2 },
    body: { color: theme.colors.foreground, fontSize: layout.compact ? 13 : 14 },
    hint: { color: theme.colors.foregroundMuted, fontSize: layout.compact ? 12 : 13 },
    error: { color: theme.colors.statusWarning, fontSize: layout.compact ? 12 : 13 },
    searchRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: space },
    search: { flex: 1, color: theme.colors.foregroundMuted, backgroundColor: theme.colors.surface1, borderRadius: 8,
      paddingHorizontal: space, paddingVertical: layout.compact ? 6 : 7, fontSize: layout.compact ? 12 : 13 },
    count: { color: theme.colors.foregroundMuted, fontSize: layout.compact ? 11 : 12 },
    panes: { flex: 1, minHeight: 0, flexDirection: "row" as const, gap: space },
    rail: { width: layout.compact ? 116 : 136, gap: 6 },
    railItem: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, gap: 6,
      paddingHorizontal: 12, paddingVertical: layout.compact ? 9 : 10, borderRadius: 14, backgroundColor: theme.colors.surface1 },
    railItemActive: { backgroundColor: theme.colors.accent },
    railText: { flexShrink: 1, color: theme.colors.foreground, fontSize: layout.compact ? 13 : 14, fontWeight: "600" as const },
    railTextActive: { color: theme.colors.accentForeground },
    list: { flex: 1, minWidth: 0, minHeight: 0 },
    option: { height: layout.compact ? 34 : 38, justifyContent: "center" as const, paddingHorizontal: 12, borderRadius: 14, backgroundColor: theme.colors.surface1 },
    optionSelected: { backgroundColor: theme.colors.surface1, borderWidth: 1, borderColor: theme.colors.accent },
    optionText: { color: theme.colors.foreground, fontSize: layout.compact ? 13 : 14 },
    optionTextSelected: { color: theme.colors.accent, fontWeight: "600" as const },
    link: { paddingVertical: space / 2 },
    linkText: { color: theme.colors.accent, fontSize: layout.compact ? 12 : 13, fontWeight: "600" as const },
    button: { paddingVertical: layout.compact ? 9 : 10, alignItems: "center" as const, backgroundColor: theme.colors.accent, borderRadius: 8, opacity: mutation.isPending || !model ? 0.5 : 1 },
    buttonText: { color: theme.colors.accentForeground, fontSize: layout.compact ? 14 : 15, fontWeight: "600" as const },
  };
  const option = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected, disabled: mutation.isPending }}
      accessibilityLabel={label} disabled={mutation.isPending} onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text numberOfLines={1} style={[styles.optionText, selected && styles.optionTextSelected]}>{selected ? "✓ " : ""}{label}</Text>
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
      <View style={styles.panes}>
        <View style={styles.rail}>
          {visibleProviders.map((entry) => {
            const active = entry.id === activeProvider?.id;
            const count = entry.models.length;
            return <Pressable key={entry.id} accessibilityRole="button" accessibilityState={{ selected: active, disabled: mutation.isPending }}
              accessibilityLabel={`${entry.label}, ${count} ${count === 1 ? "model" : "models"}`} disabled={mutation.isPending}
              onPress={(event) => { event.stopPropagation(); setTab(entry.id); }} style={[styles.railItem, active && styles.railItemActive]}>
              <Text style={[styles.railText, active && styles.railTextActive]} numberOfLines={1}>{entry.label}</Text>
              <Text style={styles.count}>{count}</Text>
            </Pressable>;
          })}
        </View>
        <ScrollView style={styles.list} contentContainerStyle={{ gap: 6 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
          {query.isPending || discovering ? <Text style={styles.hint}>Loading providers...</Text> : null}
          {query.isError ? <Text style={styles.error}>{String(query.error)}</Text> : null}
          {query.isError ? link("retry", "Retry provider discovery", () => { void query.refetch(); }) : null}
          {query.isSuccess && !discovering && !providers.some((entry) => entry.models.length) ? <Text style={styles.hint}>No enabled, available models were reported.</Text> : null}
          {query.isSuccess && searching && !visibleProviders.length ? <Text style={styles.hint}>No models match "{search}"</Text> : null}
          {shownModels.map((candidate) => option(`${activeProvider!.id}/${candidate.id}`,
            `${candidate.label}${activeProvider!.models.filter((entry) => entry.label === candidate.label).length > 1 ? ` · ${candidate.id}` : ""}${candidate.current ? " (current)" : ""}`,
            selection?.provider === activeProvider!.id && selection.model === candidate.id, () => {
              mutation.reset();
              setSelection({ provider: activeProvider!.id, model: candidate.id, ...defaultSelection(activeProvider!, candidate, source) });
            }))}
          {hiddenCount > 0 ? <Text style={styles.hint}>+{hiddenCount} more. Search to narrow.</Text> : null}
        </ScrollView>
      </View>
      {/* Effort, mode and the Switch button sit below the model grid. */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Dropdown label="Effort" choices={effortChoices(model)} value={choiceValue(selection?.thinkingOptionId)} open={menu === "effort"}
          disabled={mutation.isPending || !model || !model.thinkingOptions.length} colors={theme.colors} compact={layout.compact}
          onToggle={() => setMenu((value) => (value === "effort" ? null : "effort"))}
          onChange={(value) => { setMenu(null); if (selection) setSelection({ ...selection, thinkingOptionId: choiceId(value) }); }} />
        <Dropdown label="Mode" choices={modeChoices(provider)} value={choiceValue(selection?.modeId)} open={menu === "mode"}
          disabled={mutation.isPending || !model} colors={theme.colors} compact={layout.compact}
          onToggle={() => setMenu((value) => (value === "mode" ? null : "mode"))}
          onChange={(value) => { setMenu(null); if (selection) setSelection({ ...selection, modeId: choiceId(value) }); }} />
      </View>
      {mutation.isError ? <Text selectable style={styles.error}>{String(mutation.error)}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Switch now" disabled={mutation.isPending || !model || query.isError}
        onPress={() => mutation.mutate()} style={styles.button}>
        <Text style={styles.buttonText}>{mutation.isPending ? "Switching..." : "Switch now"}</Text>
      </Pressable>
    </View>
  );
}

// Effort and mode are two compact dropdowns side by side. The menu opens upward inside the picker body
// (not a host popover), so opening it never resizes the surface.
function Dropdown({ label, choices, value, disabled, open, colors, compact, onToggle, onChange }: {
  label: string;
  choices: Choice[];
  value: string;
  disabled: boolean;
  open: boolean;
  colors: PluginButtonContentProps["theme"]["colors"];
  compact: boolean;
  onToggle(): void;
  onChange(value: string): void;
}) {
  const options = choices.filter((choice) => choice.label !== "Select a model first");
  const text = (choice: Choice) => (choice.label === "Provider default" ? "Default" : choice.label);
  const current = options.find((choice) => choice.value === value);
  const size = compact ? 13 : 14;
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      {open && !disabled ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 44, zIndex: 20, maxHeight: 190, borderRadius: 10, borderWidth: 1,
          borderColor: colors.border, backgroundColor: colors.surface1, overflow: "hidden" }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 4, gap: 2 }}>
            {options.map((choice) => {
              const selected = choice.value === value;
              return (
                <Pressable key={choice.value} accessibilityRole="button" accessibilityLabel={`${label}: ${choice.label}`}
                  accessibilityState={{ selected }} onPress={() => onChange(choice.value)}
                  style={{ height: 34, justifyContent: "center", paddingHorizontal: 10, borderRadius: 6, backgroundColor: selected ? colors.accent : "transparent" }}>
                  <Text numberOfLines={1} style={{ color: selected ? colors.accentForeground : colors.foreground, fontSize: size }}>{text(choice)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${current ? text(current) : "none"}`} accessibilityState={{ expanded: open, disabled }}
        disabled={disabled} onPress={(event) => { event.stopPropagation(); onToggle(); }}
        style={{ height: 38, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1,
          borderColor: open ? colors.accent : colors.border, backgroundColor: colors.surface1, opacity: disabled ? 0.5 : 1 }}>
        <Text style={{ color: colors.foregroundMuted, fontSize: size - 1 }}>{label}</Text>
        <Text numberOfLines={1} style={{ flex: 1, color: colors.foreground, fontSize: size, fontWeight: "600" }}>{current ? text(current) : "-"}</Text>
        <Text style={{ color: colors.foregroundMuted, fontSize: size - 1 }}>{open ? "▴" : "▾"}</Text>
      </Pressable>
    </View>
  );
}

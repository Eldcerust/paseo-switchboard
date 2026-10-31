import type { PluginClientContext, PluginTimelineItemProps } from "@getpaseo/plugin/client";
import { Pressable, Text, View } from "react-native";
import { OPEN_AGENT_SCREEN_ID, type SwitchedRowData } from "../shared/switchboard";

export function createSwitchedRow(openScreen: PluginClientContext["openScreen"]) {
  return function SwitchedRow({ item: { data }, theme, layout }: PluginTimelineItemProps<SwitchedRowData>) {
    return <View style={{ gap: layout.compact ? 4 : 8, padding: layout.compact ? 8 : 12, backgroundColor: theme.colors.surface1 }}>
      <Text style={{ color: theme.colors.foreground }}>
        Switched to {data.to.providerLabel} · {data.to.modelLabel}{data.thinkingOptionId ? ` (${data.thinkingOptionId})` : ""}
      </Text>
      <Text selectable style={{ color: theme.colors.foregroundMuted }}>{data.handoffPath}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Open replacement agent"
        onPress={() => openScreen({ screenId: OPEN_AGENT_SCREEN_ID, params: { agentId: data.newAgentId } })}>
        <Text style={{ color: theme.colors.accent }}>Open agent</Text>
      </Pressable>
    </View>;
  };
}

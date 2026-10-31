import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
type AgentId = string;

// Remember forwarded routes so Back does not immediately bounce forward again.
export function createOpenAgentScreen() {
  const forwarded = new Set<AgentId>();
  return function OpenAgentScreen({ params, navigation, theme, layout }: PluginScreenProps) {
    const agentId = params.agentId;
    useEffect(() => {
      if (!agentId || !navigation || forwarded.has(agentId)) return;
      forwarded.add(agentId);
      navigation.openAgent({ agentId });
    }, [agentId, navigation]);
    return <View style={{ flex: 1, padding: layout.compact ? 12 : 24, gap: layout.compact ? 8 : 12, backgroundColor: theme.colors.surface0 }}>
      <Text style={{ color: theme.colors.foregroundMuted }}>{agentId ? "The replacement agent is ready." : "No agent was specified."}</Text>
      {agentId && navigation ? <Pressable accessibilityRole="button" accessibilityLabel="Open replacement agent"
        onPress={() => navigation.openAgent({ agentId })} style={{ padding: layout.compact ? 10 : 14, backgroundColor: theme.colors.accent }}>
        <Text style={{ color: theme.colors.accentForeground }}>Open agent</Text>
      </Pressable> : null}
    </View>;
  };
}

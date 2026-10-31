import type { PluginServerContext } from "@getpaseo/plugin/server";
import { createSwitcher } from "./server/switch";
import { switchRpc } from "./shared/switchboard";

export default function contribute(server: PluginServerContext) {
  const switcher = createSwitcher();
  server.handle(switchRpc, (input, { paseo }) => switcher.switchAgent(input, paseo));
  return () => switcher.dispose();
}

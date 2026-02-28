import type { ActionNodeCoreDefinition } from "../types";

export const openTerminalAtPathDefinition: ActionNodeCoreDefinition<"open_terminal_at_path"> = {
  type: "open_terminal_at_path",
  label: "Open terminal at path",
  createDefaultParams: () => ({ path: "" }),
  summarize: (node) => String(node.params.path ?? "(add path)")
};

import type { ActionNodeCoreDefinition } from "../types";

export const executeCommandDefinition: ActionNodeCoreDefinition<"execute_command"> = {
  type: "execute_command",
  label: "Execute command",
  createDefaultParams: () => ({ command: "", workingDirectory: "" }),
  summarize: (node) => String(node.params.command ?? "(add command)")
};

import type { ActionNodeCoreDefinition } from "../types";

export const delayDefinition: ActionNodeCoreDefinition<"delay"> = {
  type: "delay",
  label: "Delay",
  createDefaultParams: () => ({ milliseconds: 1000 }),
  summarize: (node) => {
    const raw = Number(node.params.milliseconds ?? 0);
    const milliseconds = Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
    return `${milliseconds} ms`;
  }
};

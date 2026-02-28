import type { ActionNodeCoreDefinition } from "../types";

export const openAppDefinition: ActionNodeCoreDefinition<"open_app"> = {
  type: "open_app",
  label: "Open app",
  createDefaultParams: () => ({ appName: "", appPath: "" }),
  summarize: (node) => {
    const appName = String(node.params.appName ?? "").trim();
    const appPath = String(node.params.appPath ?? "").trim();
    return appName || appPath || "(select app)";
  }
};

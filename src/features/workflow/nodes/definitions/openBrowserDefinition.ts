import type { ActionNodeCoreDefinition } from "../types";

export const openBrowserDefinition: ActionNodeCoreDefinition<"open_browser"> = {
  type: "open_browser",
  label: "Open browser",
  createDefaultParams: () => ({}),
  summarize: () => "Launch default browser"
};

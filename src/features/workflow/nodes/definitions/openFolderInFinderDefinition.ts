import type { ActionNodeCoreDefinition } from "../types";

export const openFolderInFinderDefinition: ActionNodeCoreDefinition<"open_folder_in_finder"> = {
  type: "open_folder_in_finder",
  label: "Open folder in Finder",
  createDefaultParams: () => ({ path: "" }),
  summarize: (node) => String(node.params.path ?? "(add path)")
};

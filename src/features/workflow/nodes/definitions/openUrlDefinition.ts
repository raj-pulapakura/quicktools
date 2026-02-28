import type { ActionNodeCoreDefinition } from "../types";

export const openUrlDefinition: ActionNodeCoreDefinition<"open_url"> = {
  type: "open_url",
  label: "Open URL",
  createDefaultParams: () => ({ urls: ["https://"] }),
  summarize: (node) => {
    const urls = Array.isArray(node.params.urls)
      ? node.params.urls.map((entry) => String(entry).trim()).filter(Boolean)
      : [];

    const first = urls[0] ?? "(add URL)";
    const suffix = urls.length > 1 ? ` +${urls.length - 1}` : "";
    return `${first}${suffix}`;
  }
};

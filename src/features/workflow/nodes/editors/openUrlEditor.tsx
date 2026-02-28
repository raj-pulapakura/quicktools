import type { ActionNodeEditorRenderer } from "../types";

export const renderOpenUrlEditor: ActionNodeEditorRenderer = ({ node, updateNode }) => (
  <label>
    URLs (one per line)
    <textarea
      rows={5}
      value={Array.isArray(node.params.urls) ? node.params.urls.join("\n") : ""}
      onChange={(event) => {
        const urls = event.target.value
          .split(/\r?\n/)
          .map((url) => url.trim())
          .filter(Boolean);

        updateNode((current) => ({
          ...current,
          params: { ...current.params, urls }
        }));
      }}
    />
  </label>
);

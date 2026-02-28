import type { ActionNodeEditorRenderer } from "../types";

export const renderOpenFolderInFinderEditor: ActionNodeEditorRenderer = ({ node, updateNode }) => (
  <label>
    Folder path
    <input
      type="text"
      placeholder="~/projects/work"
      value={String(node.params.path ?? "")}
      onChange={(event) => {
        const path = event.target.value;
        updateNode((current) => ({
          ...current,
          params: { ...current.params, path }
        }));
      }}
    />
  </label>
);

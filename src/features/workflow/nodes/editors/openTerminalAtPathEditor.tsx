import type { ActionNodeEditorRenderer } from "../types";

export const renderOpenTerminalAtPathEditor: ActionNodeEditorRenderer = ({ node, updateNode }) => (
  <label>
    Directory path
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

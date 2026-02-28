import type { ActionNodeEditorRenderer } from "../types";

export const renderDelayEditor: ActionNodeEditorRenderer = ({ node, updateNode }) => (
  <label>
    Delay (milliseconds)
    <input
      type="number"
      min={0}
      step={1}
      value={Number(node.params.milliseconds ?? 0)}
      onChange={(event) => {
        const nextValue = Number.parseInt(event.target.value, 10);
        const milliseconds = Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0;

        updateNode((current) => ({
          ...current,
          params: { ...current.params, milliseconds }
        }));
      }}
    />
  </label>
);

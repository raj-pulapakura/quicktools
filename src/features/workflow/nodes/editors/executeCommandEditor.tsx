import type { ActionNodeEditorRenderer } from "../types";

export const renderExecuteCommandEditor: ActionNodeEditorRenderer = ({ node, updateNode }) => (
  <>
    <label>
      Command
      <textarea
        rows={4}
        placeholder="npm run dev"
        value={String(node.params.command ?? "")}
        onChange={(event) => {
          const command = event.target.value;
          updateNode((current) => ({
            ...current,
            params: { ...current.params, command }
          }));
        }}
      />
    </label>
    <label>
      Working directory (optional)
      <input
        type="text"
        placeholder="~/projects/work"
        value={String(node.params.workingDirectory ?? "")}
        onChange={(event) => {
          const workingDirectory = event.target.value;
          updateNode((current) => ({
            ...current,
            params: { ...current.params, workingDirectory }
          }));
        }}
      />
    </label>
  </>
);

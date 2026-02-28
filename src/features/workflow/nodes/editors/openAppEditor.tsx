import type { ActionNodeEditorRenderer } from "../types";

export const renderOpenAppEditor: ActionNodeEditorRenderer = ({ node, updateNode }) => (
  <>
    <label>
      App name
      <input
        type="text"
        placeholder="Visual Studio Code"
        value={String(node.params.appName ?? "")}
        onChange={(event) => {
          const appName = event.target.value;
          updateNode((current) => ({
            ...current,
            params: { ...current.params, appName }
          }));
        }}
      />
    </label>
    <label>
      App path
      <input
        type="text"
        placeholder="/Applications/Visual Studio Code.app"
        value={String(node.params.appPath ?? "")}
        onChange={(event) => {
          const appPath = event.target.value;
          updateNode((current) => ({
            ...current,
            params: { ...current.params, appPath }
          }));
        }}
      />
    </label>
  </>
);

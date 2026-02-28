import type { ActionNodeEditorRenderer } from "../types";

export const renderOpenBrowserEditor: ActionNodeEditorRenderer = () => (
  <p className="node-editor-hint">No parameters for this node type.</p>
);

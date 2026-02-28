import type { ActionNodeType, WorkflowNode } from "../../../types/workflow";
import {
  getActionNodeDefinition,
  getNodeTypeLabel,
  isActionNodeType,
  listActionNodeDefinitions,
  withNodeTypeDefaults
} from "../nodes/registry";
import type { NodeUpdateFn } from "../nodes/types";
import { START_NODE_ID } from "../constants";

interface NodeEditorPanelProps {
  selectedNode?: WorkflowNode;
  updateSelectedNode: NodeUpdateFn;
  onRemoveSelectedNode: () => void;
}

export function NodeEditorPanel({
  selectedNode,
  updateSelectedNode,
  onRemoveSelectedNode
}: NodeEditorPanelProps) {
  if (!selectedNode) {
    return <p className="node-editor-empty">Select a node to edit parameters.</p>;
  }

  if (selectedNode.id === START_NODE_ID || !isActionNodeType(selectedNode.type)) {
    return (
      <div className="node-editor-form">
        <h3>START</h3>
        <p className="node-editor-hint">
          This node is immutable and cannot be deleted. Connect first-tier actions from START.
        </p>
      </div>
    );
  }

  const actionNodeDefinitions = listActionNodeDefinitions();
  const selectedNodeType = selectedNode.type;
  const selectedNodeDefinition = getActionNodeDefinition(selectedNodeType);

  return (
    <div className="node-editor-form">
      <h3>{getNodeTypeLabel(selectedNode.type)}</h3>
      <label>
        Node type
        <select
          value={selectedNode.type}
          onChange={(event) => {
            const nextType = event.target.value as ActionNodeType;
            updateSelectedNode((node) => {
              if (!isActionNodeType(node.type)) {
                return node;
              }

              return withNodeTypeDefaults(node, nextType);
            });
          }}
        >
          {actionNodeDefinitions.map((definition) => (
            <option key={definition.type} value={definition.type}>
              {definition.label}
            </option>
          ))}
        </select>
      </label>

      {selectedNodeDefinition.renderEditor({
        node: selectedNode,
        updateNode: updateSelectedNode
      })}

      <button className="danger" onClick={onRemoveSelectedNode}>
        Remove node
      </button>
    </div>
  );
}

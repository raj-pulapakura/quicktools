import type { ReactNode } from "react";
import type { ActionNodeType, NodeType, WorkflowNode } from "../../../types/workflow";

export interface ActionNodeCoreDefinition<TType extends ActionNodeType = ActionNodeType> {
  type: TType;
  label: string;
  createDefaultParams: () => Record<string, unknown>;
  summarize: (node: WorkflowNode) => string;
}

export type NodeUpdateFn = (updater: (node: WorkflowNode) => WorkflowNode) => void;

export interface ActionNodeEditorProps {
  node: WorkflowNode;
  updateNode: NodeUpdateFn;
}

export type ActionNodeEditorRenderer = (props: ActionNodeEditorProps) => ReactNode;

export interface ActionNodeDefinition<TType extends ActionNodeType = ActionNodeType>
  extends ActionNodeCoreDefinition<TType> {
  renderEditor: ActionNodeEditorRenderer;
}

export const isActionNodeType = (type: NodeType): type is ActionNodeType => type !== "start";

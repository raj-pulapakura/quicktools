import type { ActionNodeType, NodeType, WorkflowNode } from "../../../types/workflow";
import { delayDefinition } from "./definitions/delayDefinition";
import { executeCommandDefinition } from "./definitions/executeCommandDefinition";
import { openAppDefinition } from "./definitions/openAppDefinition";
import { openBrowserDefinition } from "./definitions/openBrowserDefinition";
import { openFolderInFinderDefinition } from "./definitions/openFolderInFinderDefinition";
import { openTerminalAtPathDefinition } from "./definitions/openTerminalAtPathDefinition";
import { openUrlDefinition } from "./definitions/openUrlDefinition";
import { isActionNodeType, type ActionNodeCoreDefinition } from "./types";

export const ACTION_NODE_TYPES = [
  "delay",
  "open_app",
  "open_browser",
  "open_url",
  "open_terminal_at_path",
  "execute_command",
  "open_folder_in_finder"
] as const satisfies readonly ActionNodeType[];

type MissingActionNodeType = Exclude<ActionNodeType, (typeof ACTION_NODE_TYPES)[number]>;
const _allActionNodeTypesCovered: MissingActionNodeType extends never ? true : never = true;
void _allActionNodeTypesCovered;

const actionNodeCoreDefinitions = [
  delayDefinition,
  openAppDefinition,
  openBrowserDefinition,
  openUrlDefinition,
  openTerminalAtPathDefinition,
  executeCommandDefinition,
  openFolderInFinderDefinition
] as const satisfies readonly ActionNodeCoreDefinition[];

const actionNodeCoreDefinitionMap = new Map<ActionNodeType, ActionNodeCoreDefinition>();

for (const definition of actionNodeCoreDefinitions) {
  if (actionNodeCoreDefinitionMap.has(definition.type)) {
    throw new Error(`Duplicate node definition: ${definition.type}`);
  }

  actionNodeCoreDefinitionMap.set(definition.type, definition);
}

for (const nodeType of ACTION_NODE_TYPES) {
  if (!actionNodeCoreDefinitionMap.has(nodeType)) {
    throw new Error(`Missing node definition: ${nodeType}`);
  }
}

export const listActionNodeCoreDefinitions = (): readonly ActionNodeCoreDefinition[] =>
  ACTION_NODE_TYPES.map((nodeType) => getActionNodeCoreDefinition(nodeType));

export const getActionNodeCoreDefinition = (type: ActionNodeType): ActionNodeCoreDefinition => {
  const definition = actionNodeCoreDefinitionMap.get(type);
  if (!definition) {
    throw new Error(`Unsupported node type: ${type}`);
  }

  return definition;
};

export const createDefaultParamsForType = (type: NodeType): Record<string, unknown> => {
  if (!isActionNodeType(type)) {
    return {};
  }

  return getActionNodeCoreDefinition(type).createDefaultParams();
};

export const getNodeTypeLabel = (type: NodeType): string => {
  if (!isActionNodeType(type)) {
    return "START";
  }

  return getActionNodeCoreDefinition(type).label;
};

export const summarizeNode = (node: WorkflowNode): string => {
  if (!isActionNodeType(node.type)) {
    return "Workflow entry point";
  }

  return getActionNodeCoreDefinition(node.type).summarize(node);
};

export const withNodeTypeDefaults = (node: WorkflowNode, nextType: NodeType): WorkflowNode => ({
  ...node,
  type: nextType,
  params: createDefaultParamsForType(nextType)
});

export { isActionNodeType };

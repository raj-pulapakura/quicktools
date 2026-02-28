import type { ActionNodeType } from "../../../types/workflow";
import { actionNodeEditorRenderers } from "./editorRegistry";
import {
  ACTION_NODE_TYPES,
  createDefaultParamsForType,
  getActionNodeCoreDefinition,
  getNodeTypeLabel,
  isActionNodeType,
  listActionNodeCoreDefinitions,
  summarizeNode,
  withNodeTypeDefaults
} from "./coreRegistry";
import type { ActionNodeDefinition } from "./types";

const actionNodeDefinitions = listActionNodeCoreDefinitions().map((definition) => {
  const renderEditor = actionNodeEditorRenderers[definition.type];
  if (!renderEditor) {
    throw new Error(`Missing editor renderer for node type: ${definition.type}`);
  }

  return {
    ...definition,
    renderEditor
  } satisfies ActionNodeDefinition;
});

const actionNodeDefinitionMap = new Map<ActionNodeType, ActionNodeDefinition>(
  actionNodeDefinitions.map((definition) => [definition.type, definition])
);

for (const nodeType of ACTION_NODE_TYPES) {
  if (!actionNodeDefinitionMap.has(nodeType)) {
    throw new Error(`Missing node definition registration: ${nodeType}`);
  }
}

export const listActionNodeDefinitions = (): readonly ActionNodeDefinition[] =>
  ACTION_NODE_TYPES.map((nodeType) => getActionNodeDefinition(nodeType));

export const getActionNodeDefinition = (type: ActionNodeType): ActionNodeDefinition => {
  const definition = actionNodeDefinitionMap.get(type);
  if (!definition) {
    throw new Error(`Unsupported node type: ${type}`);
  }

  return definition;
};

export {
  createDefaultParamsForType,
  getActionNodeCoreDefinition,
  getNodeTypeLabel,
  isActionNodeType,
  summarizeNode,
  withNodeTypeDefaults
};

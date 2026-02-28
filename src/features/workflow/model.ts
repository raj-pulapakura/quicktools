import type { Workflow, WorkflowEdge, WorkflowNode } from "../../types/workflow";
import { START_NODE_ID, START_NODE_POSITION } from "./constants";

export const makeId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export const edgeId = (source: string, target: string): string => `${source}->${target}`;

export const edgeTouchesNode = (currentEdgeId: string, nodeId: string): boolean =>
  currentEdgeId.startsWith(`${nodeId}->`) || currentEdgeId.endsWith(`->${nodeId}`);

export const normalizeHandleId = (handleId: string | null | undefined): string | undefined =>
  typeof handleId === "string" && handleId.length > 0 ? handleId : undefined;

export const createStartNode = (): WorkflowNode => ({
  id: START_NODE_ID,
  type: "start",
  params: {},
  position: { ...START_NODE_POSITION }
});

const dedupeEdges = (edges: WorkflowEdge[]): WorkflowEdge[] => {
  const dedup = new Map<string, WorkflowEdge>();
  for (const edge of edges) {
    dedup.set(edgeId(edge.sourceNodeId, edge.targetNodeId), edge);
  }

  return Array.from(dedup.values());
};

export const normalizeWorkflow = (workflow: Workflow): Workflow => {
  const nodes: WorkflowNode[] = workflow.nodes.filter(
    (node) => node.id !== START_NODE_ID && node.type !== "start"
  );
  nodes.unshift(createStartNode());

  const validNodeIds = new Set(nodes.map((node) => node.id));

  const edges = dedupeEdges(
    workflow.edges.filter(
      (edge) =>
        validNodeIds.has(edge.sourceNodeId) &&
        validNodeIds.has(edge.targetNodeId) &&
        edge.sourceNodeId !== edge.targetNodeId &&
        edge.targetNodeId !== START_NODE_ID
    )
  );

  return {
    ...workflow,
    nodes,
    edges
  };
};

export const createEmptyWorkflow = (index: number): Workflow =>
  normalizeWorkflow({
    id: makeId(),
    name: `Workflow ${index}`,
    nodes: [],
    edges: []
  });

export const isEditableElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
};

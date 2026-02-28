import {
  MarkerType,
  type Edge,
  type Node
} from "@xyflow/react";
import type { AppliedTheme } from "../../hooks/useThemeMode";
import type { Workflow } from "../../types/workflow";
import {
  ACTION_NODE_MINIMAP_SIZE,
  START_NODE_ID,
  START_NODE_MINIMAP_SIZE,
  START_NODE_POSITION
} from "./constants";
import type { WorkflowCanvasNodeData } from "./flowNodeComponents";
import { edgeId } from "./model";
import { getNodeTypeLabel, summarizeNode } from "./nodes/registry";

export interface EdgeColors {
  selected: string;
  default: string;
}

export interface MinimapPalette {
  start: string;
  focused: string;
  default: string;
  focusedStroke: string;
  defaultStroke: string;
  maskStroke: string;
  maskColor: string;
  background: string;
}

export const getEdgeColorsForTheme = (theme: AppliedTheme): EdgeColors =>
  theme === "dark"
    ? {
        selected: "#8fb1ff",
        default: "#6f8abf"
      }
    : {
        selected: "#2d5fe0",
        default: "#4f6aa5"
      };

export const getMinimapPaletteForTheme = (theme: AppliedTheme): MinimapPalette =>
  theme === "dark"
    ? {
        start: "#23d49e",
        focused: "#8fb1ff",
        default: "#7e92ba",
        focusedStroke: "#c7d9ff",
        defaultStroke: "#6e88b8",
        maskStroke: "rgba(143, 177, 255, 0.72)",
        maskColor: "rgba(52, 77, 129, 0.35)",
        background: "rgba(17, 23, 37, 0.94)"
      }
    : {
        start: "#12b886",
        focused: "#2d5fe0",
        default: "#8a9ec5",
        focusedStroke: "#1f4ec6",
        defaultStroke: "#4f6aa5",
        maskStroke: "rgba(45, 95, 224, 0.6)",
        maskColor: "rgba(58, 114, 255, 0.12)",
        background: "rgba(255, 255, 255, 0.95)"
      };

export const getMinimapNodeColor = (
  node: Node,
  focusedNodeId: string | null,
  palette: MinimapPalette
): string => {
  const data = node.data as { isStart?: boolean } | undefined;
  if (data?.isStart) {
    return palette.start;
  }

  if (node.id === focusedNodeId) {
    return palette.focused;
  }

  return palette.default;
};

export const toFlowNodes = (
  workflow?: Workflow,
  focusedNodeId?: string | null,
  onNodePointerDown?: (nodeId: string) => void,
  onNodeClick?: (nodeId: string) => void,
  onNodeContextMenu?: (nodeId: string, x: number, y: number) => void
): Node[] => {
  if (!workflow) {
    return [];
  }

  return workflow.nodes.map((node, index) => {
    const nodeData: WorkflowCanvasNodeData = {
      nodeId: node.id,
      typeLabel: getNodeTypeLabel(node.type),
      summary: summarizeNode(node),
      isStart: node.id === START_NODE_ID,
      isFocused: node.id === focusedNodeId,
      isDraggableFocus: node.id !== START_NODE_ID && node.id === focusedNodeId,
      onPointerDown: onNodePointerDown ?? (() => undefined),
      onClick: onNodeClick ?? (() => undefined),
      onContextMenu: onNodeContextMenu ?? (() => undefined)
    };

    return {
      id: node.id,
      type: "workflowNode",
      className: "workflow-node-shell",
      initialWidth:
        node.id === START_NODE_ID ? START_NODE_MINIMAP_SIZE.width : ACTION_NODE_MINIMAP_SIZE.width,
      initialHeight:
        node.id === START_NODE_ID
          ? START_NODE_MINIMAP_SIZE.height
          : ACTION_NODE_MINIMAP_SIZE.height,
      position:
        node.id === START_NODE_ID
          ? { ...START_NODE_POSITION }
          : node.position ?? {
              x: 120 + (index % 4) * 260,
              y: 100 + Math.floor(index / 4) * 170
            },
      selected: node.id === focusedNodeId,
      draggable: node.id !== START_NODE_ID && node.id === focusedNodeId,
      data: nodeData
    };
  });
};

export const toFlowEdges = (
  workflow?: Workflow,
  selectedEdgeId?: string | null,
  colors: EdgeColors = {
    selected: "#2d5fe0",
    default: "#4f6aa5"
  }
): Edge[] => {
  if (!workflow) {
    return [];
  }

  return workflow.edges.map((edge) => {
    const id = edgeId(edge.sourceNodeId, edge.targetNodeId);
    const isSelected = id === selectedEdgeId;

    return {
      id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceHandle: edge.sourceHandleId,
      targetHandle: edge.targetHandleId,
      type: "smoothstep",
      selected: isSelected,
      style: {
        strokeWidth: isSelected ? 4 : 3,
        stroke: isSelected ? colors.selected : colors.default
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isSelected ? colors.selected : colors.default
      }
    };
  });
};

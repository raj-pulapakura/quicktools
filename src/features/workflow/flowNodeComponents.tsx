import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Handle, type NodeProps, Position } from "@xyflow/react";

const isHandleEventTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && target.closest(".react-flow__handle") !== null;

export interface WorkflowCanvasNodeData {
  [key: string]: unknown;
  nodeId: string;
  typeLabel: string;
  summary: string;
  isStart: boolean;
  isFocused: boolean;
  isDraggableFocus: boolean;
  onPointerDown: (nodeId: string) => void;
  onClick: (nodeId: string) => void;
  onContextMenu: (nodeId: string, x: number, y: number) => void;
}

export const WorkflowCanvasNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as WorkflowCanvasNodeData;

  return (
    <div
      className={`workflow-canvas-node ${nodeData.isFocused ? "focused" : ""} ${
        nodeData.isStart ? "start" : ""
      } ${nodeData.isDraggableFocus ? "draggable-focus" : "nodrag"} nopan`}
      onPointerDown={(event) => {
        if (isHandleEventTarget(event.target)) {
          return;
        }

        event.stopPropagation();
        nodeData.onPointerDown(nodeData.nodeId);
      }}
      onClick={(event) => {
        if (isHandleEventTarget(event.target)) {
          return;
        }

        event.stopPropagation();
        nodeData.onClick(nodeData.nodeId);
      }}
      onContextMenu={(event) => {
        if (isHandleEventTarget(event.target)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        nodeData.onContextMenu(nodeData.nodeId, event.clientX, event.clientY);
      }}
    >
      {!nodeData.isStart && (
        <>
          <Handle
            id="target-top"
            className="workflow-handle workflow-handle-target"
            type="target"
            position={Position.Top}
          />
          <Handle
            id="target-left"
            className="workflow-handle workflow-handle-target"
            type="target"
            position={Position.Left}
          />
        </>
      )}
      <div className="workflow-canvas-node-type">{nodeData.typeLabel}</div>
      <div className="workflow-canvas-node-summary">{nodeData.summary}</div>
      {nodeData.isStart ? (
        <Handle
          id="source-bottom"
          className="workflow-handle workflow-handle-source"
          type="source"
          position={Position.Bottom}
        />
      ) : (
        <>
          <Handle
            id="source-right"
            className="workflow-handle workflow-handle-source"
            type="source"
            position={Position.Right}
          />
          <Handle
            id="source-bottom"
            className="workflow-handle workflow-handle-source"
            type="source"
            position={Position.Bottom}
          />
        </>
      )}
    </div>
  );
};

interface WorkflowMiniMapNodeProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  className: string;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  selected: boolean;
  onClick?: (event: ReactMouseEvent, id: string) => void;
}

export const WorkflowMiniMapNode = ({
  id,
  x,
  y,
  width,
  height,
  borderRadius,
  className,
  color,
  strokeColor,
  strokeWidth,
  style,
  selected,
  onClick
}: WorkflowMiniMapNodeProps) => {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 40;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 24;
  const safeRadius = Math.max(0, Math.min(borderRadius, safeHeight / 2));

  return (
    <g transform={`translate(${x}, ${y})`} className={className}>
      <rect
        width={safeWidth}
        height={safeHeight}
        rx={safeRadius}
        ry={safeRadius}
        fill={color ?? "#8a9ec5"}
        stroke={strokeColor ?? "#4f6aa5"}
        strokeWidth={strokeWidth ?? 1.8}
        style={style}
        opacity={selected ? 1 : 0.95}
        onClick={(event) => onClick?.(event, id)}
      />
    </g>
  );
};

export const flowNodeTypes = {
  workflowNode: WorkflowCanvasNode
};

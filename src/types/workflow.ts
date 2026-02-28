export type NodeType =
  | "start"
  | "delay"
  | "open_app"
  | "open_browser"
  | "open_url"
  | "open_terminal_at_path"
  | "execute_command"
  | "open_folder_in_finder"
  | "play_spotify_playlist";

export type ActionNodeType = Exclude<NodeType, "start">;

export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  params: Record<string, unknown>;
  position?: NodePosition;
}

export interface WorkflowEdge {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandleId?: string;
  targetHandleId?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface NodeExecutionResult {
  nodeId: string;
  nodeType: NodeType;
  success: boolean;
  message: string;
}

export interface RunWorkflowResult {
  workflowId: string;
  completedNodes: number;
  results: NodeExecutionResult[];
}

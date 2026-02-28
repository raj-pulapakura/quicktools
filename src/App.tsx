import {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  NodeProps,
  Panel,
  Position,
  ReactFlow,
  useKeyPress
} from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";
import {
  ActionNodeType,
  NodeType,
  RunWorkflowResult,
  Workflow,
  WorkflowEdge,
  WorkflowNode
} from "./types/workflow";
import { ContextMenuModal } from "./components/ContextMenuModal";

const START_NODE_ID = "__start__";
const START_NODE_POSITION = { x: 80, y: 260 };
const START_NODE_MINIMAP_SIZE = { width: 244, height: 78 };
const ACTION_NODE_MINIMAP_SIZE = { width: 248, height: 96 };
const NEW_NODE_Y_OFFSET_FROM_START = 190;
const NEW_NODE_STACK_STEP = 30;
const THEME_MODE_STORAGE_KEY = "quicktools.theme-mode";
const SYSTEM_DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeMode = "light" | "dark" | "system";
type AppliedTheme = "light" | "dark";

interface ContextMenuState {
  kind: "edge" | "node";
  targetId: string;
  x: number;
  y: number;
}

const isThemeMode = (value: string): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "system";
  }

  try {
    const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    return stored && isThemeMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

const getInitialSystemDarkPreference = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(SYSTEM_DARK_MEDIA_QUERY).matches;
};

const NODE_TYPES: Array<{ value: ActionNodeType; label: string }> = [
  { value: "delay", label: "Delay" },
  { value: "open_app", label: "Open app" },
  { value: "open_browser", label: "Open browser" },
  { value: "open_url", label: "Open URL" },
  { value: "open_terminal_at_path", label: "Open terminal at path" },
  { value: "execute_command", label: "Execute command" },
  { value: "open_folder_in_finder", label: "Open folder in Finder" }
];

const nodeTypeLabel = (type: NodeType): string =>
  type === "start"
    ? "START"
    : NODE_TYPES.find((entry) => entry.value === type)?.label ?? type;

const isHandleEventTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && target.closest(".react-flow__handle") !== null;

const WorkflowCanvasNode = ({ data }: NodeProps) => {
  const nodeData = data as {
    nodeId: string;
    typeLabel: string;
    summary: string;
    isStart: boolean;
    isFocused: boolean;
    isDraggableFocus: boolean;
    onPointerDown: (nodeId: string) => void;
    onClick: (nodeId: string) => void;
    onContextMenu: (nodeId: string, x: number, y: number) => void;
  };

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

type WorkflowMiniMapNodeProps = {
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
};

const WorkflowMiniMapNode = ({
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

const flowNodeTypes = {
  workflowNode: WorkflowCanvasNode
};

const makeId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const defaultParamsForType = (type: NodeType): Record<string, unknown> => {
  switch (type) {
    case "delay":
      return { milliseconds: 1000 };
    case "open_app":
      return { appName: "", appPath: "" };
    case "open_browser":
      return {};
    case "open_url":
      return { urls: ["https://"] };
    case "open_terminal_at_path":
      return { path: "" };
    case "execute_command":
      return { command: "", workingDirectory: "" };
    case "open_folder_in_finder":
      return { path: "" };
    case "start":
      return {};
    default:
      return {};
  }
};

const createStartNode = (): WorkflowNode => ({
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

const normalizeWorkflow = (workflow: Workflow): Workflow => {
  let nodes: WorkflowNode[] = workflow.nodes.filter(
    (node) => node.id !== START_NODE_ID && node.type !== "start"
  );
  nodes.unshift(createStartNode());

  const validNodeIds = new Set(nodes.map((node) => node.id));

  let edges = dedupeEdges(
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

const createEmptyWorkflow = (index: number): Workflow =>
  normalizeWorkflow({
    id: makeId(),
    name: `Workflow ${index}`,
    nodes: [],
    edges: []
  });

const createNodeSummary = (node: WorkflowNode): string => {
  switch (node.type) {
    case "start":
      return "Workflow entry point";
    case "delay": {
      const raw = Number(node.params.milliseconds ?? 0);
      const milliseconds = Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 0;
      return `${milliseconds} ms`;
    }
    case "open_app": {
      const appName = String(node.params.appName ?? "").trim();
      const appPath = String(node.params.appPath ?? "").trim();
      const target = appName || appPath || "(select app)";
      return target;
    }
    case "open_browser":
      return "Launch default browser";
    case "open_url": {
      const urls = Array.isArray(node.params.urls)
        ? (node.params.urls as unknown[])
            .map((entry) => String(entry).trim())
            .filter(Boolean)
        : [];
      const first = urls[0] ?? "(add URL)";
      const suffix = urls.length > 1 ? ` +${urls.length - 1}` : "";
      return `${first}${suffix}`;
    }
    case "open_terminal_at_path":
      return `${String(node.params.path ?? "(add path)")}`;
    case "execute_command":
      return `${String(node.params.command ?? "(add command)")}`;
    case "open_folder_in_finder":
      return `${String(node.params.path ?? "(add path)")}`;
    default:
      return node.type;
  }
};

const edgeId = (source: string, target: string): string => `${source}->${target}`;
const edgeTouchesNode = (currentEdgeId: string, nodeId: string): boolean =>
  currentEdgeId.startsWith(`${nodeId}->`) || currentEdgeId.endsWith(`->${nodeId}`);
const normalizeHandleId = (handleId: string | null | undefined): string | undefined =>
  typeof handleId === "string" && handleId.length > 0 ? handleId : undefined;

const isEditableElement = (target: EventTarget | null): boolean => {
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

const toFlowNodes = (
  workflow?: Workflow,
  focusedNodeId?: string | null,
  onNodePointerDown?: (nodeId: string) => void,
  onNodeClick?: (nodeId: string) => void,
  onNodeContextMenu?: (nodeId: string, x: number, y: number) => void
): Node[] => {
  if (!workflow) {
    return [];
  }

  return workflow.nodes.map((node, index) => ({
    id: node.id,
    type: "workflowNode",
    className: "workflow-node-shell",
    initialWidth:
      node.id === START_NODE_ID ? START_NODE_MINIMAP_SIZE.width : ACTION_NODE_MINIMAP_SIZE.width,
    initialHeight:
      node.id === START_NODE_ID ? START_NODE_MINIMAP_SIZE.height : ACTION_NODE_MINIMAP_SIZE.height,
    position:
      node.id === START_NODE_ID
        ? { ...START_NODE_POSITION }
        : node.position ?? {
            x: 120 + (index % 4) * 260,
            y: 100 + Math.floor(index / 4) * 170
          },
    selected: node.id === focusedNodeId,
    draggable: node.id !== START_NODE_ID && node.id === focusedNodeId,
    data: {
      nodeId: node.id,
      typeLabel: nodeTypeLabel(node.type),
      summary: createNodeSummary(node),
      isStart: node.id === START_NODE_ID,
      isFocused: node.id === focusedNodeId,
      isDraggableFocus: node.id !== START_NODE_ID && node.id === focusedNodeId,
      onPointerDown: onNodePointerDown ?? (() => {}),
      onClick: onNodeClick ?? (() => {}),
      onContextMenu: onNodeContextMenu ?? (() => {})
    }
  }));
};

const toFlowEdges = (
  workflow?: Workflow,
  selectedEdgeId?: string | null,
  colors: { selected: string; default: string } = {
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

function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [canvasInteractive, setCanvasInteractive] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    getInitialSystemDarkPreference
  );
  const [status, setStatus] = useState<string>("Loading workflows...");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const spacePressed = useKeyPress("Space");

  const appliedTheme: AppliedTheme =
    themeMode === "system" ? (systemPrefersDark ? "dark" : "light") : themeMode;

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId),
    [workflows, selectedWorkflowId]
  );

  const selectedNode = useMemo(
    () => selectedWorkflow?.nodes.find((node) => node.id === focusedNodeId),
    [focusedNodeId, selectedWorkflow]
  );

  const handleNodePointerDown = useCallback(
    (nodeId: string) => {
      if (spacePressed || !canvasInteractive) {
        return;
      }

      setFocusedNodeId(nodeId);
      setSelectedEdgeId(null);
      setContextMenu(null);
    },
    [canvasInteractive, spacePressed]
  );

  const handleNodeContentClick = useCallback(
    (nodeId: string) => {
      if (spacePressed || !canvasInteractive) {
        return;
      }

      setFocusedNodeId(nodeId);
      setSelectedEdgeId(null);
      setContextMenu(null);
    },
    [canvasInteractive, spacePressed]
  );

  const handleNodeContextMenu = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (spacePressed || !canvasInteractive) {
        return;
      }

      setFocusedNodeId(nodeId);
      setSelectedEdgeId(null);
      setContextMenu({
        kind: "node",
        targetId: nodeId,
        x,
        y
      });
    },
    [canvasInteractive, spacePressed]
  );

  const edgeColors = useMemo(
    () =>
      appliedTheme === "dark"
        ? {
            selected: "#8fb1ff",
            default: "#6f8abf"
          }
        : {
            selected: "#2d5fe0",
            default: "#4f6aa5"
          },
    [appliedTheme]
  );

  const minimapPalette = useMemo(
    () =>
      appliedTheme === "dark"
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
          },
    [appliedTheme]
  );

  const minimapNodeColor = useCallback(
    (node: Node) => {
      const data = node.data as { isStart?: boolean } | undefined;
      if (data?.isStart) {
        return minimapPalette.start;
      }

      if (node.id === focusedNodeId) {
        return minimapPalette.focused;
      }

      return minimapPalette.default;
    },
    [focusedNodeId, minimapPalette]
  );

  const flowNodes = useMemo(
    () =>
      toFlowNodes(
        selectedWorkflow,
        focusedNodeId,
        handleNodePointerDown,
        handleNodeContentClick,
        handleNodeContextMenu
      ),
    [
      focusedNodeId,
      handleNodeContentClick,
      handleNodeContextMenu,
      handleNodePointerDown,
      selectedWorkflow
    ]
  );
  const flowEdges = useMemo(
    () => toFlowEdges(selectedWorkflow, selectedEdgeId, edgeColors),
    [edgeColors, selectedEdgeId, selectedWorkflow]
  );

  const mutateSelectedWorkflow = useCallback(
    (updater: (workflow: Workflow) => Workflow) => {
      if (!selectedWorkflowId) {
        return;
      }

      setWorkflows((current) =>
        current.map((workflow) =>
          workflow.id === selectedWorkflowId
            ? normalizeWorkflow(updater(workflow))
            : normalizeWorkflow(workflow)
        )
      );
    },
    [selectedWorkflowId]
  );

  const saveWorkflows = useCallback(
    async (nextWorkflows: Workflow[], announce = false) => {
      try {
        await invoke("save_workflows", { workflows: nextWorkflows });
        if (announce) {
          setStatus("Workflows saved.");
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown save error";
        setStatus(`Save failed: ${message}`);
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(SYSTEM_DARK_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);

    if (themeMode !== "system") {
      return;
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    } catch {
      // Ignore storage write failures and continue with in-memory theme mode.
    }
  }, [themeMode]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = appliedTheme;
    document.documentElement.style.colorScheme = appliedTheme;
  }, [appliedTheme]);

  useEffect(() => {
    const load = async () => {
      try {
        const savedWorkflows = await invoke<Workflow[]>("load_workflows");
        const normalizedWorkflows = savedWorkflows.map(normalizeWorkflow);
        setWorkflows(normalizedWorkflows);
        setSelectedWorkflowId(normalizedWorkflows[0]?.id ?? null);
        setFocusedNodeId(normalizedWorkflows[0] ? START_NODE_ID : null);
        setSelectedEdgeId(null);
        setContextMenu(null);
        setStatus("Ready");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown load error";
        setStatus(`Failed to load workflows: ${message}`);
      } finally {
        setHasLoaded(true);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      void saveWorkflows(workflows);
    }, 500);

    return () => clearTimeout(timer);
  }, [hasLoaded, saveWorkflows, workflows]);

  useEffect(() => {
    if (!selectedWorkflow) {
      setFocusedNodeId(null);
      setSelectedEdgeId(null);
      setContextMenu(null);
      return;
    }

    if (
      focusedNodeId &&
      !selectedWorkflow.nodes.some((node) => node.id === focusedNodeId)
    ) {
      setFocusedNodeId(null);
    }

    if (
      selectedEdgeId &&
      !selectedWorkflow.edges.some(
        (edge) => edgeId(edge.sourceNodeId, edge.targetNodeId) === selectedEdgeId
      )
    ) {
      setSelectedEdgeId(null);
    }

    if (contextMenu) {
      const stillExists =
        contextMenu.kind === "edge"
          ? selectedWorkflow.edges.some(
              (edge) => edgeId(edge.sourceNodeId, edge.targetNodeId) === contextMenu.targetId
            )
          : selectedWorkflow.nodes.some((node) => node.id === contextMenu.targetId);

      if (!stillExists) {
        setContextMenu(null);
      }
    }
  }, [contextMenu, focusedNodeId, selectedEdgeId, selectedWorkflow]);

  const addWorkflow = () => {
    const next = [...workflows, createEmptyWorkflow(workflows.length + 1)];
    setWorkflows(next);
    setSelectedWorkflowId(next[next.length - 1].id);
    setFocusedNodeId(START_NODE_ID);
    setSelectedEdgeId(null);
    setContextMenu(null);
    setStatus("Workflow created.");
  };

  const removeWorkflow = (workflowId: string) => {
    const next = workflows.filter((workflow) => workflow.id !== workflowId);
    setWorkflows(next);
    if (selectedWorkflowId === workflowId) {
      setSelectedWorkflowId(next[0]?.id ?? null);
      setFocusedNodeId(null);
      setSelectedEdgeId(null);
      setContextMenu(null);
    }
    setStatus("Workflow removed.");
  };

  const addNode = (type: ActionNodeType) => {
    const nodeId = makeId();
    mutateSelectedWorkflow((workflow) => {
      const existingNonStartCount = workflow.nodes.filter(
        (node) => node.id !== START_NODE_ID
      ).length;

      return {
        ...workflow,
        nodes: [
          ...workflow.nodes,
          {
            id: nodeId,
            type,
            params: defaultParamsForType(type),
            position: {
              x: START_NODE_POSITION.x,
              y:
                START_NODE_POSITION.y +
                NEW_NODE_Y_OFFSET_FROM_START +
                existingNonStartCount * NEW_NODE_STACK_STEP
            }
          }
        ]
      };
    });
    setFocusedNodeId(nodeId);
    setSelectedEdgeId(null);
    setContextMenu(null);
    setStatus(`Added node: ${NODE_TYPES.find((item) => item.value === type)?.label ?? type}`);
  };

  const updateSelectedNode = (updater: (node: WorkflowNode) => WorkflowNode) => {
    if (!focusedNodeId || focusedNodeId === START_NODE_ID) {
      return;
    }

    mutateSelectedWorkflow((workflow) => ({
      ...workflow,
      nodes: workflow.nodes.map((node) =>
        node.id === focusedNodeId ? updater(node) : node
      )
    }));
  };

  const removeNodeById = useCallback(
    (nodeId: string) => {
      if (nodeId === START_NODE_ID) {
        return;
      }

      mutateSelectedWorkflow((workflow) => ({
        ...workflow,
        nodes: workflow.nodes.filter((node) => node.id !== nodeId),
        edges: workflow.edges.filter(
          (edge) => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
        )
      }));

      setFocusedNodeId((current) => (current === nodeId ? START_NODE_ID : current));
      setSelectedEdgeId((current) =>
        current && edgeTouchesNode(current, nodeId) ? null : current
      );
      setContextMenu((current) => {
        if (!current) {
          return null;
        }

        if (current.kind === "node" && current.targetId === nodeId) {
          return null;
        }

        if (current.kind === "edge" && edgeTouchesNode(current.targetId, nodeId)) {
          return null;
        }

        return current;
      });
      setStatus("Node removed.");
    },
    [mutateSelectedWorkflow]
  );

  const removeSelectedNode = () => {
    if (!focusedNodeId || focusedNodeId === START_NODE_ID) {
      return;
    }

    removeNodeById(focusedNodeId);
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!canvasInteractive) {
        return;
      }

      const relevantChanges = changes.filter(
        (change) => change.type === "position" || change.type === "remove"
      );

      if (relevantChanges.length === 0) {
        return;
      }

      mutateSelectedWorkflow((workflow) => {
        const originalById = new Map(workflow.nodes.map((node) => [node.id, node]));
        const nextFlowNodes = applyNodeChanges(
          relevantChanges,
          toFlowNodes(workflow, focusedNodeId, handleNodePointerDown, handleNodeContentClick)
        );
        const nextNodes: WorkflowNode[] = [];
        for (const flowNode of nextFlowNodes) {
          const original = originalById.get(flowNode.id);
          if (!original) {
            continue;
          }

          if (original.id === START_NODE_ID) {
            nextNodes.push(createStartNode());
            continue;
          }

          nextNodes.push({
            ...original,
            position: {
              x: flowNode.position.x,
              y: flowNode.position.y
            }
          });
        }

        const validNodeIds = new Set(nextNodes.map((node) => node.id));

        return {
          ...workflow,
          nodes: nextNodes,
          edges: workflow.edges.filter(
            (edge) => validNodeIds.has(edge.sourceNodeId) && validNodeIds.has(edge.targetNodeId)
          )
        };
      });
    },
    [
      canvasInteractive,
      focusedNodeId,
      handleNodeContentClick,
      handleNodePointerDown,
      mutateSelectedWorkflow
    ]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!canvasInteractive) {
        return;
      }

      mutateSelectedWorkflow((workflow) => {
        const nextFlowEdges = applyEdgeChanges(
          changes,
          toFlowEdges(workflow, selectedEdgeId, edgeColors)
        );
        return {
          ...workflow,
          edges: nextFlowEdges.map((edge) => ({
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            sourceHandleId: normalizeHandleId(edge.sourceHandle),
            targetHandleId: normalizeHandleId(edge.targetHandle)
          }))
        };
      });
    },
    [canvasInteractive, edgeColors, mutateSelectedWorkflow, selectedEdgeId]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!canvasInteractive) {
        return;
      }

      if (!connection.source || !connection.target || connection.source === connection.target) {
        return;
      }

      if (connection.target === START_NODE_ID) {
        return;
      }

      mutateSelectedWorkflow((workflow) => {
        const dedup = new Map<string, WorkflowEdge>();
        for (const edge of workflow.edges) {
          dedup.set(edgeId(edge.sourceNodeId, edge.targetNodeId), edge);
        }

        const nextEdge: WorkflowEdge = {
          sourceNodeId: connection.source,
          targetNodeId: connection.target,
          sourceHandleId: normalizeHandleId(connection.sourceHandle),
          targetHandleId: normalizeHandleId(connection.targetHandle)
        };
        dedup.set(edgeId(nextEdge.sourceNodeId, nextEdge.targetNodeId), nextEdge);

        return {
          ...workflow,
          edges: Array.from(dedup.values())
        };
      });
      setSelectedEdgeId(null);
      setContextMenu(null);
    },
    [canvasInteractive, mutateSelectedWorkflow]
  );

  const onNodeDragStop = (_event: unknown, draggedNode: Node) => {
    if (!canvasInteractive) {
      return;
    }

    if (draggedNode.id === START_NODE_ID) {
      return;
    }

    mutateSelectedWorkflow((workflow) => ({
      ...workflow,
      nodes: workflow.nodes.map((node) =>
        node.id === draggedNode.id
          ? {
              ...node,
              position: {
                x: draggedNode.position.x,
                y: draggedNode.position.y
              }
            }
          : node
      )
    }));
  };

  const handleEdgeClick = useCallback(
    (event: unknown, edge: Edge) => {
      if (spacePressed || !canvasInteractive) {
        return;
      }

      if (event && typeof event === "object" && "stopPropagation" in event) {
        const withStop = event as { stopPropagation?: () => void };
        withStop.stopPropagation?.();
      }

      setSelectedEdgeId(edge.id);
      setFocusedNodeId(null);
      setContextMenu(null);
    },
    [canvasInteractive, spacePressed]
  );

  const handleEdgeContextMenu = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      if (spacePressed || !canvasInteractive) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setFocusedNodeId(null);
      setSelectedEdgeId(edge.id);
      setContextMenu({
        kind: "edge",
        targetId: edge.id,
        x: event.clientX,
        y: event.clientY
      });
    },
    [canvasInteractive, spacePressed]
  );

  const removeEdgeById = useCallback(
    (targetEdgeId: string) => {
      mutateSelectedWorkflow((workflow) => ({
        ...workflow,
        edges: workflow.edges.filter(
          (edge) => edgeId(edge.sourceNodeId, edge.targetNodeId) !== targetEdgeId
        )
      }));

      setSelectedEdgeId((current) => (current === targetEdgeId ? null : current));
      setContextMenu((current) =>
        current && current.kind === "edge" && current.targetId === targetEdgeId
          ? null
          : current
      );
      setStatus("Connection removed.");
    },
    [mutateSelectedWorkflow]
  );

  const removeSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) {
      return;
    }

    removeEdgeById(selectedEdgeId);
  }, [removeEdgeById, selectedEdgeId]);

  const handleEdgeContextDelete = useCallback(() => {
    if (!contextMenu || contextMenu.kind !== "edge") {
      return;
    }

    removeEdgeById(contextMenu.targetId);
    setContextMenu(null);
  }, [contextMenu, removeEdgeById]);

  const handleNodeContextDelete = useCallback(() => {
    if (!contextMenu || contextMenu.kind !== "node") {
      return;
    }

    if (contextMenu.targetId === START_NODE_ID) {
      return;
    }

    removeNodeById(contextMenu.targetId);
    setContextMenu(null);
  }, [contextMenu, removeNodeById]);

  const handlePaneClick = useCallback(() => {
    if (spacePressed) {
      return;
    }

    setFocusedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, [spacePressed]);

  const handleCanvasInteractiveChange = useCallback((interactive: boolean) => {
    setCanvasInteractive(interactive);
    setContextMenu(null);
    setSelectedEdgeId(null);
    setStatus(interactive ? "Canvas unlocked. Editing enabled." : "Canvas locked. Editing disabled.");
  }, []);

  const handleMiniMapNodeClick = useCallback((_event: ReactMouseEvent, node: Node) => {
    setFocusedNodeId(node.id);
    setSelectedEdgeId(null);
    setContextMenu(null);
    setStatus(`Focused node: ${node.id}`);
  }, []);

  const toggleMiniMap = useCallback(() => {
    setShowMiniMap((current) => {
      const next = !current;
      setStatus(next ? "Minimap shown." : "Minimap hidden.");
      return next;
    });
  }, []);

  const handleThemeModeChange = useCallback((nextMode: ThemeMode) => {
    setThemeMode(nextMode);
    setStatus(
      nextMode === "system"
        ? "Theme set to system."
        : `Theme set to ${nextMode}.`
    );
  }, []);

  const contextMenuActions = useMemo(() => {
    if (!contextMenu) {
      return [];
    }

    if (contextMenu.kind === "edge") {
      return [
        {
          id: "delete-connection",
          label: "Delete connection",
          tone: "danger" as const,
          onSelect: handleEdgeContextDelete
        }
      ];
    }

    return [
      {
        id: "delete-node",
        label: "Delete node",
        tone: "danger" as const,
        disabled: contextMenu.targetId === START_NODE_ID,
        onSelect: handleNodeContextDelete
      }
    ];
  }, [contextMenu, handleEdgeContextDelete, handleNodeContextDelete]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!canvasInteractive || !selectedEdgeId) {
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      if (isEditableElement(event.target)) {
        return;
      }

      event.preventDefault();
      removeSelectedEdge();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canvasInteractive, removeSelectedEdge, selectedEdgeId]);

  const runWorkflow = async () => {
    if (!selectedWorkflow || isRunning) {
      return;
    }

    setIsRunning(true);
    setStatus(`Running workflow: ${selectedWorkflow.name}`);

    try {
      const result = await invoke<RunWorkflowResult>("run_workflow", {
        workflow: selectedWorkflow
      });

      const failures = result.results.filter((entry) => !entry.success);
      if (failures.length > 0) {
        setStatus(
          `Run finished with ${failures.length} failure(s). First error: ${failures[0].message}`
        );
      } else {
        setStatus(`Run complete. ${result.completedNodes} node(s) executed.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown run error";
      setStatus(`Run failed: ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const renderNodeEditor = () => {
    if (!selectedNode) {
      return <p className="node-editor-empty">Select a node to edit parameters.</p>;
    }

    if (selectedNode.id === START_NODE_ID || selectedNode.type === "start") {
      return (
        <div className="node-editor-form">
          <h3>START</h3>
          <p className="node-editor-hint">
            This node is immutable and cannot be deleted. Connect first-tier actions from START.
          </p>
        </div>
      );
    }

    const selectedNodeTypeLabel = nodeTypeLabel(selectedNode.type);

    return (
      <div className="node-editor-form">
        <h3>{selectedNodeTypeLabel}</h3>
        <label>
          Node type
          <select
            value={selectedNode.type}
            onChange={(event) => {
              const nextType = event.target.value as NodeType;
              updateSelectedNode((node) => ({
                ...node,
                type: nextType,
                params: defaultParamsForType(nextType)
              }));
            }}
          >
            {NODE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        {selectedNode.type === "open_app" && (
          <>
            <label>
              App name
              <input
                type="text"
                placeholder="Visual Studio Code"
                value={String(selectedNode.params.appName ?? "")}
                onChange={(event) => {
                  const appName = event.target.value;
                  updateSelectedNode((node) => ({
                    ...node,
                    params: { ...node.params, appName }
                  }));
                }}
              />
            </label>
            <label>
              App path
              <input
                type="text"
                placeholder="/Applications/Visual Studio Code.app"
                value={String(selectedNode.params.appPath ?? "")}
                onChange={(event) => {
                  const appPath = event.target.value;
                  updateSelectedNode((node) => ({
                    ...node,
                    params: { ...node.params, appPath }
                  }));
                }}
              />
            </label>
          </>
        )}

        {selectedNode.type === "open_url" && (
          <label>
            URLs (one per line)
            <textarea
              rows={5}
              value={Array.isArray(selectedNode.params.urls) ? selectedNode.params.urls.join("\n") : ""}
              onChange={(event) => {
                const urls = event.target.value
                  .split(/\r?\n/)
                  .map((url) => url.trim())
                  .filter(Boolean);

                updateSelectedNode((node) => ({
                  ...node,
                  params: { ...node.params, urls }
                }));
              }}
            />
          </label>
        )}

        {selectedNode.type === "delay" && (
          <label>
            Delay (milliseconds)
            <input
              type="number"
              min={0}
              step={1}
              value={Number(selectedNode.params.milliseconds ?? 0)}
              onChange={(event) => {
                const nextValue = Number.parseInt(event.target.value, 10);
                const milliseconds = Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0;
                updateSelectedNode((node) => ({
                  ...node,
                  params: { ...node.params, milliseconds }
                }));
              }}
            />
          </label>
        )}

        {selectedNode.type === "open_terminal_at_path" && (
          <label>
            Directory path
            <input
              type="text"
              placeholder="~/projects/work"
              value={String(selectedNode.params.path ?? "")}
              onChange={(event) => {
                const path = event.target.value;
                updateSelectedNode((node) => ({
                  ...node,
                  params: { ...node.params, path }
                }));
              }}
            />
          </label>
        )}

        {selectedNode.type === "execute_command" && (
          <>
            <label>
              Command
              <textarea
                rows={4}
                placeholder="npm run dev"
                value={String(selectedNode.params.command ?? "")}
                onChange={(event) => {
                  const command = event.target.value;
                  updateSelectedNode((node) => ({
                    ...node,
                    params: { ...node.params, command }
                  }));
                }}
              />
            </label>
            <label>
              Working directory (optional)
              <input
                type="text"
                placeholder="~/projects/work"
                value={String(selectedNode.params.workingDirectory ?? "")}
                onChange={(event) => {
                  const workingDirectory = event.target.value;
                  updateSelectedNode((node) => ({
                    ...node,
                    params: { ...node.params, workingDirectory }
                  }));
                }}
              />
            </label>
          </>
        )}

        {selectedNode.type === "open_folder_in_finder" && (
          <label>
            Folder path
            <input
              type="text"
              placeholder="~/projects/work"
              value={String(selectedNode.params.path ?? "")}
              onChange={(event) => {
                const path = event.target.value;
                updateSelectedNode((node) => ({
                  ...node,
                  params: { ...node.params, path }
                }));
              }}
            />
          </label>
        )}

        {selectedNode.type === "open_browser" && (
          <p className="node-editor-hint">No parameters for this node type.</p>
        )}

        <button className="danger" onClick={removeSelectedNode}>
          Remove node
        </button>
      </div>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Workflows</h2>
          <button onClick={addWorkflow}>New</button>
        </div>
        <div className="workflow-list">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`workflow-item ${workflow.id === selectedWorkflowId ? "active" : ""}`}
            >
              <button
                className="workflow-select"
                onClick={() => {
                  setSelectedWorkflowId(workflow.id);
                  setFocusedNodeId(START_NODE_ID);
                  setSelectedEdgeId(null);
                  setContextMenu(null);
                }}
              >
                {workflow.name}
              </button>
              <button
                className="workflow-remove"
                onClick={() => removeWorkflow(workflow.id)}
                title="Delete workflow"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <div>
            <h1>QuickTools</h1>
            <p>{status}</p>
          </div>
          <div className="header-actions">
            <label className="theme-mode-control" htmlFor="theme-mode-select">
              Theme
              <select
                id="theme-mode-select"
                value={themeMode}
                onChange={(event) =>
                  handleThemeModeChange(event.target.value as ThemeMode)
                }
                aria-label="Theme mode"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            <button onClick={() => void saveWorkflows(workflows, true)}>Save now</button>
            <button onClick={() => void runWorkflow()} disabled={!selectedWorkflow || isRunning}>
              {isRunning ? "Running..." : "Run workflow"}
            </button>
          </div>
        </header>

        {selectedWorkflow ? (
          <>
            <section className="workflow-toolbar">
              <label>
                Workflow name
                <input
                  type="text"
                  value={selectedWorkflow.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    mutateSelectedWorkflow((workflow) => ({ ...workflow, name }));
                  }}
                />
              </label>
              <div className="toolbar-node-actions">
                {NODE_TYPES.map((type) => (
                  <button key={type.value} onClick={() => addNode(type.value)}>
                    + {type.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="editor-layout">
              <div className="canvas-wrap">
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  nodeTypes={flowNodeTypes}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onEdgeClick={handleEdgeClick}
                  onEdgeContextMenu={handleEdgeContextMenu}
                  onNodeDragStop={onNodeDragStop}
                  onPaneClick={handlePaneClick}
                  nodesDraggable={canvasInteractive}
                  nodesConnectable={canvasInteractive}
                  elementsSelectable={canvasInteractive}
                  nodesFocusable={canvasInteractive}
                  edgesFocusable={canvasInteractive}
                  selectionOnDrag={false}
                  panOnDrag={spacePressed ? [0] : false}
                  nodeDragThreshold={6}
                  nodeClickDistance={6}
                  paneClickDistance={6}
                  connectionRadius={42}
                  fitView
                  minZoom={0.2}
                  maxZoom={1.5}
                >
                  {showMiniMap && (
                    <MiniMap
                      ariaLabel="Workflow overview"
                      pannable
                      zoomable
                    nodeColor={minimapNodeColor}
                    nodeStrokeColor={(node) =>
                      node.id === focusedNodeId
                        ? minimapPalette.focusedStroke
                        : minimapPalette.defaultStroke
                    }
                    nodeStrokeWidth={2.4}
                    nodeBorderRadius={9}
                    nodeComponent={WorkflowMiniMapNode}
                    maskStrokeColor={minimapPalette.maskStroke}
                    maskStrokeWidth={1.2}
                    bgColor={minimapPalette.background}
                    maskColor={minimapPalette.maskColor}
                    offsetScale={30}
                    onNodeClick={handleMiniMapNodeClick}
                  />
                  )}
                  <Panel
                    position="bottom-right"
                    className={`minimap-toggle-panel ${showMiniMap ? "with-minimap" : ""}`}
                  >
                    <button type="button" className="minimap-toggle-button" onClick={toggleMiniMap}>
                      {showMiniMap ? "Hide minimap" : "Show minimap"}
                    </button>
                  </Panel>
                  <Controls onInteractiveChange={handleCanvasInteractiveChange} />
                  <Background
                    variant={BackgroundVariant.Lines}
                    gap={34}
                    size={1}
                    color={
                      appliedTheme === "dark"
                        ? "rgba(145, 164, 198, 0.25)"
                        : "rgba(126, 146, 183, 0.25)"
                    }
                  />
                </ReactFlow>
              </div>
              <aside className="node-editor">{renderNodeEditor()}</aside>
            </section>

            <ContextMenuModal
              open={Boolean(contextMenu)}
              x={contextMenu?.x ?? 0}
              y={contextMenu?.y ?? 0}
              ariaLabel={contextMenu?.kind === "node" ? "Node actions" : "Connection actions"}
              onClose={() => setContextMenu(null)}
              actions={contextMenuActions}
            />
          </>
        ) : (
          <section className="empty-state">
            <h2>No workflow selected</h2>
            <p>Create a workflow from the left panel to start.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

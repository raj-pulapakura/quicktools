import { MouseEvent as ReactMouseEvent, useCallback, useMemo, useState } from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  Node,
  NodeChange,
  Panel,
  ReactFlow,
  useKeyPress
} from "@xyflow/react";
import { invoke } from "@tauri-apps/api/core";
import { ContextMenuModal } from "./components/ContextMenuModal";
import {
  NEW_NODE_STACK_STEP,
  NEW_NODE_Y_OFFSET_FROM_START,
  START_NODE_ID,
  START_NODE_POSITION
} from "./features/workflow/constants";
import { NodeEditorPanel } from "./features/workflow/components/NodeEditorPanel";
import {
  flowNodeTypes,
  WorkflowMiniMapNode
} from "./features/workflow/flowNodeComponents";
import {
  getEdgeColorsForTheme,
  getMinimapNodeColor,
  getMinimapPaletteForTheme,
  toFlowEdges,
  toFlowNodes
} from "./features/workflow/flowAdapters";
import {
  createEmptyWorkflow,
  createStartNode,
  edgeId,
  edgeTouchesNode,
  makeId,
  normalizeHandleId,
  normalizeWorkflow
} from "./features/workflow/model";
import {
  createDefaultParamsForType,
  getNodeTypeLabel,
  listActionNodeDefinitions
} from "./features/workflow/nodes/registry";
import { useDeleteEdgeShortcut } from "./hooks/useDeleteEdgeShortcut";
import { type ThemeMode, useThemeMode } from "./hooks/useThemeMode";
import { useWorkflowPersistence } from "./hooks/useWorkflowPersistence";
import type { ActionNodeType, RunWorkflowResult, Workflow, WorkflowEdge, WorkflowNode } from "./types/workflow";

interface ContextMenuState {
  kind: "edge" | "node";
  targetId: string;
  x: number;
  y: number;
}

function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [canvasInteractive, setCanvasInteractive] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [status, setStatus] = useState<string>("Loading workflows...");
  const [isRunning, setIsRunning] = useState(false);

  const { themeMode, appliedTheme, setThemeMode } = useThemeMode();

  const spacePressed = useKeyPress("Space");

  const actionNodeDefinitions = useMemo(() => listActionNodeDefinitions(), []);

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId),
    [workflows, selectedWorkflowId]
  );

  const selectedNode = useMemo(
    () => selectedWorkflow?.nodes.find((node) => node.id === focusedNodeId),
    [focusedNodeId, selectedWorkflow]
  );

  const handleWorkflowsLoaded = useCallback((normalizedWorkflows: Workflow[]) => {
    setWorkflows(normalizedWorkflows);
    setSelectedWorkflowId(normalizedWorkflows[0]?.id ?? null);
    setFocusedNodeId(normalizedWorkflows[0] ? START_NODE_ID : null);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, []);

  const { saveWorkflows } = useWorkflowPersistence({
    workflows,
    normalizeWorkflow,
    onWorkflowsLoaded: handleWorkflowsLoaded,
    onStatus: setStatus
  });

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

  const edgeColors = useMemo(() => getEdgeColorsForTheme(appliedTheme), [appliedTheme]);
  const minimapPalette = useMemo(() => getMinimapPaletteForTheme(appliedTheme), [appliedTheme]);

  const minimapNodeColor = useCallback(
    (node: Node) => getMinimapNodeColor(node, focusedNodeId, minimapPalette),
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

  const addWorkflow = useCallback(() => {
    const next = [...workflows, createEmptyWorkflow(workflows.length + 1)];
    setWorkflows(next);
    setSelectedWorkflowId(next[next.length - 1].id);
    setFocusedNodeId(START_NODE_ID);
    setSelectedEdgeId(null);
    setContextMenu(null);
    setStatus("Workflow created.");
  }, [workflows]);

  const removeWorkflow = useCallback(
    (workflowId: string) => {
      const next = workflows.filter((workflow) => workflow.id !== workflowId);
      setWorkflows(next);

      if (selectedWorkflowId === workflowId) {
        setSelectedWorkflowId(next[0]?.id ?? null);
        setFocusedNodeId(null);
        setSelectedEdgeId(null);
        setContextMenu(null);
      }

      setStatus("Workflow removed.");
    },
    [selectedWorkflowId, workflows]
  );

  const addNode = useCallback(
    (type: ActionNodeType) => {
      const nodeId = makeId();

      mutateSelectedWorkflow((workflow) => {
        const existingNonStartCount = workflow.nodes.filter((node) => node.id !== START_NODE_ID).length;

        return {
          ...workflow,
          nodes: [
            ...workflow.nodes,
            {
              id: nodeId,
              type,
              params: createDefaultParamsForType(type),
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
      setStatus(`Added node: ${getNodeTypeLabel(type)}`);
    },
    [mutateSelectedWorkflow]
  );

  const updateSelectedNode = useCallback(
    (updater: (node: WorkflowNode) => WorkflowNode) => {
      if (!focusedNodeId || focusedNodeId === START_NODE_ID) {
        return;
      }

      mutateSelectedWorkflow((workflow) => ({
        ...workflow,
        nodes: workflow.nodes.map((node) => (node.id === focusedNodeId ? updater(node) : node))
      }));
    },
    [focusedNodeId, mutateSelectedWorkflow]
  );

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

  const removeSelectedNode = useCallback(() => {
    if (!focusedNodeId || focusedNodeId === START_NODE_ID) {
      return;
    }

    removeNodeById(focusedNodeId);
  }, [focusedNodeId, removeNodeById]);

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
        const nextFlowEdges = applyEdgeChanges(changes, toFlowEdges(workflow, selectedEdgeId, edgeColors));

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

  const onNodeDragStop = useCallback(
    (_event: unknown, draggedNode: Node) => {
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
    },
    [canvasInteractive, mutateSelectedWorkflow]
  );

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
        current && current.kind === "edge" && current.targetId === targetEdgeId ? null : current
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

  useDeleteEdgeShortcut({
    canvasInteractive,
    selectedEdgeId,
    onDeleteSelectedEdge: removeSelectedEdge
  });

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

  const handleThemeModeChange = useCallback(
    (nextMode: ThemeMode) => {
      setThemeMode(nextMode);
      setStatus(nextMode === "system" ? "Theme set to system." : `Theme set to ${nextMode}.`);
    },
    [setThemeMode]
  );

  const runWorkflow = useCallback(async () => {
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
        setStatus(`Run finished with ${failures.length} failure(s). First error: ${failures[0].message}`);
      } else {
        setStatus(`Run complete. ${result.completedNodes} node(s) executed.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown run error";
      setStatus(`Run failed: ${message}`);
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, selectedWorkflow]);

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

  if (!selectedWorkflow) {
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
                  onChange={(event) => handleThemeModeChange(event.target.value as ThemeMode)}
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

          <section className="empty-state">
            <h2>No workflow selected</h2>
            <p>Create a workflow from the left panel to start.</p>
          </section>
        </main>
      </div>
    );
  }

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
                onChange={(event) => handleThemeModeChange(event.target.value as ThemeMode)}
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
            {actionNodeDefinitions.map((definition) => (
              <button key={definition.type} onClick={() => addNode(definition.type)}>
                + {definition.label}
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

          <aside className="node-editor">
            <NodeEditorPanel
              selectedNode={selectedNode}
              updateSelectedNode={updateSelectedNode}
              onRemoveSelectedNode={removeSelectedNode}
            />
          </aside>
        </section>

        <ContextMenuModal
          open={Boolean(contextMenu)}
          x={contextMenu?.x ?? 0}
          y={contextMenu?.y ?? 0}
          ariaLabel={contextMenu?.kind === "node" ? "Node actions" : "Connection actions"}
          onClose={() => setContextMenu(null)}
          actions={contextMenuActions}
        />
      </main>
    </div>
  );
}

export default App;

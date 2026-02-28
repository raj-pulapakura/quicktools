import assert from "node:assert/strict";

const START_NODE_ID = "__start__";
const EDGE_ID = "start->node-a";
const NODE_ID = "node-a";

const createState = () => ({
  canvasInteractive: true,
  focusedNodeId: START_NODE_ID,
  selectedEdgeId: null,
  contextMenu: null
});

const handleNodePointerDown = (state, nodeId, spacePressed = false, fromHandle = false) => {
  if (!state.canvasInteractive || spacePressed || fromHandle) {
    return state;
  }

  return {
    ...state,
    focusedNodeId: nodeId,
    selectedEdgeId: null,
    contextMenu: null
  };
};

const handleNodeContextMenu = (state, nodeId, x, y, spacePressed = false) => {
  if (!state.canvasInteractive || spacePressed) {
    return state;
  }

  return {
    ...state,
    focusedNodeId: nodeId,
    selectedEdgeId: null,
    contextMenu: {
      kind: "node",
      targetId: nodeId,
      x,
      y
    }
  };
};

const handleEdgeClick = (state, edgeId, spacePressed = false) => {
  if (!state.canvasInteractive || spacePressed) {
    return state;
  }

  return {
    ...state,
    focusedNodeId: null,
    selectedEdgeId: edgeId,
    contextMenu: null
  };
};

const handleEdgeContextMenu = (state, edgeId, x, y, spacePressed = false) => {
  if (!state.canvasInteractive || spacePressed) {
    return state;
  }

  return {
    ...state,
    focusedNodeId: null,
    selectedEdgeId: edgeId,
    contextMenu: {
      kind: "edge",
      targetId: edgeId,
      x,
      y
    }
  };
};

const handlePaneClick = (state, spacePressed = false) => {
  if (spacePressed) {
    return state;
  }

  return {
    ...state,
    focusedNodeId: null,
    selectedEdgeId: null,
    contextMenu: null
  };
};

const dismissContextMenu = (state) => ({
  ...state,
  contextMenu: null
});

const setCanvasInteractive = (state, canvasInteractive) => ({
  ...state,
  canvasInteractive,
  selectedEdgeId: null,
  contextMenu: null
});

const edgeTouchesNode = (edgeId, nodeId) =>
  edgeId.startsWith(`${nodeId}->`) || edgeId.endsWith(`->${nodeId}`);

const removeEdgeById = (state, edges, targetEdgeId) => ({
  state: {
    ...state,
    selectedEdgeId: state.selectedEdgeId === targetEdgeId ? null : state.selectedEdgeId,
    contextMenu:
      state.contextMenu?.kind === "edge" && state.contextMenu.targetId === targetEdgeId
        ? null
        : state.contextMenu
  },
  edges: edges.filter((edgeId) => edgeId !== targetEdgeId)
});

const removeNodeById = (state, nodes, edges, targetNodeId) => {
  if (targetNodeId === START_NODE_ID) {
    return { state, nodes, edges };
  }

  return {
    state: {
      ...state,
      focusedNodeId: state.focusedNodeId === targetNodeId ? START_NODE_ID : state.focusedNodeId,
      selectedEdgeId:
        state.selectedEdgeId && edgeTouchesNode(state.selectedEdgeId, targetNodeId)
          ? null
          : state.selectedEdgeId,
      contextMenu:
        state.contextMenu &&
        ((state.contextMenu.kind === "node" && state.contextMenu.targetId === targetNodeId) ||
          (state.contextMenu.kind === "edge" &&
            edgeTouchesNode(state.contextMenu.targetId, targetNodeId)))
          ? null
          : state.contextMenu
    },
    nodes: nodes.filter((nodeId) => nodeId !== targetNodeId),
    edges: edges.filter((edgeId) => !edgeTouchesNode(edgeId, targetNodeId))
  };
};

const removeSelectedEdge = (state, edges) => {
  if (!state.selectedEdgeId) {
    return { state, edges };
  }

  return removeEdgeById(state, edges, state.selectedEdgeId);
};

const run = () => {
  {
    const initial = createState();
    const next = handleEdgeContextMenu(initial, EDGE_ID, 320, 180);
    assert.equal(next.selectedEdgeId, EDGE_ID);
    assert.equal(next.focusedNodeId, null);
    assert.deepEqual(next.contextMenu, {
      kind: "edge",
      targetId: EDGE_ID,
      x: 320,
      y: 180
    });
  }

  {
    const initial = handleEdgeContextMenu(createState(), EDGE_ID, 250, 140);
    const dismissed = dismissContextMenu(initial);
    assert.equal(dismissed.selectedEdgeId, EDGE_ID);
    assert.equal(dismissed.contextMenu, null);
  }

  {
    const initial = handleEdgeContextMenu(createState(), EDGE_ID, 250, 140);
    const afterPaneClick = handlePaneClick(initial);
    assert.equal(afterPaneClick.selectedEdgeId, null);
    assert.equal(afterPaneClick.contextMenu, null);
  }

  {
    const initial = handleEdgeContextMenu(createState(), EDGE_ID, 250, 140);
    const { state: afterDelete, edges } = removeEdgeById(initial, [EDGE_ID], EDGE_ID);
    assert.deepEqual(edges, []);
    assert.equal(afterDelete.selectedEdgeId, null);
    assert.equal(afterDelete.contextMenu, null);
  }

  {
    const selected = handleEdgeClick(createState(), EDGE_ID);
    const { state: afterKeyboardDelete, edges } = removeSelectedEdge(selected, [EDGE_ID]);
    assert.deepEqual(edges, []);
    assert.equal(afterKeyboardDelete.selectedEdgeId, null);
  }

  {
    const withOpenMenu = handleEdgeContextMenu(createState(), EDGE_ID, 100, 100);
    const afterNodeFocus = handleNodePointerDown(withOpenMenu, "node-a");
    assert.equal(afterNodeFocus.focusedNodeId, "node-a");
    assert.equal(afterNodeFocus.selectedEdgeId, null);
    assert.equal(afterNodeFocus.contextMenu, null);
  }

  {
    const initial = createState();
    const afterHandlePress = handleNodePointerDown(initial, NODE_ID, false, true);
    assert.deepEqual(afterHandlePress, initial);
  }

  {
    const locked = setCanvasInteractive(createState(), false);
    const afterNodePress = handleNodePointerDown(locked, NODE_ID);
    const afterEdgeMenu = handleEdgeContextMenu(locked, EDGE_ID, 140, 95);
    assert.deepEqual(afterNodePress, locked);
    assert.deepEqual(afterEdgeMenu, locked);
  }

  {
    const withNodeMenu = handleNodeContextMenu(createState(), NODE_ID, 220, 160);
    assert.equal(withNodeMenu.focusedNodeId, NODE_ID);
    assert.equal(withNodeMenu.selectedEdgeId, null);
    assert.deepEqual(withNodeMenu.contextMenu, {
      kind: "node",
      targetId: NODE_ID,
      x: 220,
      y: 160
    });
  }

  {
    const initial = handleNodeContextMenu(createState(), NODE_ID, 180, 120);
    const { state, nodes, edges } = removeNodeById(
      initial,
      [START_NODE_ID, NODE_ID],
      [EDGE_ID],
      NODE_ID
    );
    assert.deepEqual(nodes, [START_NODE_ID]);
    assert.deepEqual(edges, []);
    assert.equal(state.focusedNodeId, START_NODE_ID);
    assert.equal(state.selectedEdgeId, null);
    assert.equal(state.contextMenu, null);
  }

  {
    const initial = handleNodeContextMenu(createState(), START_NODE_ID, 90, 90);
    const { state, nodes, edges } = removeNodeById(
      initial,
      [START_NODE_ID, NODE_ID],
      [EDGE_ID],
      START_NODE_ID
    );
    assert.deepEqual(nodes, [START_NODE_ID, NODE_ID]);
    assert.deepEqual(edges, [EDGE_ID]);
    assert.deepEqual(state, initial);
  }
};

run();
console.log("Canvas interaction checks passed.");

## Context

The workflow canvas currently tracks node selection for editor rendering and drag eligibility through closely related but independently updated state. In practice, node click, pane click, and drag events can fire in rapid sequence, causing focus to be cleared or not committed reliably. This creates intermittent behavior where parameter panels fail to open even though users clicked a node.

The fix must preserve two established interaction rules:
- Only the focused non-START node is draggable.
- Canvas panning is enabled only while Space is held.

## Goals / Non-Goals

**Goals:**
- Ensure node click always results in focused-node state and parameter-panel opening.
- Enforce focus-driven drag gating without accidental drags on unfocused nodes.
- Prevent pane-blur handlers from canceling legitimate node focus events.
- Keep Space+drag pan behavior unchanged.

**Non-Goals:**
- Redesigning node visuals or editor layout.
- Adding keyboard navigation or multi-select behavior changes.
- Changing workflow data persistence format.

## Decisions

1. Use one canonical `focusedNodeId` interaction state.
`focusedNodeId` becomes the source of truth for both parameter panel rendering and drag enablement. This removes divergence between selection and draggability states.

Alternative considered:
- Keep separate states (`selectedNodeId`, `dragEnabledNodeId`) and patch event ordering.
Rejected because the split state is the root source of drift and race-prone transitions.

2. Replace heuristic pane-blur logic with explicit interaction intent.
Pane blur should happen only for confirmed empty-canvas clicks, not any event whose DOM target fails a `closest()` lookup. Node interactions must not be invalidated by subsequent pane events in the same pointer sequence.

Alternative considered:
- Keep current `onPaneClick` target inspection and add more CSS/class checks.
Rejected because it remains brittle against React Flow internal structure and handle overlays.

3. Make drag gating derive from focus at render time.
A non-START node is draggable only when `node.id === focusedNodeId`. Attempts to drag an unfocused node should first focus that node and require a deliberate follow-up drag gesture to move it.

Alternative considered:
- Enable drag on `onNodeMouseDown` immediately.
Rejected because it reintroduces accidental movement during selection.

4. Preserve pan controls as an invariant.
Continue using Space-modified `panOnDrag` behavior and ensure node focus does not change during active pan gestures.

Alternative considered:
- Introduce custom pan gesture logic outside React Flow.
Rejected as unnecessary complexity and regression risk.

## Risks / Trade-offs

- [Risk] Users need a clear focus click before dragging a different node.
  Mitigation: This is intentional per interaction rules; preserve visible selected styling to communicate state.
- [Risk] React Flow event sequencing may differ across versions.
  Mitigation: Keep focus transitions centralized and covered by interaction regression tests/manual checklist.
- [Risk] START node focus behavior could unintentionally enable drag.
  Mitigation: Hard guard START node from drag eligibility regardless of focus.

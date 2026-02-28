## Context

The canvas now supports selecting and deleting connections, but deletion is exposed via a toolbar button that is not spatially tied to the edge being edited. The requested behavior is a contextual right-click menu on edges, implemented with a reusable custom modal component, while removing the toolbar delete action.

The implementation must coexist with current edge selection, pane click clearing, and keyboard delete behavior without reintroducing focus/selection race conditions.

## Goals / Non-Goals

**Goals:**
- Open a custom context menu modal when users right-click a connection.
- Scope menu actions to the specific edge that was right-clicked.
- Provide `Delete connection` in the menu and remove the toolbar delete button.
- Ensure menu dismissal is deterministic (outside click, Escape, action complete).
- Keep component reusable for future context actions.

**Non-Goals:**
- Building a full multi-level menu framework.
- Adding node context menus in this change.
- Changing backend workflow execution semantics.

## Decisions

1. Introduce a reusable menu modal component with explicit positioning props.
The component receives `open`, screen coordinates, actions, and dismissal callbacks. This keeps menu rendering logic separate from canvas orchestration and makes it reusable for future context menus.

Alternative considered:
- Inline JSX inside `App.tsx` for faster one-off delivery.
Rejected because it couples overlay mechanics to canvas logic and is harder to reuse.

2. Use edge right-click as the source-of-truth target event.
Handle right-click through React Flow edge context-menu callback, call `preventDefault` to suppress native browser context menu, and set both selected-edge state and menu target state from that event.

Alternative considered:
- Trigger menu from normal left-click.
Rejected because this conflicts with selection behavior and does not match the requested interaction.

3. Remove toolbar delete button and keep contextual delete path.
Connection deletion should live in edge context actions. Keyboard delete remains compatible as a secondary path where edge selection already exists.

Alternative considered:
- Keep both toolbar and context menu delete.
Rejected to avoid redundant UI and because requirement explicitly removes toolbar button.

4. Centralize dismissal and lifecycle guards.
Close menu on outside click, Escape, pane click, and after action execution. Clear stale target edge if edge list changes.

Alternative considered:
- Close only on action click.
Rejected because this leaves sticky overlays and poor UX.

## Risks / Trade-offs

- [Risk] Menu position may clip near viewport edges.
  Mitigation: Clamp modal position within viewport bounds before rendering.
- [Risk] Right-click event ordering might conflict with pane-click handlers.
  Mitigation: Stop propagation and explicitly coordinate edge-selection/menu state transitions.
- [Risk] Future context actions may need richer menu state.
  Mitigation: Use action-driven component API now so action list can expand without structural rewrite.

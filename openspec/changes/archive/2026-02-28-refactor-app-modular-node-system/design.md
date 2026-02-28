## Context

`src/App.tsx` currently mixes five concerns in one file: workflow domain normalization, React Flow adapters/interaction handlers, node-type metadata/defaults/summaries, parameter editor rendering, and page-level layout/state wiring. This coupling has already grown to >1,600 lines and makes low-risk iteration difficult, especially when adding new node types (which currently requires touching multiple switch/case branches and UI locations).

The refactor must preserve current user behavior (focus/edit/drag/connect/context menu/minimap/theme/run/save flows) while changing architecture so future node additions are isolated and predictable.

## Goals / Non-Goals

**Goals:**
- Reduce `App.tsx` to composition-level responsibilities only.
- Introduce a typed node-definition registry as the single source of truth for node label/default params/summary/editor UI.
- Make adding a node type a localized change (definition module + registry registration).
- Preserve existing canvas/editor behavior and workflow runtime semantics.
- Add focused tests for registry-driven behavior and node parameter transformations.

**Non-Goals:**
- No backend executor redesign in this change.
- No visual redesign of workflow UI.
- No behavioral changes to node focus and connection semantics beyond parity-preserving refactor.

## Decisions

1. **Adopt a registry-driven node architecture (Strategy objects over scattered switches).**
   - Create a `NodeDefinition` contract that includes: `type`, `label`, `createDefaultParams`, `summarize`, and `renderEditor`.
   - Build a typed registry map (`Record<ActionNodeType, NodeDefinition>`) and helpers (`getNodeDefinition`, `listActionNodeDefinitions`).
   - Rationale: consolidates node-specific logic and removes duplicated switch statements in add-node/editor/summary code paths.
   - Alternative considered: class inheritance hierarchy (`BaseNodeDefinition` subclasses). Rejected as default because object literals + typed interfaces are simpler in React/TS and easier to tree-shake while still supporting OOP-like strategy polymorphism.

2. **Split editor concerns into feature modules and hooks.**
   - Move domain utilities (`normalizeWorkflow`, `edgeId`, handle normalization) into `workflowModel` utilities.
   - Move React Flow adapter functions (`toFlowNodes`, `toFlowEdges`) into flow adapter modules.
   - Move side-effectful concerns into hooks (`useThemeMode`, `useWorkflowPersistence`, `useWorkflowKeyboardShortcuts`).
   - Keep `App.tsx` as top-level composition and orchestration.
   - Rationale: clearer responsibilities, smaller test surfaces, easier regression isolation.

3. **Use registry-driven UI rendering in toolbar and node editor.**
   - Add-node toolbar options come from registry order/labels.
   - Parameter editor rendering delegates to node definition for focused node type.
   - Node summaries and default params also come from the same definition.
   - Rationale: guarantees consistency and avoids one node type drifting across multiple hand-maintained UI branches.

4. **Preserve behavior through parity checks and targeted tests.**
   - Keep current interaction checks (`npm run check:canvas-interaction`) as acceptance gate.
   - Add unit tests for registry completeness, default-param generation, summary rendering, and type-switch param reset behavior.
   - Rationale: refactors fail silently without parity assertions; this adds guardrails for future modularization.

## Risks / Trade-offs

- **[Risk] Over-modularization can increase indirection for small changes.**
  → Mitigation: keep module boundaries pragmatic (feature-oriented folders) and avoid deeply nested abstraction layers.

- **[Risk] Type safety gaps between node params and dynamic editor rendering.**
  → Mitigation: define per-node param types and shared editor prop contracts; centralize casts inside node-definition modules only.

- **[Risk] Behavioral regressions during extraction from `App.tsx`.**
  → Mitigation: preserve public handlers and sequence of state transitions; run existing interaction checks plus new targeted tests.

- **[Trade-off] Initial refactor cost before new feature velocity improves.**
  → Mitigation: stage migration incrementally (extract utilities/hook first, then registry, then editor delegation) to keep each step reviewable.

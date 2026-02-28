## 1. Node Definition Registry Foundation

- [x] 1.1 Define typed node-definition contracts and registry helpers (type, label, defaults, summary, editor renderer).
- [x] 1.2 Extract existing action node metadata/default params/summary logic from `App.tsx` into per-node definition modules.
- [x] 1.3 Add a registry completeness guard so every supported `ActionNodeType` resolves to a definition.

## 2. Extract Workflow Editor Domain/Flow Modules

- [x] 2.1 Move workflow domain helpers (`createStartNode`, `normalizeWorkflow`, edge utilities, handle normalization) into dedicated model utilities.
- [x] 2.2 Move React Flow adapter logic (`toFlowNodes`, `toFlowEdges`, minimap metadata helpers) into flow adapter modules.
- [x] 2.3 Extract side-effect hooks for theme mode, workflow persistence/autosave, and keyboard shortcut handling.

## 3. Wire Registry-Driven UI and Node Operations

- [x] 3.1 Replace hard-coded add-node button list with registry-derived node options.
- [x] 3.2 Replace inline node parameter editor conditional branches with registry-provided editor renderers.
- [x] 3.3 Update add-node creation and node summary rendering to use registry definitions instead of switch/case logic.
- [x] 3.4 Preserve START-node immutability and existing focused-node/edge/context-menu behavior during refactor wiring.

## 4. App Composition Cleanup and Parity Validation

- [x] 4.1 Reduce `App.tsx` to composition/orchestration by delegating extracted concerns to modules and hooks.
- [x] 4.2 Add targeted tests for registry behavior (definition lookup, defaults, summary output, type-switch param reset).
- [x] 4.3 Re-run interaction parity checks for node focus, edge selection, pane blur, and canvas interactions.
- [x] 4.4 Run `npm run build` and `npm run check:canvas-interaction`, then resolve any regressions.

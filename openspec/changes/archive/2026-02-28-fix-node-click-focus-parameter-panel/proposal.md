## Why

Node selection and parameter-panel opening are currently intermittent, which blocks the core workflow-editing path. The issue stems from inconsistent focus state transitions during canvas interactions, especially when node click and pane blur handling overlap.

## What Changes

- Define deterministic node-focus behavior so clicking a node always focuses it and opens its parameter editor.
- Make node draggability derive from focus state so only the focused non-START node can be dragged.
- Standardize blur behavior so focus is cleared only when the user intentionally clicks empty canvas space.
- Preserve existing Space+drag canvas panning behavior while preventing focus regressions during pan interactions.

## Capabilities

### New Capabilities
- `node-focus-and-editor-interaction`: Guarantees reliable node focus, editor opening, and focus-driven drag behavior in the workflow canvas.

### Modified Capabilities
- None.

## Impact

- Frontend canvas interaction logic in `src/App.tsx` (node click, pane click, drag gating, and React Flow event wiring).
- Potential minor updates to canvas styling/class usage in `src/styles.css` if interaction classes are adjusted.
- Manual QA coverage for node focus/edit and drag/pan interaction paths.

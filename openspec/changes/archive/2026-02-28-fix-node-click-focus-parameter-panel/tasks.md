## 1. Normalize focus interaction state

- [x] 1.1 Replace split selection/drag state with a canonical `focusedNodeId` state in `src/App.tsx`.
- [x] 1.2 Update selected-node derivation and parameter-editor rendering to use `focusedNodeId` only.
- [x] 1.3 Keep START-node guardrails so START can be focused but never draggable.

## 2. Refactor canvas event handling for deterministic focus

- [x] 2.1 Rework `onNodeClick` and pane-blur handling so node clicks cannot be overridden by same-sequence pane events.
- [x] 2.2 Remove brittle DOM-target heuristics for blur detection and replace with explicit empty-pane intent handling.
- [x] 2.3 Make node draggability derive from focus and enforce "first gesture focuses, follow-up gesture drags" for unfocused nodes.
- [x] 2.4 Preserve Space+drag pan behavior and prevent pan gestures from clearing node focus.

## 3. Validate behavior and prevent regressions

- [x] 3.1 Add or update interaction-level tests/checks for: click-to-open editor, focused-only drag, empty-pane blur, and node click vs pane event ordering.
- [x] 3.2 Run manual QA on the canvas to verify reliable parameter opening and unchanged Space+drag pan behavior.
- [x] 3.3 Document acceptance criteria evidence in the change notes before apply.

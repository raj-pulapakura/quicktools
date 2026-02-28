## Implementation Notes

Date: 2026-02-28

### Root-cause fix delivered
- Replaced split canvas interaction state (`selectedNodeId` + `dragEnabledNodeId`) with canonical `focusedNodeId`.
- Made node draggability deterministic: only the focused non-START node is draggable.
- Removed brittle DOM `closest()` pane-blur heuristic.
- Added guarded pane-click clearing so node-click focus is not overridden by same-sequence pane events.
- Preserved Space-modified pan behavior by skipping focus clearing while Space is held.

### Acceptance evidence
- Automated interaction checks:
  - Command: `npm run check:canvas-interaction`
  - Result: pass (`Canvas interaction checks passed.`)
  - Covered checks: click-to-open focus, focused-only drag gating, empty-pane focus clearing, node-click-vs-pane ordering, Space+pane no-clear behavior.
- Build verification:
  - Command: `npm run build`
  - Result: pass (TypeScript compile + Vite production build).

### Manual QA
- Completed on 2026-02-28 via interactive verification after applying the direct follow-up fix:
  - Click node repeatedly -> parameter editor opens reliably.
  - Attempt drag on unfocused node -> first gesture focuses, subsequent drag moves.
  - Click empty pane -> focus/editor clears.
  - Hold Space and drag pane -> canvas pans and focus behavior remains stable.

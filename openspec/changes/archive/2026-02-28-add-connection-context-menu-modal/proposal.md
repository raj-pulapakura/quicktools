## Why

Connection deletion is currently exposed through a toolbar button, which is global and disconnected from the edge interaction itself. A right-click context menu on a connection is more direct, predictable, and aligns better with graph-editor interaction patterns.

## What Changes

- Add a reusable custom menu modal component for contextual actions.
- Show the custom modal when a user right-clicks a connection (edge) on the workflow canvas.
- Include a `Delete connection` action in that modal that removes the targeted edge.
- Remove the `Delete connection` button from the workflow toolbar.
- Preserve deterministic selection behavior so edge actions apply to the correct connection.

## Capabilities

### New Capabilities
- `connection-context-menu`: Provides contextual right-click actions for connections, including delete, via a custom modal component.

### Modified Capabilities
- None.

## Impact

- Frontend interaction flow in `src/App.tsx` (edge right-click handling, selection coordination, deletion path, toolbar cleanup).
- New reusable UI component for menu modal rendering and dismissal behavior.
- Frontend styles updates for menu modal visual treatment and layering.

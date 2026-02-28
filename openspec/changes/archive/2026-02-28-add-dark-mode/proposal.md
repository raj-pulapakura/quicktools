## Why

The app currently has only a light visual theme, which causes readability and comfort issues for users working in low-light environments. Adding dark mode now improves daily usability and aligns the editor with common desktop productivity app expectations.

## What Changes

- Add a user-facing theme control to switch between Light, Dark, and System themes.
- Introduce a complete dark theme token set and apply it across the app shell, sidebars, toolbars, node editor, canvas, controls, minimap, and context menus.
- Apply theme changes at runtime without requiring a reload.
- Persist the user theme preference so the app restores the selected theme on next launch.

## Capabilities

### New Capabilities
- `ui-theme-mode`: Provide theme selection, persistence, and full UI rendering support for dark mode.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/App.tsx` (theme selector UI and app-level theme state wiring)
  - `src/styles.css` (theme variables and dark-theme styling across components)
  - Any shared UI components that use hard-coded colors
- Affected behavior:
  - Visual presentation of the entire application in dark mode
  - Persistence and restore of user theme preference
- Dependencies/systems:
  - Browser runtime storage (for theme preference persistence)

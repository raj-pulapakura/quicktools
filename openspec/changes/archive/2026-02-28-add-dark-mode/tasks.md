## 1. Theme State And Persistence

- [x] 1.1 Add a global theme mode state (`light`, `dark`, `system`) and a storage key for persisted preference.
- [x] 1.2 Initialize effective theme on app startup from persisted preference (or default) and apply it to the root theme attribute.
- [x] 1.3 Add `prefers-color-scheme` handling so `system` mode tracks OS theme changes while active.

## 2. Theme Control UI

- [x] 2.1 Add a user-facing theme mode control in an appropriate global app location (not mixed with node action controls).
- [x] 2.2 Wire the control to update theme mode state, apply visual changes immediately, and persist preference.
- [x] 2.3 Ensure control labeling and interaction are accessible and clear for Light, Dark, and System options.

## 3. Dark Theme Styling

- [x] 3.1 Introduce dark-mode design tokens in `src/styles.css` using variable-based theme overrides.
- [x] 3.2 Replace remaining hard-coded surface/text/border colors in core app surfaces with theme tokens.
- [x] 3.3 Validate dark-mode styling coverage for sidebar, toolbar, canvas, nodes, node editor, minimap, controls, and context menus.

## 4. Validation

- [x] 4.1 Verify runtime theme switching and restart persistence across Light, Dark, and System modes.
- [x] 4.2 Confirm no interaction regressions for canvas drag/connect/pan/minimap/lock behavior after theming changes.
- [x] 4.3 Run project checks (`npm run build` and `npm run check:canvas-interaction`) and resolve any failures.

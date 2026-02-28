## Context

QuickTools currently uses a single light color system defined in `src/styles.css`, and many surfaces rely on those static values. The app now has a broad set of UI surfaces (workflow list, canvas, node cards, node editor, minimap, controls, context menu), so dark mode must be implemented as a cross-cutting visual concern rather than one-off style overrides.

The implementation should preserve current interaction behavior and only change presentation/theme preference handling. Existing workflow data and runtime behavior must remain unaffected.

## Goals / Non-Goals

**Goals:**
- Provide a user-visible theme mode control with Light, Dark, and System options.
- Render the full app with a coherent dark palette using shared tokens, not ad-hoc per-component color hacks.
- Apply theme changes live without reload.
- Persist the user preference and restore it on startup.

**Non-Goals:**
- Rework layout or interaction patterns unrelated to theme.
- Introduce new external theme libraries.
- Add per-workflow or per-node custom color themes.

## Decisions

### 1) Use root-level theme attribute + CSS variables
- Decision: Keep the existing variable-driven approach and introduce light/dark token sets under a root theme selector (for example, `:root[data-theme="dark"]`).
- Rationale: This keeps style changes centralized and minimizes component-level branching in React.
- Alternatives considered:
  - Component-scoped dark classes: rejected due to high maintenance and drift risk across many surfaces.
  - CSS-in-JS theming migration: rejected as unnecessary scope expansion for this app.

### 2) Theme mode state lives in app shell and persists in local storage
- Decision: Manage theme mode in `App.tsx`, persist to `localStorage`, and apply to root/document on initialization.
- Rationale: Theme preference is global UI state and should be initialized before/with first render path.
- Alternatives considered:
  - Persist on backend/workflow payload: rejected because theme is a local UI preference, not workflow data.
  - No persistence: rejected due to poor user experience.

### 3) Support `System` mode via `prefers-color-scheme`
- Decision: Resolve effective theme from system media query when mode is `System`, and listen for system changes while in that mode.
- Rationale: Matches user expectations and avoids stale theme when OS theme flips.
- Alternatives considered:
  - Only Light/Dark explicit modes: rejected because system-follow behavior is a standard desktop UX expectation.

### 4) Keep interactions independent from theme
- Decision: Theme updates must not alter interaction flags (drag, connect, lock, minimap behavior) and should only change visual tokens.
- Rationale: Reduces regression risk in active workflow editing behavior.
- Alternatives considered:
  - Theme-specific behavior branches: rejected as unnecessary coupling.

## Risks / Trade-offs

- [Risk] Incomplete token migration leaves unreadable text or low-contrast controls in dark mode.
  - Mitigation: Replace hard-coded colors with variables across core surfaces and run visual pass over toolbar, canvas, controls, minimap, and context menu.
- [Risk] Theme flicker on startup if preference is applied too late.
  - Mitigation: Resolve/apply theme during initial app state setup and avoid delayed style swaps.
- [Risk] System mode does not react to OS theme changes.
  - Mitigation: Add media query listener while mode is `System` and clean up listeners on mode changes/unmount.

## Migration Plan

1. Add theme mode state and persistence plumbing in `App.tsx`.
2. Add theme selector UI in an appropriate global UI location.
3. Introduce dark token set in `styles.css` and replace remaining hard-coded color usages where needed.
4. Validate behavior with manual visual checks and existing build/scripts.

Rollback strategy:
- Revert to default light token set and remove theme selector/state wiring if severe regressions are found.

## Open Questions

- Should `System` be the default mode for first-time users, or should first-time default remain Light?
- Should theme preference eventually move into a dedicated app settings panel once broader settings UI exists?

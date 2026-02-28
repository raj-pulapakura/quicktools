## Why

`src/App.tsx` has grown into a large, multi-responsibility component (state orchestration, React Flow wiring, node definitions, parameter editors, persistence, and UI layout), which increases regression risk and slows feature work. Node onboarding is currently switch-based and spread across multiple areas, making each new node type expensive and error-prone to add.

## What Changes

- Refactor workflow editor code into modular units with clear boundaries (domain helpers, node-definition registry, UI composition, and editor state/actions).
- Introduce a typed node-definition registry so node metadata, defaults, summary rendering, and parameter form rendering are co-located per node type.
- Replace hard-coded add-node/button/editor switch logic with registry-driven rendering.
- Keep user-facing workflow behavior equivalent (node interactions, edge interactions, run/save semantics, minimap/theme behavior), while reducing `App.tsx` surface area.
- Add targeted tests around registry behavior and node add/update flows to guard against regressions during future node additions.

## Capabilities

### New Capabilities
- `node-definition-registry`: Node types MUST be declared through a single typed definition contract that drives add-node menus, default parameters, node summaries, and node-parameter editor rendering.

### Modified Capabilities
- `node-focus-and-editor-interaction`: Preserve existing focus/edit interaction guarantees while editor rendering moves from inline conditional branches to registry-driven components.

## Impact

- Affected code: `src/App.tsx` (decomposition), new modules under `src/` for node registry, workflow editor hooks/state/actions, and node editor components.
- Affected tests: `scripts/canvas_interaction_checks.mjs` (revalidated), plus new unit-level coverage for node-definition registry and node parameter update helpers.
- APIs/dependencies: no external API changes and no required runtime dependency additions; refactor is internal architecture-focused.

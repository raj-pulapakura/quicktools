# QuickTools (macOS v1)

QuickTools is a Tauri 2 + React desktop app for defining and running workflow graphs of launch actions.

## Stack
- Tauri 2 (Rust backend)
- React + Vite frontend
- React Flow canvas
- JSON persistence at `~/Library/Application Support/QuickTools/workflows.json`

## Run

```bash
npm install
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

## Notes
- v1 is macOS-only.
- Terminal actions target `Terminal.app`.
- Execution respects workflow dependencies and runs dependency-independent nodes in parallel batches.

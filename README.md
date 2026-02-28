# QuickTools (macOS v1)

QuickTools is a Tauri 2 + React desktop app for defining and running workflow graphs of launch actions.

<img width="1512" height="946" alt="Screenshot 2026-03-01 at 10 45 47 am" src="https://github.com/user-attachments/assets/2206ac82-7513-4339-ba55-32ad0d67dcd0" />

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

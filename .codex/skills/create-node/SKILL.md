---
name: create-node
description: Scaffold a new QuickTools workflow action node from a short request. Use when a user asks to add a node (especially "/create-node with a description"), and you need to generate definition/editor boilerplate plus register the node in workflow types and registries.
---

# Create Node

Add new action-node scaffolding in this repo with one command, then finish node-specific behavior.

## Invocation

Use this skill when the request looks like:
- `/create-node <node-description>`
- "add a new node that ..."

Treat `<node-description>` as required input.

## Commands

Run the scaffold script from repo root:

```bash
python3 .codex/skills/create-node/scripts/scaffold_node.py --description "<node-description>"
```

Optional overrides:

```bash
python3 .codex/skills/create-node/scripts/scaffold_node.py \
  --description "<node-description>" \
  --type "<snake_case_node_type>" \
  --label "<Toolbar Label>"
```

Preview changes without writing files:

```bash
python3 .codex/skills/create-node/scripts/scaffold_node.py --description "<node-description>" --dry-run
```

## Workflow

1. Parse `<node-description>` into intended behavior.
2. Run the scaffold script.
3. Edit generated files:
- `src/features/workflow/nodes/definitions/<node>Definition.ts`
- `src/features/workflow/nodes/editors/<node>Editor.tsx`
4. Implement real defaults, summary logic, and parameter editor fields.
5. Validate:
```bash
npm run check:node-registry
npm run build
npm run check:canvas-interaction
```

## What The Script Updates

- `src/types/workflow.ts` (`NodeType` union)
- `src/features/workflow/nodes/coreRegistry.ts`
- `src/features/workflow/nodes/editorRegistry.ts`
- New definition + editor module files

## Contributor Notes

- Generated editor starts as a no-parameter placeholder. Replace it when node needs config.
- Generated summary starts as a simple label. Replace it with concise runtime-relevant summary text.
- If the inferred node type is awkward, rerun with explicit `--type` and `--label`.
- Keep node behavior registry-driven. Do not add switch/case logic back into `App.tsx`.

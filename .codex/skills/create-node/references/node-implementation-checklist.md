# Node Implementation Checklist

Use after scaffolding a node.

1. Definition module
- Set `createDefaultParams()` with stable defaults.
- Implement `summarize(node)` with short, user-readable state.
- Keep summary deterministic and side-effect free.

2. Editor module
- Render only controls needed for this node.
- Update params immutably through `updateNode()`.
- Use existing class names for visual consistency (`node-editor-hint`, form labels/inputs).

3. Runtime alignment
- Ensure backend executor understands the new `NodeType` before claiming runtime support.
- If backend support is pending, communicate that clearly in PR notes.

4. Validation
- `npm run check:node-registry`
- `npm run build`
- `npm run check:canvas-interaction`

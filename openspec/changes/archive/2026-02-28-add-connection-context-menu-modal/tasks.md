## 1. Build reusable context menu modal component

- [x] 1.1 Create a reusable custom menu modal component with props for open state, anchor position, action list, and dismiss callback.
- [x] 1.2 Implement deterministic dismissal behaviors (outside click and Escape key).
- [x] 1.3 Add styling for the menu modal surface, action items, and overlay layering.

## 2. Integrate edge right-click interaction

- [x] 2.1 Add edge context-menu event handling in `src/App.tsx` and suppress native browser context menu for edges.
- [x] 2.2 Track targeted edge/menu state and open the menu at the pointer location when right-clicking an edge.
- [x] 2.3 Wire `Delete connection` action in the menu to remove the targeted edge and close the menu.
- [x] 2.4 Remove the toolbar `Delete connection` button and keep edge deletion paths coherent with selection state.

## 3. Verify UX behavior

- [x] 3.1 Add or update checks to cover right-click menu open, delete action behavior, and dismissal flows.
- [x] 3.2 Run manual QA for right-click edge delete flow and confirm toolbar no longer includes delete connection.
- [x] 3.3 Validate build and interaction checks remain passing after integration.

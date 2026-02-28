## ADDED Requirements

### Requirement: Focus and selection semantics SHALL remain stable after editor modularization
Refactoring node-editor rendering into registry-driven modules SHALL NOT change existing node focus, edge selection, and pane blur interaction semantics defined by this capability.

#### Scenario: Node click focus behavior remains unchanged after refactor
- **WHEN** a user clicks a non-START node after modularization
- **THEN** that node becomes focused
- **THEN** the editor remains open for the focused node
- **THEN** no pane-level blur clears focus during the same interaction

#### Scenario: Edge selection remains isolated from node focus
- **WHEN** a user selects an edge after modularization
- **THEN** the selected edge becomes active
- **THEN** focused node selection is cleared consistently with prior behavior

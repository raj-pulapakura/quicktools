## ADDED Requirements

### Requirement: Node click SHALL focus node and open its editor
The system SHALL set the clicked node as the focused node whenever a user clicks a node on the workflow canvas. The parameter editor panel SHALL render the focused node's configuration immediately after focus is set.

#### Scenario: Clicking an action node opens its parameters
- **WHEN** the user clicks a non-START node on the canvas
- **THEN** that node becomes the focused node
- **THEN** the node parameter editor displays controls for that same node

#### Scenario: Clicking the START node opens START details
- **WHEN** the user clicks the START node
- **THEN** the START node becomes the focused node
- **THEN** the editor panel shows START-specific read-only details

### Requirement: Draggability SHALL be focus-gated
The system SHALL allow dragging only for the focused non-START node. Unfocused nodes SHALL not move from a drag gesture until they are focused first.

#### Scenario: Focused node can be dragged
- **WHEN** a non-START node is currently focused and the user drags it
- **THEN** the node position updates according to the drag movement

#### Scenario: Unfocused node drag attempt does not move immediately
- **WHEN** the user initiates a drag gesture on a non-START node that is not focused
- **THEN** the node becomes focused
- **THEN** the node does not move during that initial gesture

### Requirement: Empty-pane click SHALL clear focus deterministically
The system SHALL clear focused-node state only for deliberate clicks on empty canvas space. Node interaction events SHALL not be canceled by pane-blur handling in the same interaction sequence.

#### Scenario: Clicking empty canvas clears editor selection
- **WHEN** the user clicks on empty canvas space
- **THEN** focused-node state is cleared
- **THEN** the editor panel shows the empty-state prompt

#### Scenario: Node click is not overridden by pane blur
- **WHEN** the user clicks a node in a way that also emits pane-level events
- **THEN** node focus remains set to the clicked node
- **THEN** the node editor remains open for the clicked node

### Requirement: Space+drag canvas pan SHALL not regress node focus behavior
The system SHALL preserve current Space+drag pan behavior and SHALL not change node focus while the user is actively panning the canvas.

#### Scenario: Space+drag pans canvas without changing focused node
- **WHEN** a node is focused and the user holds Space while dragging on the pane
- **THEN** the canvas pans
- **THEN** the previously focused node remains focused after the pan gesture

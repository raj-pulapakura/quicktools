## ADDED Requirements

### Requirement: Node definitions SHALL be registry-driven
The system SHALL define each action node type through a typed node-definition contract in a central registry. The registry SHALL provide, at minimum, node label metadata, default-parameter creation, summary rendering, and parameter-editor rendering for each node type.

#### Scenario: Registry provides definition for an action node type
- **WHEN** the editor resolves behavior for a supported action node type
- **THEN** it retrieves behavior from the node-definition registry
- **THEN** no workflow-editor switch/case branch is required for that node type

### Requirement: Add-node options SHALL derive from registry definitions
The workflow add-node UI SHALL render its node-type options from the node-definition registry rather than hard-coded lists.

#### Scenario: Add toolbar uses registry metadata
- **WHEN** the workflow toolbar renders add-node actions
- **THEN** each action node option originates from the node-definition registry label/type metadata

### Requirement: Node parameter editor SHALL delegate by node definition
For focused non-START nodes, the parameter editor SHALL delegate rendering to the registered node definition for the node type.

#### Scenario: Focused node renders registry editor
- **WHEN** a user focuses a node of type `T`
- **THEN** the editor panel renders using the node-definition renderer for `T`
- **THEN** parameter updates are applied back to that focused node instance

### Requirement: New node onboarding SHALL be localized
Adding a new node type SHALL require registering exactly one new node-definition module and SHALL not require editing unrelated node-type switch logic in the workflow editor.

#### Scenario: New node type is added through definition module
- **WHEN** a developer introduces a new supported action node type
- **THEN** the node can be added from toolbar options, shows summary text, and renders parameter controls through its registered definition
- **THEN** no additional workflow-editor switch branch is required for that node behavior

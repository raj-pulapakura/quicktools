## ADDED Requirements

### Requirement: Edge right-click SHALL open a contextual menu modal
The system SHALL open a custom context menu modal when a user right-clicks a connection in the workflow canvas. The modal SHALL target the exact edge that was right-clicked.

#### Scenario: Right-clicking a connection opens edge context menu
- **WHEN** the user right-clicks an existing connection
- **THEN** the custom context menu modal is shown
- **THEN** the targeted connection is marked as the active edge for menu actions

### Requirement: Context menu SHALL provide connection deletion
The edge context menu SHALL expose a `Delete connection` action that removes the targeted edge from the workflow graph.

#### Scenario: Deleting from context menu removes edge
- **WHEN** the user selects `Delete connection` from the edge context menu
- **THEN** the targeted edge is removed from workflow edges
- **THEN** the context menu modal closes

### Requirement: Toolbar SHALL not expose connection deletion control
The workflow toolbar SHALL not include a standalone `Delete connection` button once the edge context menu is introduced.

#### Scenario: Toolbar renders without delete connection button
- **WHEN** the workflow editor toolbar is displayed
- **THEN** no toolbar button for connection deletion is present

### Requirement: Context menu dismissal SHALL be deterministic
The context menu modal SHALL close when users click outside the menu, press Escape, click empty canvas space, or complete a menu action.

#### Scenario: Outside interaction dismisses context menu
- **WHEN** the edge context menu is open and the user clicks outside it
- **THEN** the menu closes without mutating graph edges

#### Scenario: Escape key dismisses context menu
- **WHEN** the edge context menu is open and the user presses Escape
- **THEN** the menu closes

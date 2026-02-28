## ADDED Requirements

### Requirement: User-selectable theme mode
The application SHALL provide a global theme mode setting with the values `Light`, `Dark`, and `System`.

#### Scenario: Theme modes are available in the UI
- **WHEN** a user opens the theme mode control
- **THEN** the user can choose exactly one of `Light`, `Dark`, or `System`

#### Scenario: Explicit theme mode applies immediately
- **WHEN** a user switches from one explicit mode to another (`Light` to `Dark`, or `Dark` to `Light`)
- **THEN** the application updates visual styling immediately without requiring a page reload

### Requirement: Theme preference persistence
The application SHALL persist the selected theme mode and restore it on next launch.

#### Scenario: Preference is restored on startup
- **WHEN** a user previously selected a theme mode and relaunches the application
- **THEN** the same theme mode is restored before normal interaction begins

### Requirement: System theme behavior
When theme mode is `System`, the application SHALL resolve the active theme from the operating system color scheme preference.

#### Scenario: System mode resolves to dark
- **WHEN** the user sets theme mode to `System` and the operating system prefers dark mode
- **THEN** the application renders using the dark theme tokens

#### Scenario: System mode resolves to light
- **WHEN** the user sets theme mode to `System` and the operating system prefers light mode
- **THEN** the application renders using the light theme tokens

### Requirement: Theme coverage across core UI surfaces
The selected active theme SHALL be consistently applied to core application surfaces, including workflow sidebar, toolbar, canvas background, node cards, node editor, minimap, controls, and context menus.

#### Scenario: Dark mode does not leave core surfaces unreadable
- **WHEN** the active theme is dark
- **THEN** text and interactive controls in all core surfaces remain visually legible and distinguishable

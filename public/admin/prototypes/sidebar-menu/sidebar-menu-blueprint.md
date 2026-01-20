# Blueprint: Sidebar Menu Prototypes

I am designing three distinct sidebar concepts to improve the navigation experience of the Harvest Admin panel. These concepts focus on space efficiency, cognitive load reduction, and modern aesthetics.

## [ARCHITECTURAL_HYPOTHESIS]: The "Space-Aware" Navigation
The current sidebar is a fixed 256px block that remains static regardless of the user's task. By moving to dynamic states (Floating, Collapsible, or Command-Driven), we can reclaim ~20% of horizontal real estate for data-heavy views like "Inventory Pro."

## Proposed Concepts

| Concept | Name | UX Focus | Key Interactions |
| :--- | :--- | :--- | :--- |
| **1** | **Floating Collapsible** | Minimalism & Space | Shrinks to an icon-only bar with hover tooltips. Floats on top of content to maximize canvas. |
| **2** | **Hierarchical Drawer** | Organization | Groups related tasks (e.g., "Catalog" contains Products, Templates, Categories) in nested accordions. |
| **3** | **Command Sidebar** | Utility | Integrates a prominent "Quick Action" or "Search" bar at the top, focused on speed for power users. |

## Proposed Changes

### [NEW] [Folder] `public/admin/prototypes/sidebar-menu/`
- `floating-collapsible.html`
- `hierarchical-drawer.html`
- `command-centric.html`

### Design System Extension
- **Animations**: Using CSS `transition` for smooth width changes (0.3s ease-in-out).
- **Aesthetics**: Glassmorphism accents, subtle box shadows ( `0 10px 15px -3px rgb(0 0 0 / 0.1)`), and "Loam Gray" color palette.

## Technical Implementation Details
- **State Management**: Using `localStorage` to persist the "collapsed" state across sessions.
- **Event Handling**: Moving away from `onclick` to the **ActionDispatcher** pattern where applicable.
- **CSS Variable Hooks**: Using `--sidebar-width` to allow the main content area to respond dynamically to sidebar state changes.

## Verification Plan

### Automated Tests
- I will verify that the "collapsed" state persists on page refresh.
- I will check that sub-menus in the Hierarchical Drawer expand/collapse without jumping.

### Manual Verification
- Test responsiveness: Does the sidebar behave correctly on mobile (drawer-style)?
- Test accessibility: Can I navigate the sidebar using the keyboard (Tab + Enter)?

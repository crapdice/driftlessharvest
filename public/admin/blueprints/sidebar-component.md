# Blueprint: Floating Collapsible Sidebar Component

I will implement the "Floating Collapsible" sidebar as a modular component for the Harvest Admin panel. This involves separating styles and logic to ensure maintainability and performance.

## [ARCHITECTURAL_HYPOTHESIS]: Web Components vs. Simple Injection
While a full Web Component (Shadow DOM) would offer perfect isolation, it might complicate interaction with existing global `setTab` functions. I will use a **Module-based Injection** pattern: a dedicated CSS file and a JS class that manages the DOM state but remains compatible with the current event-driven architecture.

## Proposed Changes

### [NEW] `public/admin/css/components/sidebar.css`
- Port prototype styles.
- Standardize variables (using Harvest primary colors).
- Add support for "floating" margins while maintaining responsiveness.

### [NEW] `public/admin/js/components/Sidebar.js`
- **Class `Sidebar`**:
    - `init()`: Renders the sidebar into a target container.
    - `toggle()`: Handles collapse/expand with `localStorage` persistence.
    - `setActive(tabId)`: Updates visual state when the active tab changes.
- **Events**: Should trigger or listen to the existing `setTab` flow.

### [MODIFY] `public/admin/index.html`
- Remove legacy `<aside>` block.
- Add `<div id="sidebar-container"></div>`.
- Import necessary CSS/JS modules.

## Verification Plan (TDD Approach)

### Automated/Isolated Tests
- Create `public/admin/test/sidebar-verification.html`.
- **Test Case 1**: Component renders with all navigation items.
- **Test Case 2**: Clicking toggle changes the width and persists to `localStorage`.
- **Test Case 3**: Clicking a nav item calls the mock `setTab` function.
- **Test Case 4**: Tooltips appear correctly in collapsed state.

### Final Integration Verification
- Verify that clicking "Orders" in the new sidebar correctly loads the Orders view in the main admin.
- Verify state persistence across page refreshes.

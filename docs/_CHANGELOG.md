# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2026-01-08

### Added
- **Feat: Bento Grid Layout**:
    - Introduced a dynamic "Bento Grid" layout for Featured Products on the home page.
    - Added "Smart Grid" logic to adapt layout based on item count (2x2, Flex-centered, etc.).
    - Implemented a "Horizontal" card variant for visual variety.
- **Feat: Curated Box Tooltips**:
    - Added hover tooltips for box items in the grid, displaying contents and description.
    - Configurable via Admin Panel.
- **Admin UX: Configuration Enhancements**:
    - Added "Featured Products" section configuration (Title, Subtitle).
    - Added toggles for Bento Grid and Box Tooltips.
    - **Expandable Fields**: Text inputs and textareas now auto-expand on focus for easier editing.
- **Docs**: Added `docs/input_audit.md` detailing all user input capture points.

## [1.4.1] - 2026-01-07

### Fixed
- **Admin Frontend**: Resolved widespread instability following ES6 module refactoring.
    - Fixed `loadOrders is not defined` error by exposing global function.
    - Fixed `openTemplateModal is not defined` error on "Create Template" button.
- **Delivery Schedule**: 
    - Fixed visualization to display cards by correcting DOM target ID.
    - Updated backend logic to include all active orders (not just Pending), enabling historical view.
    - Fixed `TypeError` on ID slicing by robustly casting to string.
    - Enhanced modal to display full shipping address (Street, City, Zip).
- **Inventory & Products**:
    - Implemented real-time "Active/Disabled" status updates by disabling API caching (`cache: 'no-store'`).
    - Added "Active/Disabled" active status badges to both Inventory and Products lists.
    - Switched Box Template cards to use the new `AdminBoxCard` component.
- **Configuration Panel**:
    - Fixed missing data binding for "Auth Pages" (Login/Signup configuration).
    - Fixed Mojibake (corrupted encoding) on the "Save Changes" button icon.
    - Implemented "Featured Products" dropdown population logic, filtering for active in-stock items.

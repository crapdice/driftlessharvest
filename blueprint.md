# Blueprint: Admin Products Module Refactor (Phase 3)

The `public/admin/js/modules/products.js` file is currently a "God Module" containing 922 lines and at least 4 distinct functional domains: Product Management, Box Templates, Inventory, and Archived Items. This blueprint outlines the strategy for decomposing it into a maintainable folder structure.

## Architectural Hypothesis [ARCHITECTURAL_HYPOTHESIS]
Moving to a folder-based module system (`modules/products/`) will allow us to use ES6 imports/exports more effectively, reduce global namespace pollution, and improve testability of individual components.

## Proposed Changes

### 📁 Directory Structure [NEW]
```text
public/admin/js/modules/products/
├── index.js           # Public API aggregator
├── ProductList.js     # Main product grid and search
├── ProductModal.js    # Create/Edit product logic
├── TemplatesBoard.js  # Box templates view
├── TemplateBuilder.js # Box template creation/edit modal
├── InventoryView.js   # Stock and inventory management
└── ArchivedView.js    # View for deleted/archived items
```

### [MODIFY] [app.js](file:///c:/Users/zackf/Documents/OpenAI/harvest-app/public/admin/js/modules/app.js)
Update imports to use the new `products/index.js` aggregator.

### [DELETE] [products.js](file:///c:/Users/zackf/Documents/OpenAI/harvest-app/public/admin/js/modules/products.js)
The monolithic file will be removed after successful extraction.

## Internal Reflection [CRITIC]
1. **Global Bindings**: `products.js` currently binds ~10 functions to `window`. We need to ensure these remain available during the transition (Strangler Fig pattern) or migrate the HTML to use the `ActionDispatcher` if we move to Phase 4.
2. **State Sharing**: `productsCache` and `templatesCache` are shared across domains. These should be moved to a shared state or passed explicitly.
3. **Circular Dependencies**: Ensure `ProductModal` and `ProductList` don't create circular import chains.

## Verification Gatekeeping [VERIFICATION]
1. **Manual Smoke Test**: Navigate all 4 sub-views (Products, Templates, Inventory, Archived) and verify data loads.
2. **CRUD Verification**: Create and edit a product; create and edit a box template.
3. **Inventory Update**: Modify stock and verify persistence.

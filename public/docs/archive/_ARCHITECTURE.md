# Architecture & Scaling Insights
**Date:** January 8, 2026

## 1. Current State Assessment
As of this date, the Admin Panel (`public/admin`) is built using a **Monolithic Architecture** approach with "Vanilla" HTML and JavaScript.

### Key File Metrics
-   **`public/admin/index.html`**: ~2,300+ lines (Monolith) -> *Mitigated slightly by component isolation on frontend*
-   **`js/components/BentoGrid.js`**: New pure-function component for grid rendering.
-   **`js/components/FeaturedProducts.js`**: Extracted component for legacy/standard view.
-   **`public/admin/js/modules/products.js`**: ~38 KB
-   **`public/admin/js/modules/orders.js`**: ~30 KB

### Impact Analysis
While the current size is performant for end-users (loading instantly on broadband), it presents significant challenges for **Developer Experience (DX)**:
*   **Cognitive Load**: Navigating a 2,000-line HTML file requires significant scrolling and mental context switching (e.g., jumping between the "Product Modal" and "Order Modal" in the same file).
*   **Merge Conflicts**: In a multi-developer environment, simultaneous edits to different sections of `index.html` will almost certainly result in git merge conflicts.
*   **Fragility**: The risk of ID collisions (e.g., reusing `id="save-btn"`) increases with file size, potentially breaking JS logic.

## 2. Recommendation: The "Partials" Approach

### What is it?
Moving from a single file to a **Component-Based Architecture** where the UI is broken down into smaller, manageable files ("partials").
*   `index.html` (Main Layout)
*   `components/navbar.html`
*   `modals/product-modal.html`
*   `views/inventory.html`

### Is this Modern?
**Yes.** This aligns with modern standards used by frameworks (React, Vue) and backend templating engines (Laravel, Rails). It adheres to the **Separation of Concerns** principle.

### Risks & Benefits

| Feature | Monolith (Current) | Partials (Recommended Future) |
| :--- | :--- | :--- |
| **Setup** | Zero. Just open in Chrome. | **Requires Tooling.** Browsers cannot natively "include" HTML files efficiently. You need a build step. |
| **Maintainability** | Low. "Spaghetti code" risk. | **High.** Isolated files are easier to understand and debug. |
| **Reusability** | Copy-Paste. | Write once, use everywhere. |
| **Performance** | One HTTP request (Fast). | Bundled into one file by tools (Fast). |

## 3. Strategic Roadmap

### Immediate Term (Current Phase)
*   **Action:** Stick with the Monolith for now to maintain velocity on current features.
*   **Mitigation:** Enforce strict naming conventions for IDs (e.g., `p-` for products, `t-` for templates) to prevent collisions. Use extensive code folding and comments (`<!-- SECTION -->`) to navigate `index.html`.

### Medium Term (Next Major Refactor)
*   **Trigger:** When we add the next major module (e.g., "Analytics" or "CRM").
*   **Action:** specific implementation of a **Build Tool** like **Vite**.
    *   **Why Vite?** It allows us to keep writing Vanilla JS/HTML but provides the "glue" to stitch partials together.
    *   It provides "Hot Module Replacement" (instant browser updates).
    *   It handles bundling/minification automatically.

### Long Term
*   **Trigger:** If the app demands complex, reactive state management (e.g., real-time collaborative editing).
*   **Action:** Consider migrating to a lightweight framework like **Vue.js** or **Svelte**, which enforce component architecture by design.

## 4. Naming Conventions

To maintain consistency as the application scales, adhering to the following naming conventions is critical.

### Database Schema
*   **Tables**: Use **plural** nouns in **snake_case**.
    *   *Correct*: `users`, `box_templates`, `active_carts`, `order_items`
    *   *Incorrect*: `user`, `BoxTemplates`, `activeCarts`
*   **Columns**: Use **snake_case**.
    *   *Correct*: `user_email`, `created_at`, `stripe_payment_id`
    *   *Incorrect*: `userEmail`, `createdAt`
*   **Foreign Keys**: Follow the pattern `[resource_singular]_id`.
    *   *Correct*: `order_id`, `product_id`
*   **Primary Keys**: Always `id` (INTEGER AUTOINCREMENT).

### Codebase
*   **Files**:
    *   **Frontend Modules**: `camelCase.js` or `kebab-case.js` (Consistency: `products.js`, `orders.js` -> plural nouns/topics).
    *   **Backend Routes**: `[resource].routes.js` (e.g., `payment.routes.js`).
    *   **Components**: PascalCase for class-based/UI components (e.g., `BoxDetailsModal.js`).
*   **Variables**:
    *   **JavaScript**: `camelCase` (e.g., `userEmail`, `paymentIntent`).
    *   **SQL Parameters**: Match column names or obvious variables.

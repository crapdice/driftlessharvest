# System Stability & Architecture Advisory

## "Why does the admin panel break so easily?"

You correctly observed that small frontend changes (like adding a field to Checkout) often break the Admin Panel. This is not just "bad luck"—it is a distinct architectural symptom called **Tight Coupling via Untyped Data**.

Here is the technical reality of why this happens and how we fix it.

### The Root Causes

1.  **Implicit Schema (JSON Blobs)**
    *   **Problem**: We store key order information (Address, Items, Shipping) as "JSON Strings" in a single text column in the database.
    *   **Effect**: The database *doesn't know* what an "Address" looks like. If the frontend saves `{ street: "Main St" }` today, and `{ address_street: "Main St" }` tomorrow, the Admin Panel (which expects `street`) immediately crashes or shows "N/A".
    *   **Analogy**: It's like filing documents in a cabinet labeled "Stuff" instead of separate folders for "Invoices" and "Receipts". You have to open every document to know what's inside.

2.  **No Shared Source of Truth (DRY Violation)**
    *   **Problem**: The "Checkout" page defines what an Order looks like. The "Admin" page *re-defines* it. They do not share a single file that says "This is what an Order is".
    *   **Effect**: When you update Checkout, you *must* remember to verify Admin manually. If you forget, it breaks.

3.  **Silent Failures**
    *   **Problem**: JavaScript is "lenient". If you try to read `order.address.zip` and `address` is missing, it doesn't warn you at compile time; it just crashes the user's browser at runtime.

---

### The Solution: Stability Roadmap

To make the system robust and "white-label ready" (sellable), we should undergo a **Stability Refactor**.

#### Phase 1: Database Normalization (Partially Complete)
*   **Status**: `addresses` table exists. `orders` has `address_id`.
*   **Gap**: `orders` still relies heavily on `shipping_details` JSON blob in some legacy flows. New `order_items` table exists but needs full adoption to replace `items` JSON blob.

#### Phase 2: Shared Types (Contract) (Pending)
Even without TypeScript, we can create a `models.js` file shared by both Frontend and Admin.
```javascript
// models.js
export function createOrder(user, items, address) {
    if (!address.zip) throw new Error("Missing Zip");
    return { ... };
}
```

#### Phase 3: Automated Testing. (Pending)
*   Need a basic "Happy Path" smoke test: Login -> Admin -> Load Products -> succeed.

#### Phase 4: Server Refactor (Completed ✅)
Modularized the monolithic `server.js`.

### Immediate Recommendation: The "Data Layer" Refactor

**Is a refactor optimal now? YES, but targeted.**

Do **NOT** rewrite the entire app. instead, focus on the **Data Layer**:

1.  **Stop "Try-Catch" Migrations**: Refactor `server/db/index.js`. It currently runs every `ALTER TABLE` on every boot. This is risky. Move to a versioned migration system (e.g., `migrations/001_initial.sql`, `migrations/002_add_archived.sql`).
2.  **Enforce Normalization**: Finish the transition from `items` (JSON) to `order_items` (Table). This allows for powerful analytics ("How many Apples did we sell?") which is impossible with JSON blobs.
3.  **Shared Validators**: Create `common/validators.js` (using Zod or Joi) that both Backend APIs and Frontend Forms use. eliminating the "Admin crashes because Checkout saved bad data" bug.

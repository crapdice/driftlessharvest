# Project To-Do List

## Architecture & Best Practices

### [ ] Cart Hydration & Validation (The "Professional Fix")
**Problem**: Storing the cart in `localStorage` persists items even after the database is reset or if items go out of stock externally. This creates a "Ghost Cart" where the frontend thinks it has items that are actually invalid or out of stock.

**Proposed Solution**:
1.  **Frontend**: Load `cart` from `localStorage` on page load.
2.  **API Call**: Immediately send this cart to a validation endpoint (e.g., `POST /api/cart/validate`).
3.  **Backend**: Check actual stock levels and item existence. Return a "Diff" or "Adjustments" list (e.g., "Item 5 is now OOS", "Item 2 only has 3 left").
4.  **Sync**: Frontend updates `localStorage` and UI to match the server's reality (removing invalid items or adjusting quantities).

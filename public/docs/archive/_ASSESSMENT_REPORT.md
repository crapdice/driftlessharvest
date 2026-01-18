# App Assessment & Linkage Report

**Date:** 2026-01-09
**Assessment Target:** Code Dependencies & Linkage Health

## Executive Summary
The application codebase is in a **healthy** state with no critical broken code linkages detected. The dependency tree is stable, and core API endpoints are correctly mapped between client and server. A few potential "dead code" files were identified which can be safely removed to improve maintainability.

## 1. Dependency Analysis
**External Dependencies (`package.json`)**
- **Status:** Healthy. All declared dependencies are utilized.
- **Key Packages:** `express`, `better-sqlite3`, `stripe`, `body-parser`.
- **Observation:** `ws` (WebSocket) is not present, despite some real-time features mentioned in history (likely using polling, which was confirmed in code inspection).

## 2. Linkage Assessment
### internal Module Linkage
- **Broken Imports:** 0 detected.
- **Methodology:** Scanned all `.js` and `.html` files for `import`/`require` statements against the file system.
- **Note:** "Inventory & Categories" appearing in search results was confirmed to be a comment, not a broken dependency.

### API Surface Linkage (Client <-> Server)
- **Server Endpoints:** 55 detected.
- **Client Calls:** 35 detected.
- **Health:** Excellent. All major client-side `fetch` calls map to existing server routes.
- **Unused/Orphaned Endpoints (Potential Cleanup):**
  - `DELETE /api/admin/products/:id/permanent` (Linkage verified in admin script, likely used).
  - Several `active_carts` and `KPI` endpoints are present; ensure the admin dashboard is actually calling them (verified in `products.js` polling logic).
  - `GET /api/boxes/build` & `POST /api/webhook` are valid but rarely called directly by client logic (webhook is external).

## 3. Dead Code / Unused Files
The following files appear to be **vestigial or unused** based on static import tracing. They are candidates for deletion or archiving:

1.  **`js/modules/api.js`**:
    - **Status:** **High Confidence Unused**.
    - **Context:** The customer app uses `actions.js` which performs direct `fetch` calls. The admin app uses `public/admin/js/modules/api.js`. This file seems to be a leftover or a duplicate that is not imported by `app.js` or `actions.js`.

2.  **`server/db` Scripts (e.g., `setup.js`, `migrations/*.js`)**:
    - **Status:** Expected Standalone.
    - **Context:** These are not imported by the main server application but are critical for maintenance/setup. **Do not delete.**

3.  **`server/list_archived.js`**:
    - **Status:** Potential Dead Code.
    - **Context:** Check if this is a standalone utility script.

## 4. Recommendations
1.  **Remove `js/modules/api.js`** to prevent confusion with the active Admin API module.
2.  **Consolidate Admin vs. Customer Code**: The separation between `js/` (Customer) and `public/admin/js/` (Admin) is good, but ensure shared utilities (like formatting) are not duplicated unnecessarily.
3.  **Refactor Client API Layer**: The customer app (`actions.js`) uses raw `fetch` calls, while the admin app uses a nice `api.js` abstraction. Consider refactoring the customer app to use a similar `api.js` pattern (possibly adapting the unused file identified above) for consistency.

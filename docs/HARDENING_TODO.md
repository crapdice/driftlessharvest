# App Hardening Checklist

This document tracks the steps required to transition the Harvest App to a production-ready state.

## 1. Security Core (Immediate Action)
- [ ] **Secure HTTP Headers**: Implement `helmet` to set protection headers (XSS Filter, HSTS, etc.).
- [ ] **Rate Limiting**: Implement `express-rate-limit` to prevent brute-force attacks.
    - [ ] Global limit (e.g., 100 req/15min).
    - [ ] Strict limit for `/api/auth/*` (e.g., 5 req/hour).
- [ ] **CORS Policy**: Implement `cors` to restrict access to trusted domains (Frontend).
- [ ] **Input Sanitization**: Ensure no raw user input is blindly trusted (prevent Injection).

## 2. Performance & Reliability
- [ ] **Compression**: Use `compression` middleware to reduce response sizes (JSON/HTML).
- [ ] **Structured Logging**: Replace `console.log` with `winston` and `morgan` for persistent, searchable logs.
- [ ] **Global Error Handling**: Centralize `try/catch` logic into a middleware to prevent server crashes and sensitive info leaks.
- [ ] **Graceful Shutdown**: Handle `SIGTERM`/`SIGINT` to close database connections and finish requests before exiting.

## 3. Data Integrity & Validation
- [ ] **Schema Validation**: Use `zod` to strictly define and validate API request bodies (Signup, Login, Order creation).
- [ ] **Type Safety**: Enforce field types (Number vs String) before data hits the database.

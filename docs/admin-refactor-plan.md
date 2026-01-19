# Admin Panel Refactoring Plan

> Created: 2026-01-17
> Last Updated: 2026-01-19
> Last Verified: 2026-01-19 17:30 CST (TDD verified)
> Status: Phases 1, 2, 3, 7 Complete | Phase 4 Next

## Executive Summary

The admin codebase is evolving towards a modular, API-driven architecture. Phase 2 (API Consolidation) and Phase 7 (Backend Refactoring) are fully complete and verified. The modularization of `orders.js` into an MVC pattern is also complete. We are now entering Phase 3, targeting the `products.js` "God Module."

---

## Current Architecture Issues

### 🔴 Critical Issues

1. **God Module: `products.js` (938 lines)**
   - Handles products, templates, inventory, archived, modals, polling
   - **Target for Phase 3**
   
2. **100+ `window.*` Global Bindings**
   - Functions scattered across modules
   - No namespace isolation
   - **Target for Phase 4**

### 🟡 Major Issues

3. **Mixed View Loading Patterns**
   - Some views embedded in index.html
   - Some views in external files
   - **Target for Phase 5**

---

## Refactoring Phases

### Phase 1: Quick Cleanup ✅ COMPLETE (Verified 2026-01-19)

- [x] **Delete dead files**
  - [x] `js/admin.js` (237 lines)
  - [x] `js/main.js` (91 lines)
  - [x] `js/user-modal-placeholder.js`
  - [x] `modules/users.js.backup`
  - [x] `test-modal.html` (Cleanup 2026-01-19)
  - [x] `tests/repro_marketing_redirect.js` (Cleanup 2026-01-19)
  - [x] `tests/verify_admin_refactor.mjs` (Cleanup 2026-01-19)

- [x] **Verified Active/Restored**
  - [x] `user-modal.html` and `user-modal-new.js` (Restored 2026-01-19 per request)
  - [x] `gemini.js` and `api-keys.js` (Confirmed essential)

- [x] **Module Assessment**
  - [x] `orders.js` modularization (MVC pattern) - **ALREADY COMPLETE**

---

### Phase 2: API Consolidation (2-3 hours) ✅ COMPLETE (Pushed 2026-01-19)

**Added to api.js:**
- [x] `api.getConfig()`, `api.updateConfig(data)`
- [x] `api.testGemini()`
- [x] `api.cleanDatabase()` utilities
- [x] `api.getAnalyticsOverview()`, `getRecentVisitors()`
- [x] `api.getCategories()`, `createCategory()`, `deleteCategory()`
- [x] `api.restoreProduct()`, `permanentDeleteProduct()`
- [x] `api.logout()` (Added to support clean session teardown)

**Final Sweep & Fixes (2026-01-19):**
- [x] Replaced `fetch('/api/config')` with `api.getConfig()` in `layouts.js:loadLayouts()` ✅
- [x] Fixed `layouts.js:saveComponentContent()` to use `api.getConfig()` (TDD verified 2026-01-19)
- [x] Fixed critical syntax error in `settings.js` (`saveSettings`).
- [x] Consolidated `app.js` login/logout logic to use `api.js`.
- [x] Resolved `MODULE_NOT_FOUND: ../schemas` server blocker.
- [x] Verified via `api-diagnostic.html` (Contract Testing).

---

### Phase 3: Split God Modules (4-6 hours) ✅ COMPLETE (2026-01-19)

> **Completed via TDD:** `products.js` (938 lines) refactored into `products/` module directory with `state.js` (shared cache) and `index.js` (879 lines, full functionality). All 24 unit tests pass.

#### `products/` Module Structure:

- [x] `state.js` - Centralized cache (productsCache, templatesCache, polling)
- [x] `index.js` - All exports, window bindings, and view logic
- [x] Updated `app.js` imports to `./products/index.js`
- [x] TDD tests: 21 export/binding tests + 3 API consolidation tests = 24 pass

---

### Phase 4: Reduce Window Pollution (3-4 hours)

- [ ] Implement `ActionDispatcher.js` or standard event delegation to remove `window.*` reliance.

---

### Phase 5: Standardize Views (3-4 hours)

- [ ] **Extract embedded views from index.html** to `views/*.html`.
- [ ] Standardize `dataset.loaded` check for deferred loading.

---

### Phase 7: Backend Route Refactoring ✅ (Completed 2026-01-18)

**Status:** Fully complete. All monolithic routes extracted to domain-specific modules in `server/routes/admin/`.

---

## Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| Phase 1: Quick Cleanup | **✅ Complete** | 2026-01-17 | 2026-01-19 |
| Phase 2: API Consolidation | **✅ Complete** | 2026-01-17 | 2026-01-19 |
| Phase 3: Split God Modules | **✅ Complete** | 2026-01-19 | 2026-01-19 |
| Phase 4: Reduce Window Pollution | Not Started | - | - |
| Phase 5: Standardize Views | Not Started | - | - |
| Phase 6: Build Tooling | Not Started | - | - |
| **Phase 7: Backend Routes** | **✅ Complete** | 2026-01-18 | 2026-01-18 |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-18 | Used TDD for backend route refactoring | Ensures no regressions during extraction |
| 2026-01-18 | Created route aggregator pattern | Allows gradual extraction without changing app.js |
| 2026-01-19 | Finalized Phase 2 Sweep | Cleaned up remaining fetch calls and resolved server startup issues |
| 2026-01-19 | Restored User Modal files | User requested restoration after audit; identified as active dependency |
| 2026-01-19 | Pushed Complete Codebase | Synchronized local refactor state with remote development branch |

---

## Notes

- Keep this document updated as work progresses
- Phase 3 is the current immediate priority
- Phase 4 should follow to consolidate event handling

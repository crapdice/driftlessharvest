# Admin Panel Refactoring Plan

> Created: 2026-01-17
> Last Updated: 2026-01-20
> Last Verified: 2026-01-20 00:00 CST (TDD verified)
> Status: Phases 1, 2, 3, 4, 7 Complete | Phase 5 In Progress

## Executive Summary

The admin codebase has been significantly modernized. Phases 1-4 and 7 are complete. The `ActionDispatcher` now handles all UI events via `data-action` attributes, eliminating 63 inline `onclick` handlers. Next priority is Phase 5 (View Standardization) or Phase 6 (Build Tooling).

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

### Phase 4: Reduce Window Pollution (3-4 hours) ✅ COMPLETE (2026-01-19)

> **Status:** All view template migrations finished. 63 `onclick` handlers converted to `data-action` across 5 files. TDD verified.

- [x] Create `core/ActionDispatcher.js` (event delegation system)
- [x] Create `core/AppActions.js` (app, inventory, delivery)
- [x] Create `core/UtilitiesActions.js` (21 actions)
- [x] Create `core/SettingsActions.js` (11 actions)
- [x] Create `core/UsersActions.js` (3 actions)
- [x] Migrate `index.html` (8 handlers)
- [x] Migrate `utilities.html` (31 handlers)
- [x] Migrate `settings.html` (19 handlers)
- [x] Migrate `users.html` (4 handlers)
- [x] Migrate `templates.html` (1 handler)
- [x] Remove redundant `window.*` bindings from `app.js` (7 removed)

#### Manual Testing Checklist (Phase 4)

| Test | Action | Expected Result |
|------|--------|-----------------|
| ✅ Theme Toggle | Click the sun/moon button (top-right header) | Theme cycles. |
| ✅ Logout | Click "Logout" button | Session ends, login modal appears. |
| ✅ Inventory Sort | Click any column header | Data re-sorts, arrow appears. |
| ✅ Settings Tabs | Click tab buttons (General, Branding, etc.) | Content switches. |
| ✅ Utilities Actions | Click seed/purge buttons | Actions trigger (API 401 if unauthenticated). |

**TDD Page**: [action-dispatcher-tdd.html](http://localhost:3000/admin/test/action-dispatcher-tdd.html)

---

### Phase 5: Standardize Views (2-3 hours) ✅ COMPLETE (2026-01-20)

> **Status:** All views now use dynamic `fetch()` + `dataset.loaded` pattern. Final extraction: delivery view (34 lines). index.html reduced to ~596 lines.

- [x] Extract Product Modal → `product-modals.html`
- [x] Extract Template Modal → `product-modals.html`
- [x] Create `order-modals.html` (schedule, date, order-edit, cart, reschedule)
- [x] Remove embedded modals from `index.html`
- [x] Add container placeholders for dynamic loading
- [x] Extract delivery view → `views/delivery.html`
- [x] Add dynamic `fetch()` loading to `delivery.js`
- [x] Standardize `dataset.loaded` check across all modules

**All 16 view files now load dynamically via `fetch()`.**

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
| Phase 4: Reduce Window Pollution | **✅ Complete** | 2026-01-19 | 2026-01-20 |
| Phase 5: Standardize Views | **✅ Complete** | 2026-01-19 | 2026-01-20 |
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
| 2026-01-20 | Completed ActionDispatcher migration | 63 onclick handlers converted to data-action, 4 action modules created |
| 2026-01-20 | Removed redundant window bindings | 7 duplicate bindings removed from app.js |

---

## Notes

- Phase 4 complete — all UI events now use ActionDispatcher
- Phase 5 is the next priority for HTML standardization
- Consider Phase 6 (Vite/Rollup) for production bundling

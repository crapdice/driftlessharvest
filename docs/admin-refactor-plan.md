# Admin Panel Refactoring Plan

> Created: 2026-01-17
> Last Updated: 2026-01-18
> Status: In Progress

## Executive Summary

The admin codebase is functional but fragmented, scoring **5/10** overall. It's in a transitional state between legacy patterns and modern architecture. This document outlines the cleanup and refactoring plan.

---

## Current Architecture Issues

### 🔴 Critical Issues

1. **Three Competing Entry Points**
   - `js/admin.js` - Legacy, never loaded
   - `js/main.js` - ViewRouter, never loaded  
   - `js/modules/app.js` - Actually used
   
2. **116+ `window.*` Global Bindings**
   - Functions scattered across modules
   - No namespace isolation
   - Hard to trace definitions

3. **God Module: `products.js` (924 lines)**
   - Handles products, templates, inventory, archived, modals, polling
   - Should be split into focused modules

### 🟡 Major Issues

4. **Mixed View Loading Patterns**
   - Some views embedded in index.html
   - Some views in external files
   - Inconsistent loading checks

5. **Inconsistent API Usage**
   - Some calls use `api.js`
   - Some use raw `fetch()`

---

## Refactoring Phases

### Phase 1: Quick Cleanup (1-2 hours)

- [x] **Delete dead files**
  - [x] `js/admin.js` (237 lines)
  - [x] `js/main.js` (91 lines)
  - [x] `js/user-modal-placeholder.js`
  - [x] `modules/users.js.backup`

- [x] **Delete unused core files (if not using feature flags)**
  - [x] `js/core/ViewRouter.js`
  - [x] `js/core/FeatureFlags.js`
  - [x] `js/core/DataStrategy.js`

- [x] **Remove debug console.logs** from production paths (5 logs removed)

- [ ] **Extract common utilities** (LOW PRIORITY - escapeHtml only in 1 file)
  - [ ] `escapeHtml()` used in InventoryAlertService.js only

---

### Phase 2: API Consolidation (2-3 hours) ✅

**Added to api.js:**
- [x] `api.getConfig()` 
- [x] `api.updateConfig(data)`
- [x] `api.testGemini()`
- [x] `api.cleanDatabase()`, `cleanOrders()`, `cleanUsers()`, `cleanAnalytics()`, etc. (9 utilities methods)
- [x] `api.getAnalyticsOverview(days)`, `getRecentVisitors()`
- [x] `api.getCategories()`, `createCategory()`, `deleteCategory()`
- [x] `api.restoreProduct()`, `permanentDeleteProduct()`
- [x] `api.restoreConfig()`

**Files refactored to use api.js:**
- [x] `api-keys.js` - All inline fetches replaced
- [x] `app.js` - Config fetch replaced
- [x] `utilities.js` - 10 inline fetches replaced → now uses api.js
- [x] `analytics.js` - 2 inline fetches replaced → now uses api.js
- [x] `categories.js` - 3 inline fetches replaced → now uses api.js
- [x] `products.js` - Already using api.js for product operations
- [x] `settings.js` - Already using api.js (getConfig/updateConfig)
- [x] `layouts.js` - View HTML fetches only (no API calls to refactor)

---

### Phase 3: Split God Modules (4-6 hours)

#### Split `products.js` into:

```
modules/products/
├── index.js           # Re-exports everything
├── ProductsList.js    # List view + search (~150 lines)
├── ProductModal.js    # Create/edit modal (~100 lines)
├── TemplatesList.js   # Box templates grid (~100 lines)
├── TemplateBuilder.js # Template modal + items (~150 lines)
├── InventoryView.js   # Stock management (~150 lines)
├── ArchivedView.js    # Archived products (~50 lines)
└── productsApi.js     # API calls for products (~50 lines)
```

- [ ] Create `modules/products/` directory
- [ ] Extract `ProductsList.js`
- [ ] Extract `ProductModal.js`
- [ ] Extract `TemplatesList.js`
- [ ] Extract `TemplateBuilder.js`
- [ ] Extract `InventoryView.js`
- [ ] Extract `ArchivedView.js`
- [ ] Extract `productsApi.js`
- [ ] Update imports in `app.js`
- [ ] Test all product views

#### Split `settings.js` into:

- [ ] Evaluate if splitting is needed (currently 590 lines)
- [ ] Consider: ConfigForm.js, ThemeSettings.js, ExperimentSettings.js

---

### Phase 4: Reduce Window Pollution (3-4 hours)

**Approach Decision:** [Choose one]
- [ ] Option A: Event Delegation (recommended)
- [ ] Option B: Data Attributes
- [ ] Option C: Namespace (`window.admin.*`)

#### If Event Delegation:

- [ ] Create `ActionDispatcher.js` in core/
- [ ] Convert onclick handlers to data-action attributes
- [ ] Update HTML templates in views/
- [ ] Remove window bindings from modules

---

### Phase 5: Standardize Views (3-4 hours)

- [ ] **Extract embedded views from index.html**
  - [ ] List all embedded view divs
  - [ ] Extract to `views/*.html` files
  - [ ] Update loading logic

- [ ] **Standardize loading pattern**
  - [ ] All views use `dataset.loaded` check
  - [ ] All views in external files
  - [ ] Remove ViewRouter complexity

- [ ] **Reduce index.html size**
  - [ ] Target: < 20KB (currently 92KB)

---

### Phase 7: Backend Route Refactoring ✅ (Completed 2026-01-18)

**Goal:** Refactor monolithic `admin.routes.js` (752 lines) into domain-specific modules.

**Approach:** TDD with contract testing - created tests first, then extracted routes incrementally.

**Results:**
| Metric | Before | After |
|--------|--------|-------|
| `admin.routes.js` | 752 lines | 17 lines (deprecated shell) |
| Route files | 1 | 11 |
| Contract tests | 0 | 42 |

**Final Structure:**
```
server/routes/admin/
├── index.js              # Route aggregator
├── stats.routes.js       # GET /admin/stats
├── inventory.routes.js   # inventory-status, active-carts
├── users.routes.js       # User CRUD (5 endpoints)
├── orders.routes.js      # Order management (4 endpoints)
├── delivery.routes.js    # Delivery windows/schedule (5 endpoints)
├── categories.routes.js  # POST /admin/categories
├── products.routes.js    # Product CRUD (8 endpoints)
├── box-templates.routes.js # Box templates (5 endpoints)
├── utilities.routes.js   # Database utilities (9 endpoints)
└── analytics.routes.js   # Analytics (2 endpoints)
```

**Tests Created:**
- `tests/helpers/test-utils.js` - HTTP helpers, test runner
- `tests/routes/admin.routes.test.js` - 16 contract tests
- `tests/routes/products.routes.test.js` - 9 contract tests
- `tests/routes/box-templates.routes.test.js` - 6 contract tests
- `tests/routes/utilities.routes.test.js` - 9 contract tests

- [x] Create test infrastructure
- [x] Extract `stats.routes.js`
- [x] Extract `inventory.routes.js`
- [x] Extract `users.routes.js`
- [x] Extract `orders.routes.js`
- [x] Extract `delivery.routes.js`
- [x] Extract `categories.routes.js`
- [x] Update `app.js` mounting
- [x] Verify all tests pass
- [x] Extract `products.routes.js` (8 endpoints)
- [x] Extract `box-templates.routes.js` (5 endpoints + helper)
- [x] Move `utilities.routes.js` to admin/ (9 endpoints)

---

### Phase 6: Build Tooling (Optional, 2-3 hours)

- [ ] **Add Vite**
  - [ ] `npm create vite@latest` or manual setup
  - [ ] Configure for existing structure
  - [ ] Setup dev server

- [ ] **Benefits after setup**
  - [ ] Hot module replacement
  - [ ] Production bundling
  - [ ] Tree-shaking
  - [ ] Optional TypeScript

---

## File Reference

### Files to Delete

| File | Size | Reason |
|------|------|--------|
| `js/admin.js` | 7.6KB | Never loaded |
| `js/main.js` | 2.8KB | Never loaded |
| `js/user-modal-placeholder.js` | 652B | Placeholder |
| `modules/users.js.backup` | 13.5KB | Backup |

### Large Files to Refactor

| File | Size | Lines | Priority |
|------|------|-------|----------|
| `modules/products.js` | 42KB | 924 | High |
| `modules/settings.js` | 25KB | 590 | Medium |
| `modules/layouts.js` | 21KB | ~500 | Medium |
| `modules/utilities.js` | 19KB | ~500 | Low |

### Core Infrastructure

| File | Purpose | Keep? |
|------|---------|-------|
| `core/InventoryAlertService.js` | Low stock polling | ✅ Yes |
| `core/ViewRouter.js` | Strangler fig migration | ❓ Review |
| `core/FeatureFlags.js` | A/B testing | ❓ Review |
| `core/DataStrategy.js` | Data loading strategy | ❓ Review |

---

## Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| Phase 1: Quick Cleanup | Partial | 2026-01-17 | |
| Phase 2: API Consolidation | Partial | 2026-01-17 | |
| Phase 3: Split God Modules | Not Started | | |
| Phase 4: Reduce Window Pollution | Not Started | | |
| Phase 5: Standardize Views | Not Started | | |
| Phase 6: Build Tooling | Not Started | | |
| **Phase 7: Backend Routes** | **✅ Complete** | 2026-01-18 | 2026-01-18 |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-17 | Created refactor plan | Codebase assessment revealed 5/10 score |
| 2026-01-18 | Used TDD for backend route refactoring | Ensures no regressions during extraction |
| 2026-01-18 | Created route aggregator pattern | Allows gradual extraction without changing app.js |
| 2026-01-18 | Extracted products, box-templates, utilities | Completed full admin route refactoring |

---

## Notes

- Keep this document updated as work progresses
- Mark checkboxes as tasks are completed
- Add decisions to the Decision Log

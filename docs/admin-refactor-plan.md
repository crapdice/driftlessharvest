# Admin Panel Refactoring Plan

> Created: 2026-01-17
> Last Updated: 2026-01-17
> Status: Planning

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

- [ ] **Remove debug console.logs** from production paths

- [ ] **Extract common utilities**
  - [ ] `escapeHtml()` used in multiple places → move to utils.js

---

### Phase 2: API Consolidation (2-3 hours)

**Added to api.js:**
- [x] `api.getConfig()` 
- [x] `api.updateConfig(data)`
- [x] `api.testGemini()`

**Files refactored to use api.js:**
- [x] `api-keys.js` - All inline fetches replaced
- [x] `app.js` - Config fetch replaced

**Files still needing refactoring:**
- [ ] `settings.js` - 4 inline fetches
- [ ] `products.js` - 4 inline fetches  
- [ ] `layouts.js` - 6 inline fetches
- [ ] `utilities.js` - 9 inline fetches (utilities endpoints)
- [ ] `categories.js` - 2 inline fetches
- [ ] `analytics.js` - 1 inline fetch

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
| Phase 1: Quick Cleanup | Not Started | | |
| Phase 2: API Consolidation | Not Started | | |
| Phase 3: Split God Modules | Not Started | | |
| Phase 4: Reduce Window Pollution | Not Started | | |
| Phase 5: Standardize Views | Not Started | | |
| Phase 6: Build Tooling | Not Started | | |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-17 | Created refactor plan | Codebase assessment revealed 5/10 score |
| | | |

---

## Notes

- Keep this document updated as work progresses
- Mark checkboxes as tasks are completed
- Add decisions to the Decision Log

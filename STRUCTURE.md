# Project Structure Guide
**Harvest App - Developer Conventions**

> ⚠️ **READ THIS BEFORE ADDING FILES**
> This document defines where files belong. Violations will be flagged in code review.

---

## Directory Map

```
harvest-app/
├── .agent/              # AI agent tooling (DO NOT MODIFY)
├── data/                # Databases & data files
│   ├── harvest.db       # SQLite database
│   └── config.json      # App configuration
├── docs/                # ALL documentation
│   ├── architecture/    # System design docs
│   ├── database/        # DB schemas, migrations docs
│   ├── deployment/      # Deploy guides
│   └── marketing/       # Marketing-related docs
├── public/              # Frontend static files
│   ├── admin/           # Admin panel
│   │   └── js/
│   │       ├── components/  # Reusable UI components
│   │       ├── core/        # Singleton services
│   │       └── modules/     # Feature modules
│   ├── js/              # Customer storefront
│   │   ├── components/  # Reusable UI components
│   │   ├── modules/     # Feature modules
│   │   ├── store/       # State management
│   │   └── views/       # Page views
│   └── marketing/       # Marketing portal
├── scripts/             # Utility & maintenance scripts
│   ├── maintenance/     # DB maintenance, cleanup
│   ├── migrations/      # Schema migrations
│   └── testing/         # Test utilities
├── server/              # Backend Express app
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   │   └── admin/       # Admin-only routes
│   ├── services/        # Business logic
│   └── repositories/    # Data access layer
└── tests/               # All test files
```

---

## File Placement Rules

### 📄 Documentation
| If you're writing... | Put it in... |
|---------------------|--------------|
| Architecture docs | `docs/architecture/` |
| Deployment guides | `docs/deployment/` |
| Marketing docs | `docs/marketing/` |
| API docs | `docs/api/` |
| Database docs | `docs/database/` |

**❌ NEVER put `.md` files in project root (except README.md)**

---

### 🗄️ Database Files
| File Type | Location |
|-----------|----------|
| SQLite database | `data/` |
| Config JSON | `data/` or `server/data/` |
| Migration scripts | `scripts/migrations/` |

**❌ NEVER put `.db` files in project root**

---

### 🛤️ Routes
| Route Type | Location | Naming |
|------------|----------|--------|
| Admin routes | `server/routes/admin/` | `*.routes.js` |
| Customer routes | `server/routes/` | `*.routes.js` |
| Legacy routes | ❌ DELETE THEM | - |

---

### 📦 Frontend JavaScript
| File Type | Admin Panel | Customer Storefront |
|-----------|-------------|---------------------|
| Feature modules | `public/admin/js/modules/` | `public/js/modules/` |
| UI components | `public/admin/js/components/` | `public/js/components/` |
| Views/pages | `public/admin/views/` | `public/js/views/` |
| Singleton services | `public/admin/js/core/` | - |

**Acceptable flat files** (only these at `js/` root):
- `app.js` - Entry point
- `utils.js` - Shared utilities
- `models.js` - Data structures
- `themes.js` - Theme configuration
- `tracker.js` - Analytics tracker

**❌ NEVER put feature modules directly in `js/` folder**

---

### 🔧 Scripts
| Script Type | Location |
|-------------|----------|
| DB maintenance | `scripts/maintenance/` |
| Test utilities | `scripts/testing/` |
| One-off migrations | `scripts/migrations/` |

**❌ NEVER put scripts in project root**

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Routes | `{entity}.routes.js` | `order.routes.js` |
| Components | PascalCase | `OrderCard.js` |
| Modules | camelCase | `checkout.js` |
| Tests | `*.test.js` or `*.spec.js` | `cart.test.js` |
| Services | `{entity}Service.js` | `emailService.js` |

---

## Pre-Commit Checklist

Before committing, verify:
- [ ] No new `.md` files at project root (move to `docs/`)
- [ ] No new `.js` files at `public/js/` root (move to `modules/`)
- [ ] No new route files at `server/routes/` that should be in `admin/`
- [ ] No database files at project root

---

## Enforcement

1. **Code Review**: Reject PRs that violate structure
2. **README**: Links to this file
3. **Agent Rules**: `.agent/rules/` contains structure rules

---

*Last Updated: January 18, 2026*

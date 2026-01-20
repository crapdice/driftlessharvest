# PostgreSQL Migration Plan

> **Status**: Planning  
> **Estimated Effort**: 20-30 hours  
> **Created**: 2026-01-19

## Executive Summary

The Harvest App currently uses SQLite (better-sqlite3). A PostgreSQL adapter exists but is unused. Migration requires refactoring ~50 files to use the repository pattern before a database switch is feasible.

---

## Current State Assessment

### What's Ready ✅
- `PostgresAdapter.js` (124 lines) - Interface complete
- `DatabaseAdapter.js` - Base abstraction defined
- Async method signatures in adapter
- Placeholder conversion (`?` → `$n`)
- Date function conversion

### What's Blocking 🔴
| Issue | Scope | Impact |
|-------|-------|--------|
| Direct `db.prepare()` calls | 50+ files | High |
| Only UserRepository exists | Need 5+ more | High |
| Sync operations assumed | All routes | Medium |
| SQLite-specific syntax | Migrations | Low |

---

## Migration Phases

### Phase 1: Repository Layer (8-12 hours)

Create repositories for all major entities to abstract database access.

#### 1.1 OrderRepository
```
server/repositories/OrderRepository.js
```
- `findAll(filters?)` - Get all orders with optional filters
- `findById(id)` - Get single order with items
- `create(orderData)` - Create order
- `update(id, data)` - Update order
- `updateStatus(id, status)` - Quick status update
- `getOrderItems(orderId)` - Get line items

#### 1.2 ProductRepository
```
server/repositories/ProductRepository.js
```
- `findAll(includeArchived?)` - Get products
- `findById(id)` - Get single product
- `create(data)` - Create product
- `update(id, data)` - Update product
- `updateStock(id, quantity)` - Adjust inventory
- `archive(id)` - Soft delete

#### 1.3 BoxTemplateRepository
```
server/repositories/BoxTemplateRepository.js
```
- `findAll()` - Get all templates
- `findById(id)` - Get template with items
- `create(data)` - Create template
- `update(id, data)` - Update template
- `delete(id)` - Remove template

#### 1.4 DeliveryWindowRepository
```
server/repositories/DeliveryWindowRepository.js
```
- `findAll()` - Get all windows
- `findActive()` - Get active windows only
- `create(data)` - Create window
- `toggle(id)` - Toggle active state
- `delete(id)` - Remove window

#### 1.5 AddressRepository
```
server/repositories/AddressRepository.js
```
- `findByUserId(userId)` - Get user addresses
- `create(data)` - Create address
- `update(id, data)` - Update address
- `delete(id)` - Remove address

---

### Phase 2: Route Migration (8-12 hours)

Replace direct `db.prepare()` calls with repository methods.

#### Priority Order:
1. `admin/orders.routes.js` → Use OrderRepository
2. `admin/products.routes.js` → Use ProductRepository
3. `admin/delivery.routes.js` → Use DeliveryWindowRepository
4. `admin/box-templates.routes.js` → Use BoxTemplateRepository
5. `product.routes.js` → Use ProductRepository
6. `order.routes.js` → Use OrderRepository
7. `cart.routes.js` → Use CartRepository
8. `payment.routes.js` → Use OrderRepository + PaymentRepository

#### Migration Pattern:
```javascript
// Before
const orders = db.prepare('SELECT * FROM orders WHERE status = ?').all(status);

// After
const orders = await orderRepository.findAll({ status });
```

---

### Phase 3: Async Compliance (2-4 hours)

Ensure all database operations use `async/await`.

#### Files to audit:
- All route handlers must be `async`
- All repository calls must be `await`ed
- Transaction callbacks must be async

#### Verification:
```bash
# Find non-awaited repository calls
grep -r "Repository\." --include="*.js" | grep -v "await"
```

---

### Phase 4: PostgreSQL Schema (2-3 hours)

#### 4.1 Create PostgreSQL-specific migrations
```
server/db/migrations/pg/
├── 001_initial_schema.sql
├── 002_indexes.sql
└── 003_seed_data.sql
```

#### 4.2 Key Differences to Handle
| SQLite | PostgreSQL |
|--------|------------|
| `INTEGER PRIMARY KEY` | `SERIAL PRIMARY KEY` |
| `AUTOINCREMENT` | `SERIAL` |
| `TEXT` | `VARCHAR(n)` or `TEXT` |
| `datetime('now')` | `NOW()` |
| `PRAGMA foreign_keys=ON` | Default enabled |

---

### Phase 5: Testing & Deployment (2-3 hours)

#### 5.1 Local Testing with Docker
```bash
docker run -d \
  --name harvest-postgres \
  -e POSTGRES_PASSWORD=harvest123 \
  -e POSTGRES_DB=harvest \
  -p 5432:5432 \
  postgres:16
```

#### 5.2 Environment Configuration
```env
# .env.production
DATABASE_TYPE=postgres
DATABASE_URL=postgres://user:pass@host:5432/harvest
```

#### 5.3 Adapter Switch
```javascript
// server/db/index.js
const adapter = process.env.DATABASE_TYPE === 'postgres'
  ? new PostgresAdapter(pool)
  : new SqliteAdapter(db);

module.exports = adapter;
```

---

## Verification Checklist

- [ ] All repositories created and tested
- [ ] No direct `db.prepare()` calls in routes
- [ ] All route handlers are async
- [ ] PostgreSQL migrations work on fresh DB
- [ ] Data migration script tested (SQLite → PostgreSQL)
- [ ] Performance benchmarks pass
- [ ] Rollback procedure documented

---

## Risk Mitigation

### High-Risk Areas
1. **Payment transactions** - Must be atomic, test thoroughly
2. **Order creation** - Multiple tables, complex logic
3. **Inventory updates** - Race conditions possible

### Rollback Strategy
1. Keep SQLite as default for 2 weeks post-migration
2. Feature flag for database selection
3. Data sync script to keep both in sync during transition

---

## Dependencies

```bash
npm install pg           # PostgreSQL client
npm install pg-hstore    # Optional: for JSON fields
```

---

## Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | Phase 1 | All repositories created |
| 2 | Phase 2 | Routes migrated |
| 3 | Phase 3-4 | Async compliance + PG schema |
| 4 | Phase 5 | Testing + deployment |

**Total: 4 weeks part-time / 1 week full-time sprint**

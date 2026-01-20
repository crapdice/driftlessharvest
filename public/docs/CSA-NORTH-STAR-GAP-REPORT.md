# North Star Gap Report: Harvest CSA Platform

This report assesses the current platform's readiness against the "North Star" vision of a fully smoothly running CSA (Community Supported Agriculture) operation.

## 📊 Summary Assessment
The platform has a **world-class administrative core** (Orders, CRM, Inventory) but currently operates as a **tactical e-commerce store** rather than a **strategic CSA subscription engine**.

| Pillar | Status | Distance to North Star |
| :--- | :--- | :--- |
| **Subscription Engine** | 🔴 20% | Lacks recurring billing and "Share Size" logic. |
| **Member Customization** | 🟡 40% | Box templates exist, but no "You-Choose" member UI. |
| **Operations (Pick Tickets)**| 🔴 10% | No automated harvest/packing list generation. |
| **Member Engagement** | 🟡 50% | Email infrastructure (Resend) is ready, but templates are missing. |
| **E-commerce Storefront** | 🟢 80% | Functional storefront exists, needs "2026 Admin" aesthetic parity. |

---

## 🛠️ Detailed Gap Analysis

### 1. The Subscription Engine (The "Heart")
- **Vision**: Automated recurring Billing + Seasonal Front-payments.
- **Current State**: We only use Stripe `PaymentIntents` (one-off).
- **Required**:
    - [ ] `subscriptions` table to track cycle, next delivery, and status.
    - [ ] Integration with Stripe `Subscriptions` API.
    - [ ] Logic for "Seasonal Prepayment" (Account Balance).

### 2. Member Customization ("You-Choose" Model)
- **Vision**: Members customize box contents before delivery.
- **Current State**: `box_templates` are defined by Admins and static in the cart.
- **Required**:
    - [ ] "Weekly Draft" system: Create draft orders for all active subscribers 7 days prior.
    - [ ] Member Portal view: "Customize Your Box" (Drag-and-drop items from current inventory).
    - [ ] Inventory lock/sync for customization windows.

### 3. Operational Excellence (The "Hands")
- **Vision**: Click a button, get a Packing List (Pick Ticket).
- **Current State**: Manual order viewing.
- **Required**:
    - [ ] `/api/admin/pick-tickets` endpoint (grouped by delivery area).
    - [ ] Print-optimized thermal label/sheet layout.
    - [ ] "Harvest List" generator (Sum of all items across all orders for a day).

### 4. Professional Storefront (The "Face")
- **Vision**: Modern, high-end, premium feel matching the new Admin UI.
- **Current State**: Uses a standard (Nature/Sketch) theme. Functional but not "Wowed."
- **Required**:
    - [ ] Re-theme storefront with Glassmorphism and the 2026 design system.
    - [ ] Embed "Momentum" indicators (e.g., "78% Box Slots Filled").

---

## 🚀 Recommended Implementation Roadmap

1. **Sprint 1: The Core Logic**: Implement the `subscriptions` schema and Stripe Recurring bridge.
2. **Sprint 2: The Member Portal**: Implement the "Account Dashboard" and "Box Customizer."
3. **Sprint 3: Operational Flux**: Implement Pick Ticket and Harvest List generation.
4. **Sprint 4: 2026 Storefront**: Full UI/UX refresh of the public-facing site.

[ARCHITECTURAL_HYPOTHESIS]: Moving to a "Draft Order" pattern—where the system generates an order 1 week out which stays "mutable" until the cutoff—is the most robust way to handle "You-Choose" customization while maintaining inventory integrity.

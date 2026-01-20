# Blueprint: Admin Header Prototypes

This blueprint outlines the strategy for creating a modular, scalable, and high-performance header system for the Harvest Admin. The focus is on decoupling UI elements into independent widgets and providing a unified "Command Center" experience.

## Design Philosophy: "Context Over Clutter"
In 2026, the header should be a dynamic layer that adapts to the current task. It should prioritize speed (instant search) and awareness (real-time alerts) without overwhelming the user.

## Technical Architecture [ARCHITECTURAL_HYPOTHESIS]
I will implement a **Main Header Component** that acts as a container for **Header Widgets**. This allows for extreme scale—adding a "Multi-language" or "Market Status" widget becomes a matter of registering a new module rather than re-templating the header.

## Prototype Variations

| Prototype | Name | Core Feature | UX Focus |
| :--- | :--- | :--- | :--- |
| 1 | **Glassmorphic Command** | Omnisearch + AI Rails | Unified Task Entry |
| 2 | **Minimal Context** | Breadcrumb Dominance | Navigation Clarity |
| 3 | **Modular Utility** | Dynamic Status Badges | Operational Awareness |

---

### Prototype 1: Glassmorphic Command center
- **Feature**: Centered "Omnisearch" (Command + K) with integrated AI status hints.
- **Aesthetic**: Translucent background (Glassmorphism), sleek micro-animations on search focus.
- **Workflow**: Searching "John Doe" immediately shows CRM shortcuts; searching "Heirloom" shows stock levels.

### Prototype 2: Minimal Context
- **Feature**: Large Page Title + Interactive Breadcrumbs. Use of "Context Gauges" (tiny sparklines or progress bars in the header).
- **Aesthetic**: High white-space, border-bottom only, minimalist typography (Outfit/Inter).
- **Workflow**: As you drill into an Order, the breadcrumbs expand, and a "Order Priority" gauge appears in the header.

### Prototype 3: Modular Utility
- **Feature**: A "Dashboard-in-Header" approach. Customizable widgets on the right side: Notification Pulse, Low-Stock Ticker, Active Fleet count.
- **Aesthetic**: Actionable buttons with count badges, slide-out panels for each widget.
- **Workflow**: Clicking the "Logistics" badge in the header shows a mini-map overlay of current deliveries.

---

## Verification & Integration
- Each prototype will be a standalone HTML file in `/public/admin/prototypes/header/`.
- They will use `shared.css` and a dedicated `header-prototypes.css`.
- The `index.html` (Prototype Index) will be updated to link these.
- **Architectural Goal**: Define a `Header.js` constructor that can initialize these layouts programmatically.

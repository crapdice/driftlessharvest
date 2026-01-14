# Harvest App - Premium Feature List
**Technical Highlights & White-Label Capabilities**

This document outlines the advanced features implemented in the Harvest App, demonstrating its value as a robust, commercially viable e-commerce platform for local food systems.

## 🌟 Unique Selling Points

### 1. Smart Box Inventory (Auto-Management)
*   **Logic**: Curated boxes (bundles) are not treated as static inventory. Instead, their availability is dynamically calculated in real-time based on the stock levels of their individual components.
*   **Benefit**: Eliminates the need for manual "box inventory" management. If you run out of Apples, the "Fruit Box" automatically disables itself. When you restock Apples, it automatically re-enables.
*   **UX**: Boxes visually update to "Grayed Out / Unavailable" instantly, preventing user frustration and overselling.

### 2. Atomic Inventory Reservations
*   **Logic**: The system uses strict database transactions when items are added to the cart. Stock is "reserved" immediately, not just when the order is placed.
*   **Benefit**: Prevents "race conditions" where two users buy the last item simultaneously. If it's in a user's cart, it's guaranteed to be yours for the session duration.

### 3. Comprehensive Admin Dashboard
*   **Unified Control**: A single, secure panel to manage Orders, Customers, Inventory, Products, and Delivery Schedules.
*   **Smart Search**: Real-time filtering for **Customers** (by name, email, phone) and **Orders** (by ID, customer, status), enabling instant retrieval of records.
*   **Intelligent Inventory Alerts**:
    *   **Live Stock Indicators**: Color-coded badges (Green/Yellow/Red) for stock levels.
    *   **Box Health Monitoring**: Curated boxes automatically flag themselves if any constituent item is Out of Stock, Inactive, or Deleted.
    *   **Granular Diagnostics**: Hover-tooltips reveal exactly why a box is flagged (e.g., `(Stock: 0)` or `(Inactive)`), ensuring rapid troubleshooting.
*   **Active Cart Monitoring**: Real-time view of what logged-in users currently have in their carts.
*   **Data Visualization**: Real-time stats on Revenue, Order Counts, and Pending Deliveries.
*   **Day-View Scheduling**: Interactive calendar to view orders grouped by specific delivery days.

### 4. Dynamic Order Management
*   **JSON-Based Persistence**: Order details (Customer Name, Address, Delivery Window) are snapshotted at the time of purchase. Even if a user changes their profile address later, the historical order record remains accurate.
*   **Status Tracking**: Simple workflow to track orders from "Pending" to "Out for Delivery" to "Delivered".

### 5. Role-Based Access Control (RBAC)
*   **Security**: Secure JWT (JSON Web Token) authentication with distinct roles:
    *   **Shopper**: Can browse, buy, and view their own history.
    *   **Admin**: Can manage day-to-day operations (products, orders).
    *   **Super Admin**: Full system control, including managing other admins and sensitive configurations.
*   **Auto-Redirects**: Unauthorized access attempts (e.g., a shopper trying to view the Admin Panel) are gracefully caught and redirected to login.

### 6. User-Centric Checkout Experience
*   **Streamlined Flow**: Three-step checkout (Schedule -> Address -> Payment) on a single page.
*   **Smart Pre-filling**: Automatically populates known user details (Name, Address, Email) to reduce friction.
*   **Order Summary**: Sticky sidebar providing a constant view of the cart total and items during the checkout process.

### 7. Responsive Modern UI
*   **Mobile-First**: Fully responsive design that works seamlessly on desktops, tablets, and mobile phones.
*   **Bento Grid Layout**: A premium, magazine-style layout for featured products that adapts intelligently to the number of items (Smart Grid).
*   **Visual Feedback**: Loading states, toast notifications, and glassmorphic hover effects for a high-end feel.
*   **Admin UX**: Expandable inputs and "edit-in-place" feel for long-form content.

### 8. Custom "Curated Box" Engine
*   **Flexible Templates**: Admins can easily create new box types (e.g., "Veggie Lover's", "Fruit Sampler") by mixing and matching existing products.
*   **Detailed Views**: Users can inspect the exact contents of a box before buying, ensuring transparency.

---
*This platform is designed to be easily rebranded and deployed for any CSA (Community Supported Agriculture), local grocer, or subscription box service.*

### 9. System Stability & Automated Testing 🛡️
*   **Data Validation Contract**: The system employs a "Shared Model" architecture (`js/models.js`) to strictly enforce data integrity laws (e.g., "All orders MUST have a ZIP code") before they ever reach the database.
*   **Built-in Smoke Tests**: A dedicated test suite (`npm test`) verifies critical business logic automatically. It simulates complex user scenarios (like missing fields or invalid inputs) to ensure the application rejects bad data instead of crashing.
*   **Zero-Crash Policy**: This "Defense in Depth" strategy ensures the Admin Panel remains stable even if a frontend developer introduces a bug in the UI.
*   **Modular Backend Architecture**: The server logic is split into dedicated route handlers (`auth`, `products`, `orders`), ensuring that features can be developed in isolation without causing regressions in other parts of the system.

### 10. Enhanced Order Lifecycle & Payments 💳
*   **Granular Status Logic**: Orders track detailed states including `Pending Payment`, `Payment Failed`, `Paid`, `Packed`, `Shipped`, `Delivered`, and `Canceled`.
*   **Payment Integrity**: The system captures and stores the full, raw payment intent from the payment processor (Stripe) in a dedicated ledger, ensuring complete auditability of every transaction.
*   **Smart Status Displays**: The Admin UI maps internal codes to human-readable statuses (e.g., `'Paid'` displays as "Paid - Pending Packing") with distinct color-coded badges for instant visual recognition.

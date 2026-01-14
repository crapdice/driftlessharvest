# Application Flow Diagram

This diagram visualizes the high-level user flows and system interactions within the Harvest App.

```mermaid
graph TD
    %% Actors
    User([Visitor/Customer])
    Admin([Administrator])
    System[(Backend / Database)]

    %% Subgraph: Public Storefront
    subgraph Storefront [Public Storefront]
        Home[Home Page]
        Products[Product List / Bento Grid]
        Cart[Shopping Cart]
        Auth[Login / Signup]
        Checkout[Checkout Wizard]
        Confirmation[Order Confirmation]
    end

    %% Subgraph: Admin Panel
    subgraph AdminPanel [Admin Panel]
        Dashboard[Dashboard & Active Carts]
        ProdMgmt[Product Management]
        InvMgmt[Inventory Management]
        OrderMgmt[Order Management]
        Config[Site Configuration]
    end

    %% User Flow
    User -->|Visits| Home
    Home -->|Browses| Products
    Products -->|Adds Item| Cart
    Cart -->|Reviews| Checkout
    Checkout -->|Submits Order| Confirmation
    User -.->|Log In| Auth

    %% Admin Flow
    Admin -->|Log In| Auth
    Auth -->|Redirect (Role=Admin)| Dashboard
    Dashboard -->|Manages| ProdMgmt
    Dashboard -->|Manages| InvMgmt
    Dashboard -->|Tracking| OrderMgmt
    Dashboard -->|Edit Site| Config

    %% Data Flow
    Cart -->|Syncs| System
    Checkout -->|POST Order| System
    Auth -->|POST Credentials| System
    
    ProdMgmt -->|CRUD Products| System
    InvMgmt -->|Update Stock| System
    Config -->|Save API/Config| System
    
    %% Real-time Updates
    System -.->|Polling Updates| Dashboard
    System -.->|Stock Levels| Products
```

## Key Flows

### 1. Customer Journey
1.  **Discovery**: User lands on Home, views Featured Products (Bento Grid).
2.  **Shopping**: Adds items to Cart. Cart state is persisted in `localStorage` and synced to Backend.
3.  **Checkout**: Enters "Wizard" flow.
    *   **Step 1**: Delivery Schedule selection.
    *   **Step 2**: Shipping Address.
    *   **Step 3**: Payment/Confirmation.
4.  **Completion**: Order is saved to Database; Inventory is deducted.

### 2. Admin Workflow
1.  **Monitoring**: views `Active Carts` and `Revenue Stats` on Dashboard.
2.  **Inventory**: Toggles item availability; updates Box Templates.
3.  **Fulfillment**: Views Orders grouped by Delivery Window; prints packing slips (future).
4.  **Configuration**: Updates Site Title, Featured Items, and Messages via Settings.

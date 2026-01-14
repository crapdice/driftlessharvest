# Admin API Documentation

Base URL: `/api/admin`
Auth: Bearer Token required (`Authorization: Bearer <token>`)

## Orders

### Get All Orders
*   **GET** `/orders`
*   **Response**: `Array<Order>` (Includes normalized user, address, and payment info)
*   **Notes**: Items are parsed from normalized tables or fallback JSON.

### Update Order Status
*   **PUT** `/orders/:id/status`
*   **Body**: `{ status: "Paid" | "Packed" | "Shipped" | ... }`
*   **Returns**: `{ success: true, timestamps: { ... } }`

### Update Order Details
*   **PUT** `/orders/:id`
*   **Body**: `{ items: [], shipping_details: {}, status? }`
*   **Notes**: Recalculates total based on items.

### Sync Payment (Manual)
*   **POST** `/sync-payment/:id`
*   **Description**: Checks Stripe API for this order's payment intent and updates status to `Paid` if successful.

## Delivery

### Get Schedule
*   **GET** `/delivery-schedule`
*   **Response**: `[{ date: "Tuesday", count: 5 }, ...]`
*   **Notes**: Counts orders with status `Pending`, `Paid`, or `Packed`.

### Get Windows
*   **GET** `/delivery-windows`
*   **Response**: `Array<DeliveryWindow>`

### Manage Windows
*   **POST** `/delivery-windows` - Create `{ date_label, date_value }`
*   **PUT** `/delivery-windows/:id` - Update `{ is_active }`
*   **DELETE** `/delivery-windows/:id`

## Users

*   **GET** `/users` - List all users
*   **POST** `/users` - Create user
*   **PUT** `/users/:id` - Update user role/address
*   **DELETE** `/users/:id` - Delete user (Super Admin only)

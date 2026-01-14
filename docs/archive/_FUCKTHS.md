Order Status \& Display Logic for Admin Panel



Payment Failed:

Status Code: Payment Failed

Display: Red Badge ("Payment Failed") + Red Icon

Context: Occurs when Stripe webhook returns payment\_failed.

Paid (Success):

Status Code: Paid

Display: Green Badge ("Paid - Pending Packing")

Detail View:

Top: Green "Paid \[Date]" line with PID: \[Last 8 chars].

Bottom: Blue "Scheduled: \[Delivery Window]" line.

Fulfillment States (Blue/Indigo variants):

Packed → Badge: "Order Packed" | Detail: "Packed on \[Date]"

Shipped → Badge: "Order Shipped" | Detail: "Shipped on \[Date]"

Delivered → Badge: "Order Delivered" | Detail: "Delivered on \[Date]"

Canceled:

Canceled → Badge: "Order Canceled" (Red) | Detail: "Cancelled on \[Date]"


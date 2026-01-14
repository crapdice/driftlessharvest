# Stripe Integration Walkthrough

The Stripe payment integration is complete. The application now uses an optimistic inventory model where stock is checked upon adding to cart but only reserved when a Payment Intent is created at checkout.

## Changes Summary

### 1. Inventory Logic Refactor
- **Optimistic Cart**: Items are no longer reserved immediately when added to cart. This fixes the "zombie inventory" issue.
- **Backend**: `POST /api/cart/reserve` replaced with `/api/cart/check-stock`.
- **Frontend**: `actions.js` updated to check stock before adding to local state.

### 2. Stripe Backend (`server/routes/payment.routes.js`)
- **New Endpoint**: `POST /api/create-payment-intent`
    - Calculates total from database prices.
    - **Reserves Stock** (transactional).
    - Creates "Pending Payment" Order.
    - Returns `clientSecret` and `orderId`.
- **New Endpoint**: `POST /api/webhook`
    - Listens for `payment_intent.succeeded` -> Marks Order `Pending` (Paid).
    - Listens for `payment_intent.canceled` / `failed` -> Cancels Order and **Releases Stock**.

### 3. Stripe Frontend
- **UI**: `checkout.js` now renders a Stripe Payment Element container.
- **Logic**: `actions.js` initializes Stripe Elements when the checkout page loads (via `router.js` hook).
- **Checkout Flow**: `placeOrder` now calls `stripe.confirmPayment` instead of directly hitting the order API.

## Setup Instructions

> [!IMPORTANT]
> You must add your Stripe API keys to the `.env` file for the integration to work.

1.  **Get Stripe Keys**: Go to your Stripe Dashboard (Developers > API Keys).
2.  **Update `.env`**:
    ```env
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_PUBLISHABLE_KEY=pk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```
3.  **Restart Server**: Stop and start the Node server to load the new environment variables.

## How to Test

1.  **Add to Cart**: Add an item. Verify no error and item appears in cart.
2.  **Checkout**: Navigate to Checkout. You should see the Stripe Payment Element loading (Test Mode card input).
3.  **Pay**: Enter a test card (e.g., `4242 4242 4242 4242`) and any future date/CVC.
4.  **Verify**:
    - You should be redirected to the Dashboard/Success screen.
    - Check the Admin Panel or Database: Order should be "Pending" (Paid).
    - Check Inventory: Item stock should be decremented.

## Rollback
If you need to revert, restore the previous `cart.routes.js`, `actions.js`, and `checkout.js` from git history.


## API Sandbox

Testing Credentials
Since the form is active and asking for a card, use the official Stripe Test Card:

Field	Value
Card Number	4242 4242 4242 4242
Expiration	Any future date (e.g., 12/30)
CVC	Any 3 digits (e.g., 123)
ZIP Code	Any valid ZIP (e.g., 54665)
 
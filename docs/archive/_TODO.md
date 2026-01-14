# Project Roadmap & Todo

**CURRENT STABLE VERSION**: `v1.1-stable` (Commit `575530d`)
*System Stability Phase 2 Complete (Database Normalization & Extended Schema)*

## Phase 1: Codebase Health (Refactoring)
- [ ] **Modularize Frontend**: Break `script.js` (1.4k lines) into ES Modules (`api.js`, `cart.js`, `router.js`, `views/*.js`).
- [ ] **Extract Admin Logic**: Move embedded JS from `public/admin/index.html` (2k lines) into `public/admin/js/admin.js`.
- [ ] **Standardize HTML Generation**: Create helper functions for common UI components to reduce HTML-in-string complexity.
- [x] **Refactor Backend**: Split monolithic `server.js` into modular routes and controllers (`server/*.js`).

## Payment & Checkout
- [ ] **Implement Payment Gateway (Stripe)**: Replace the simulated checkout with real credit card processing using Stripe.
- [ ] **Order Confirmation Emails**: Send transactional emails upon successful order placement (e.g., SendGrid/Mailgun).

## Authentication & Security
- [ ] **Email Verification**: Implement email verification on sign-up to prevent fake/spam accounts.
- [ ] **Secure Session Storage**: Migrate from `localStorage` to `HttpOnly` cookies for JWT storage to prevent XSS attacks.
- [ ] **Rate Limiting**: Implement rate limiting on API endpoints to prevent abuse (DDoS protection).
- [ ] **Input Validation**: Add a robust validation layer (e.g., Zod or Joi) to all backend API endpoints to prevent invalid data/injection.

## Admin Features
- [ ] **Image Upload Management**: Implement file upload/storage (S3 or local) for product images instead of using external URLs.
- [ ] **Local Image Caching**: Script to download and serve current external (Unsplash) images locally to improve performance and reliability.
- [ ] **Archive Orders**: Ability to archive orders, removing them from the main view (only 'Canceled' and 'Delivered' status).
- [ ] **Inventory History (Audit Logs)**:
    - [ ] **Schema**: Create `inventory_logs` table (`id`, `product_id`, `change_amount`, `new_stock`, `reason`, `created_at`).
    - [ ] **Logic**: Update `reserve`/`release` endpoints to insert a log record for every stock change.
    - [ ] **API**: Endpoint `/api/inventory/logs/:productId` to fetch history.
    - [ ] **UI**: Add a "History" tab in the Admin Product Editor to show a timeline of stock changes (Checking who changed it and when).

## Infrastructure & Testing
- [ ] **Automated Testing**: Set up a test runner (Jest/Supertest) for API integration tests.
- [ ] **Production Config**: Create Dockerfile or environment config for production deployment.

## Design & Experience (Suggestions)
- [ ] **Micro-interactions**: Add subtle hover animations to product cards and "Add to Cart" buttons to make the interface feel "alive".
- [ ] **Storytelling Elements**: Add a "Meet the Farmer" section with high-quality images and a short bio to build trust.
- [ ] **Visual Freshness**: Use a "Bento Grid" layout for the "Fresh this Week" section to modernize the look.
- [ ] **Category Pills**: Update product tags to be pill-shaped with earthy/vibrant colors (completed in recent updates).

## SEO & Discoverability (Suggestions)
- [ ] **Local Schema Markup**: Add `LocalBusiness` and `Product` JSON-LD schema to `index.html` to help Google understand the business location and offerings.
- [ ] **Landing Pages**: Create specific landing pages for delivery zones (e.g., "/delivery/viroqua") to capture local search traffic.
- [ ] **Blog/Recipes**: Add a simple blog section for "Seasonal Recipes" using the current week's box ingredients.

## AI Features (Suggestions)
- [ ] **AI Recipe Generator**: Implement a feature where users can click "What can I cook with this box?" and get an AI-generated recipe using the box's current contents.
- [ ] **Smart Substitutions**: Use AI to suggest similar products if a user's favorite item is out of stock.

## Feature: Gift Shop
- [ ] **New Category**: Create a unique product category code `gift-shop` for non-perishable items.
- [ ] **Navigation**: Add "Gift Shop" to the main navigation menu `CONFIG.navigation`.
- [ ] **Dedicated View**: Create `renderGiftShop()` to display these items separately from the main produce marketplace.
- [ ] **Inventory Sync**: Ensure "Add to Cart" uses `addProductToCart` to reserve inventory via backend API.
- [ ] **Product Inventory**: Add initial inventory to `server/data/products.json`:
    - 12oz Jar of Local Honey
    - Hand-Crafted Beeswax Candle
    - Organic Maple Syrup (Vernon County)
    - Handmade Lavender Soap
    - Amish-made Woven Basket
    - Local Fruit Preserves/Jams

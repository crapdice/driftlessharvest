# User Input Audit

This document identifies all areas where user input is captured, processed, or stored within the Harvest App system. It serves as a reference for future sanitation and security enhancement tasks.

## 1. Admin Panel Configuration
**Site Area**: `/admin` -> Configuration Tab
**Handling File**: `public/admin/js/modules/settings.js` & `layouts.js`

| Input Element ID | Description | Storage/Destination |
| :--- | :--- | :--- |
| `cfg-feat-title` | Featured Section Title | `config.meta.featuredTitle` -> `/api/config` |
| `cfg-feat-subtitle` | Featured Section Subtitle | `config.meta.featuredSubtitle` -> `/api/config` |
| `cfg-feat-bento` | Bento Grid Toggle (Checkbox) | `config.meta.useBentoGrid` -> `/api/config` |
| `cfg-feat-tooltips` | Box Tooltips Toggle (Checkbox) | `config.meta.showBoxTooltips` -> `/api/config` |
| `cfg-feat-[1-6]` | Featured Product Slots (Select) | `config.home.featured_items` -> `/api/config` |
| `cfg-inv-alert` | Inventory Alert Threshold | `config.meta.inventoryAlertLevel` -> `/api/config` |
| `cfg-how-title` | "How it Works" Title | `config.pages.howItWorks` -> `/api/config` |
| `cfg-how-steps` | "How it Works" Steps (Multiline) | `config.pages.howItWorks.paragraphs` -> `/api/config` |
| `inp-hero-head` | Hero Headline | `config.pages.home.hero` -> `/api/config` |
| `inp-hero-sub` | Hero Subheadline | `config.pages.home.hero` -> `/api/config` |
| `inp-hero-cta` | Hero CTA Text | `config.pages.home.hero` -> `/api/config` |
| `inp-anno-text` | Announcement Bar Text | `config.announcement` -> `/api/config` |
| `inp-farmer-voice` | Farmer's Note | `config.business.farmerVoice` -> `/api/config` |
| `inp-trust-signals` | Trust Signals (Multiline) | `config.business.trustSignals` -> `/api/config` |
| `cm-style-padding` | Layout Padding Preference | `config.theme` -> `/api/config` |
| `cm-style-bg` | Background Style | `config.theme` -> `/api/config` |

## 2. Admin Entity Management
**Site Area**: `/admin` -> Users, Products, Inventory Tabs
**Handling Files**: `public/admin/js/modules/users.js`, `products.js` (legacy/module)

### User Management
| Input Element ID | Description | Storage/Destination |
| :--- | :--- | :--- |
| `u-email` | User Email | `POST /api/admin/users` or `PUT` |
| `u-password` | User Password | `POST /api/admin/users` (hashed backend) |
| `u-role` | User Role (Select) | `POST /api/admin/users` |
| `u-phone` | Phone Number | `POST /api/admin/users` |
| `u-address`, `u-city`, `u-state`, `u-zip` | Address Fields | `POST /api/admin/users` |

### Product Management
| Input Element ID | Description | Storage/Destination |
| :--- | :--- | :--- |
| `p-name` | Product Name | `POST /api/admin/products` |
| `p-price` | Product Price | `POST /api/admin/products` |
| `p-stock` | Stock Level | `POST /api/admin/products` |
| `p-image` | Image URL | `POST /api/admin/products` |
| `p-tags` | Product Tags | `POST /api/admin/products` |

## 3. Authentication
**Site Area**: Login / Signup Modals
**Handling Files**: `public/admin/js/modules/app.js` (Admin), `js/modules/auth.js` (Customer)

| Input Element ID | Description | Storage/Destination |
| :--- | :--- | :--- |
| `login-email` | Admin Login Email | `POST /api/auth/login` |
| `login-password` | Admin Login Password | `POST /api/auth/login` |
| `signup-email` | Customer Signup Email | `POST /api/auth/signup` |
| `signup-password` | Customer Signup Password | `POST /api/auth/signup` |

## 4. Customer Shopping & Persistence
**Site Area**: Storefront
**Handling Files**: `js/modules/actions.js`, `js/views/wizard.js`

| Input / Action | Description | Storage/Destination |
| :--- | :--- | :--- |
| `addToCart()` | Adding items to cart | `localStorage.getItem('harvest_cart')` |
| Wizard Preferences | Onboarding survey answers | `localStorage.setItem('harvest_preferences')` |
| Auth Token | JWT for session | `localStorage.setItem('harvest_token')` |
| Cached User Data | User profile subset | `localStorage.setItem('harvest_user')` |

## 5. Security Notes
-   **Local Storage**: Sensitive tokens and user details are stored in `localStorage`. Cross-Site Scripting (XSS) could expose these.
-   **Config Injection**: The configuration allows raw strings (titles, paragraphs). If these are rendered with `innerHTML` without sanitization, it is an XSS vector.
-   **Image URLs**: Admin inputs for image URLs (`p-image`, `t-image`) are often rendered directly into `src` attributes or `style="background-image: url(...)"`. Malicious URLs could be used here.

# Driftless Harvest Web App

**Version**: `v1.5-stable`
A maintainable web application for a local food operation in Viroqua, Wisconsin.

## Purpose

1.  **Explain**: What we grow, how it works, and expectations.
2.  **Sell**: Box Builder interface for customizing orders.
3.  **Manage**: Admin panel for inventory, orders, and content.

👉 **[View Full Feature Manifest](./_FEATURES.md)**

👉 **[Project Structure Guide](./STRUCTURE.md)** - Read before adding files

## Deployment (Railway)

We use **Railway** to host this application because it supports our backend database and API.

👉 **[Read the Step-by-Step Deployment Guide](./_DEPLOYING_TO_RAILWAY.md)**

## Technical Overview

-   **Frontend**: Modular ES6 Architecture.
    -   `js/modules/orders/`: MVC structure for the Orders tab.
    -   `js/modules/api.js`: Centralized API Client.
-   **Backend**: Node.js + Express (Modular Route/Controller Architecture).
-   **Database**: SQLite (`harvest.db`) managed by **Strict Migrations**.
    -   See `server/db/migrations/` for schema history.
    -   Run `node scripts/maintenance/make_migration.js <name>` to create changes.
-   **Auth**: JWT-based authentication.

## How to Edit Content

Most business content (prices, box descriptions, availability) can be edited via the **Admin Panel** (`/admin`) or directly in `server/data/config.json`.

## Local Development

1.  Install Node.js (v18+).
2.  Run `npm install`.
3.  Run `npm start`.
4.  Open `http://localhost:3000`.

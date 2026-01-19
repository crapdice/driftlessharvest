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
    -   `js/modules/`: Domain-specific UI controllers (Products, Orders, Gemini).
    -   `js/services/`: Pure API clients (centralized logic and authentication).
    -   `js/core/`: Application-wide background services (Inventory Alerts).
-   **Backend**: Node.js + Express (Modular Route/Controller Architecture).
-   **Database**: SQLite (`harvest.db`) managed by **Strict Migrations**.
-   **AI Integration**: Google Gemini API for generative content and vision tasks.

## AI Capabilities (Gemini)

This application uses **Google Gemini 2.5 Flash** and **Imagen 3** to provide premium administrative tools:

1.  **Image Enhancement**: High-fidelity re-rendering of product and packaging images using Imagen 3, guided by artistic analysis from Gemini Flash.
2.  **Vision-Based Generation**: Creative context-aware text generation. The AI "sees" the product image when suggesting names or writing appetizing descriptions.
3.  **Artisanal Branding**: Curated "Expert Personas" for prompt engineering to ensure all generated content aligns with the Harvest premium farm-to-table brand.

👉 **[Evaluate Image Enhancement Quality](./public/admin/enhance-demo.html)** (Admin required)

## How to Edit Content

Most business content (prices, box descriptions, availability) can be edited via the **Admin Panel** (`/admin`) or directly in `server/data/config.json`.

## Local Development

1.  Install Node.js (v18+).
2.  Run `npm install`.
3.  Run `npm start`.
4.  Open `http://localhost:3000`.

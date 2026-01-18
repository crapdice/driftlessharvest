# Marketing & A/B Testing Integration Documentation

This document outlines the connection points between the Marketing Portal / A/B Testing suite and the core Driftless Harvest codebase.

## Backend Integration Points

### 1. Server Routing (`server/app.js`)
- **A/B Router Interceptor**: Injected between static file middleware and core routes. It checks `config.json` for `launchModeEnabled`. If true, it intercepts requests to the root path (`/`) and serves the `activeLaunchVariant` from `public/previews/launching/`.
- **API Mounting**: The marketing-specific admin routes are mounted at `/api/admin/marketing`.

### 2. Database Schema (`server/db/migrations/`)
- **`035_create_launch_signups.js`**: Defines the `launch_signups` table to store emails, variants, IP addresses, and timestamps.
- **`036_add_utm_to_signups.js`**: Adds the `utm_source` column for referral attribution (e.g., `?source=facebook`).

### 3. Public API (`server/routes/general.routes.js`)
- **`POST /api/launch-signup`**: A public endpoint for capturing emails from the "Coming Soon" landing pages. Stores data directly in the `launch_signups` table.

### 4. Application Configuration (`server/data/config.json`)
- **`meta` Object**: Expanded to include:
    - `activeLaunchVariant`: String identifer of the current live landing page.
    - `launchModeEnabled`: Boolean flag controlling the root path interceptor.

## Frontend Integration Points

### 1. Launch Logic (`public/previews/launching/launch-logic.js`)
- A shared library used by all 6 design variants.
- **Attribution**: Captures `utm_source` or `source` from URL parameters.
- **Submission**: Communicates with the public `/api/launch-signup` endpoint.

### 2. Marketing Portal (`public/marketing/`)
- **`index.html`**: The "Growth Matrix" dashboard. Uses Tailwind CSS and the site's shared favicon.
- **`js/marketing.js`**: Contains the **[MARKETING ANALYTICS SILO]**. 
    - Isolated from main admin logic.
    - Uses the standard `api.js` module for authenticated requests.

### 3. Brand Assets
- **`public/favicon.svg`**: Replaced the default favicon across the entire site (including `public/index.html` and `public/admin/index.html`) for brand consistency.

## Siloing Strategy
All marketing-specific JavaScript logic in the portal is encapsulated within the `MARKETING_ANALYTICS` object in `marketing.js` and marked with `/* [MARKETING SILO] */` comments to ensure zero side-effects on core site functionality.

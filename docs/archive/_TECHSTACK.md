# Technology Stack

## Backend
*   **Runtime:** **Node.js** (v18+)
*   **Framework:** **Express.js** (v5.2.1) for the REST API.
*   **Database:** **SQLite** (using `better-sqlite3` v12.5.0). A robust, single-file relational database.
*   **Authentication:** **JWT** (JSON Web Tokens) for session management and **bcryptjs** for password hashing.
*   **Architecture:** RESTful API with route-based controllers.

## Frontend (Storefront & Admin)
*   **Framework:** **Vanilla JavaScript** (ES Modules). No heavy framework like React or Vue; the app relies on native browser modules and DOM manipulation.
*   **Styling:** **Tailwind CSS** (v3.x) loaded via CDN.
*   **Structure:** Single Page Application (SPA) architecture using client-side routing logic.

## Infrastructure
*   **Containerization:** **Docker** (Dockerfile present).
*   **Deployment:** Geared towards **Railway** (based on `DEPLOYING_TO_RAILWAY.md`).

# Deploying Driftless Harvest to Railway

This guide will help you deploy the Harvest App to [Railway.app](https://railway.app), a modern and simple hosting platform.

## Prerequisites

1.  A **GitHub Account** (https://github.com/).
2.  A **Railway Account** (created via GitHub).
3.  This code uploaded to a GitHub Repository.

---

## Step 1: Upload Code to GitHub
*(If you haven't done this yet)*

1.  Go to [GitHub.com](https://github.com) and sign in.
2.  Click the **+** icon (top right) -> **New repository**.
3.  Name it `harvest-app`.
4.  Select **Private** (to keep customer data safe).
5.  Click **Create repository**.
6.  Push your local code to this repository.

## Step 2: Create Project on Railway

1.  Go to [Railway.app](https://railway.app) and log in.
2.  Click **+ New Project**.
3.  Select **Deploy from GitHub repo**.
4.  Select your `harvest-app` repository.
5.  Click **Deploy Now**.

Railway will detect `package.json` and automatically build the Node.js application.
*Note: Ensure your `package.json` has a `start` script (e.g., `node server/server.js`).*

## Step 3: Configure Environment Variables

The app needs a secret key for security.

1.  Click your project card in Railway.
2.  Click the **Variables** tab.
3.  Click **New Variable**.
4.  Enter Name: `JWT_SECRET`
5.  Enter Value: A long random string (e.g., `purple-cow-eating-grass-secret-123`).
6.  Click **Add**.

## Step 4: Setup Persistent Storage (CRITICAL) 🚨

Because we use SQLite (`harvest.db`), **you MUST create a Volume**. If you skip this, your database will be wiped every time you deploy a new version.

1.  In your Project view (canvas), right-click on your service card or empty space.
2.  Select **Volume** -> **Add Volume**.
3.  Connect the Volume to your `harvest-app` service.
4.  In the Volume settings, set the **Mount Path** to: `/data`
5.  Go back to **Variables** tab and add a new variable:
    *   **Name**: `DATA_DIR`
    *   **Value**: `/data`

**Why?** This tells the application to save `config.json` and `harvest.db` into the persistent `/data` folder instead of the temporary helper folders.

## Step 5: Verify Deployment

1.  Go to the **Settings** tab.
2.  Find the **Networking** / **Domains** section.
3.  Click the generated URL (e.g., `harvest-app-production.up.railway.app`).
4.  Your site should load!

### Troubleshooting
*   **"Table not found"**: Did you set `DATA_DIR` to `/data` and mount the volume to `/data`?
*   **"Read-only file system"**: Ensure the volume is mounted correctly.

---

**You are now live! 🚀**

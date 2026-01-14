# Deployment Guide for Driftless Harvest

This guide will help you put your website on the internet so others can see it. We recommend **Railway** for this specific application because it uses a local database file (`harvest.db`) which needs special handling that Railway makes very easy.

---

## Option 1: Railway (Recommended)
**Best for:** Full functionality, saving data (accounts, orders, products) permanently.

### Step 1: Sign Up
1. Go to [railway.app](https://railway.app/).
2. Click **Login** and choose **GitHub**.
3. Authorize Railway to access your GitHub account.

### Step 2: Create Project
1. Click **+ New Project** on the dashboard.
2. Select **Deploy from GitHub repo**.
3. Search for and select your repository: `driftlessharvest`.
4. Click **Deploy Now**. 

### Step 3: Configure Variables (Settings)
1. Click on the card for your project (it might be building already).
2. Go to the **Variables** tab.
3. Add the following variables (Click "New Variable"):
   *   **`PORT`**: `3000`
   *   **`DATA_DIR`**: `/app/data` (This tells the server where to save the database).
   *   **`ADMIN_PASSWORD`**: `YourSecurePasswordHere` (Pick a password for the admin panel).
   *   **`STRIPE_PUBLISHABLE_KEY`**: `pk_test_...` (Copy from your Stripe Dashboard).
   *   **`STRIPE_SECRET_KEY`**: `sk_test_...` (Copy from your Stripe Dashboard).
   *   **`APP_NAME`**: `Driftless Harvest`

### Step 4: Add Persistent Storage (Crucial!)
*Since this app uses a file-based database (SQLite), you need a persistent volume or your data will disappear every time the site restarts.*

1. Go to the **Volumes** tab (or "Storage").
2. Click **Add Volume**.
3. Mount Path: `/app/data`
4. Click **Add**.
   *   *Note: This matches the `DATA_DIR` variable you set in Step 3.*

### Step 5: Public Domain
1. Go to the **Settings** tab.
2. Under **Networking** / **Public Domain**, click **Generate Domain**.
3. You will get a URL like `driftlessharvest-production.up.railway.app`. Click it to see your site!

---

## Option 2: Vercel
**Best for:** Quick demos.
**⚠️ WARNING:** This application uses a local `sqlite` database. On Vercel, **your data will reset** every time the site redeploys or "sleeps". Use this only for testing the frontend or if you plan to connect an external database later.

### Step 1: Sign Up
1. Go to [vercel.com](https://vercel.com/).
2. Click **Sign Up** and continue with **GitHub**.

### Step 2: Import Project
1. Click **Add New...** -> **Project**.
2. Find `driftlessharvest` in the list and click **Import**.

### Step 3: Configure
1. Open the **Environment Variables** section.
2. Add:
   *   `ADMIN_PASSWORD`: `YourSecurePassword`
   *   `STRIPE_PUBLISHABLE_KEY`: `pk_test_...`
   *   `STRIPE_SECRET_KEY`: `sk_test_...`
3. Leave "Build and Output Settings" as default.
4. Click **Deploy**.

### Step 4: Verify
1. Once deployed, you will get a dashboard link.
2. Click the screenshot/link to visit your site.
3. *Reminder:* Any accounts you create or products you edit here will likely disappear after a few hours due to Vercel's serverless nature.

---

## Post-Install Checklist
1. **Log in to Admin**: Go to `/admin` (e.g., `https://your-app.railway.app/admin`) and login with the password you set in the variables.
2. **Test Stripe**: Ensure checkout works (in Test Mode).
3. **Update Content**: Use the admin panel to update text or prices.

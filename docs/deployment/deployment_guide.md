# Beginner's Guide: Deploying Driftless Harvest to Railway

Deploying a website can sound scary, but [Railway.app](https://railway.app) makes it feel like moving files into a folder. This guide will walk you through launching the application from scratch.

---

## 🟢 Pre-Launch Checklist
Before we start, make sure you have:
1.  **A GitHub Account**: This is where your code lives.
2.  **A Railway Account**: You can sign in using your GitHub account.
3.  **Your Code on GitHub**: Ensure you have pushed your current code to a repository (like `harvest-app`).

---

## 🛠 Step 1: Connecting Railway to GitHub
1.  Log in to [Railway.app](https://railway.app).
2.  Click the big **"+ New Project"** button.
3.  Choose **"Deploy from GitHub repo"**.
4.  Find your `harvest-app` project in the list and click it.
5.  Click **"Deploy Now"**.

> [!NOTE]
> Railway will start "building" your app. It might show some red text or errors initially—don't worry! We need to set up the "brain" (the environment variables) next.

---

## 🧠 Step 2: Setting the Secret Keys (Variables)
Your app needs a few secret "passwords" to run safely.
1.  In your Railway project, click on the **"service"** (the box with your app name).
2.  Click the **"Variables"** tab.
3.  Add the following **New Variables**:

| Name | Value | Why? |
| :--- | :--- | :--- |
| `JWT_SECRET` | *Any long random sentence* | Secures user logins. |
| `ADMIN_PASSWORD` | *Your choice* | The password for `admin@driftlessharvest.com`. |
| `STRIPE_SECRET_KEY` | *Your Stripe Key* | Needed if you want to accept actual payments. |
| `DATA_DIR` | `/app/data` | **CRITICAL**: Tells the app to save `harvest.db` and `config.json` here. |

---

## 💾 Step 3: Adding a "Hard Drive" (Volumes)
Because this app uses a database file (`harvest.db`), we need to give it a permanent place to live so it doesn't "forget" everything when the server restarts.
1.  Click the **"+"** button at the top right of your Railway canvas.
2.  Select **"Volume"**.
3.  Click on the new Volume and look for **"Mount Path"**.
4.  Set the Mount Path to exactly: `/app/data`
5.  Link this Volume to your application service.

---

## 🌐 Step 4: Getting Your Public Link
1.  Inside your app service on Railway, go to the **"Settings"** tab.
2.  Look for the **"Networking"** section.
3.  Click **"Generate Domain"** (or type in a custom one if you own a `.com`).
4.  Wait about 60 seconds.
5.  **Click the link!** Your web app is now live to the world.

---

## 🔍 How the Architecture Works (Plain English)
- **The Engine (Railway)**: Railway provides the computer (server) that runs 24/7.
- **The Memory (Volume)**: The `/app/data` volume functions like a USB stick plugged into that computer. Even if the computer turns off and back on, your customers, orders, and products are safe on that stick.
- **The Box (Docker)**: Your app is wrapped in a "Docker container" (defined in your `Dockerfile`). Think of this as a sturdy shipping crate that contains everything the app needs to run, so it works perfectly regardless of the server it's placed on.

---

## 🆘 Common "Oops" Moments
- **"I can't log in!"**: Ensure you set `ADMIN_PASSWORD`. Check the logs in Railway to see if there are any error messages.
- **"All my test data is gone!"**: This usually means the **Volume** wasn't mounted to `/app/data` or the `DATA_DIR` variable wasn't set correctly. Both must point to `/app/data`.

**Congratulations! You're officially a web administrator. 🚀**

# Exhaustive Guide: TablePlus + Railway SQLite

This guide covers every possible way to connect TablePlus to your SQLite database on Railway, from the simplest snapshot to advanced "live" mounting.

---

## 🛑 The "Why is this different?" Explanation
Usually, databases (like Postgres) are like **TV Stations**—they "broadcast" data over a port (like 5432), and TablePlus just "tunes in" using a username and password.

**SQLite is different.** It is just a **File** (like a `.docx` or `.pdf`) sitting inside a secure folder on Railway's cloud computer. It doesn't "broadcast" anything. To see it in TablePlus, you have to either bring the file to your computer or build a "glass tunnel" to look at it where it sits.

---

## Path A: The "Local Mirror" Method (Easiest)
*Best for: When you are developing on your own computer.*

If you have a `harvest.db` file in your project folder on your computer, you can open it directly.

1. **Find your file**: Look in the `server/db/` folder of your project on your computer.
2. **Open in TablePlus**:
   - Open **TablePlus**.
   - Drag and drop your local `harvest.db` into the window.
3. **Keep in Mind**: Changes you make here are **local only**. To get your data from the cloud, use **Path B** below.

---

## Path B: The "Web Download" Method (Recommended for Cloud Data)
*Best for: Getting your live data from Railway safely.*

Since Railway doesn't allow direct "Copy/Paste" of cloud files via the terminal easily, this is the most reliable way.

1. **Add FileBrowser to your Project**:
   - In your Railway Dashboard, click **+ New** -> **Template**.
   - Search for **"Volume File Browser"** (the one by `brody192` is great).
   - Deploy it into your **existing project**.
2. **Link Your Data**:
   - In the FileBrowser settings, go to **Variables**.
   - Link the **Volume** that your main app uses.
   - Set the mount path to `/app/data` (to match your app).
3. **Download**:
   - Open the URL Railway gives the FileBrowser.
   - Log in (look in the service's Variables for the password).
   - Find `harvest.db` (it should be at the top level of the window), right-click, and **Download**.
4. **Open in TablePlus**:
   - Open the downloaded file in TablePlus.
*Best for: People who prefer a mouse over a terminal.*

This involves adding a "File Explorer" tool to your Railway project that gives you a web link to download your database file anytime.

1. **Add FileBrowser**:
   - In Railway, click **+ New** -> **Template**.
   - Search for **"Volume File Browser"** (by `brody192` or similar).
2. **Mount Your Data**:
   - In the FileBrowser settings, go to the **Variables** tab.
   - Look for **"Volume"** settings and link it to the **same volume** used by your `harvest-app`.
   - Set the mount path to `/data`.
3. **Download**:
   - Open the URL provided by the FileBrowser service.
   - Log in (find the username/password in the service's Variables).
   - Right-click your `harvest.db` and select **Download**.
4. **Open in TablePlus**:
   - Open the downloaded file in TablePlus.

---

## Path C: The "Live Tunnel" Method (Advanced)
*Best for: Advanced users who need to "edit" the live database directly.*

This is technical and requires a tool called `sshfs` to make the cloud folder appear as a folder on your computer.

1. **Prerequisites**:
   - Install [SSHFS](https://github.com/libfuse/sshfs) (Mac/Linux) or [WinFsp/SSHFS-Win](https://github.com/winfsp/sshfs-win) (Windows).
2. **Start a Proxy**:
   - SQLite has no port, so you can't "proxy" it directly. However, you can use `railway shell` to explore.
3. **The "Cat" Loophole (Pro Hack)**:
   If you want to **upload** a changed database back to the server:
   ```powershell
   cat my_edited_local.db | railway run "cat > /app/data/harvest.db"
   ```
   *Caution: This over-writes the live database entirely. BE CAREFUL.*

---

## Final Recommendation
If you just want to see if your orders are arriving correctly, **Path A** (The Snapshot) is the way to go. It takes 5 seconds and is impossible to "break" the live site. 

If you need to make frequent edits to live data, consider migrating to **PostgreSQL** on Railway, which TablePlus can connect to natively with zero "hacks."

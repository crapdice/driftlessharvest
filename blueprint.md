# Blueprint - 404 Routing Resolution & Test Data Cleanup

## Objective
1. Identify and resolve the root cause of the persistent 404 "API Endpoint Not Found" error for the `/api/admin/utilities/clean-delivery-windows` endpoint.
2. Manually delete all delivery windows containing the word "test" as requested by the user.

## Root Cause Analysis
[ARCHITECTURAL_HYPOTHESIS]
The 404 error is highly likely caused by **Zombie Node.js Processes**. 
- My research shows PID `13264` is currently listening on port `3000`.
- Other processes (PIDs `22476`, `3128`) are also running.
- One of these processes was likely started *before* the recent route refactoring, meaning it is serving an old version of the route tree that does not include the standard `/admin/utilities/` paths.
- Newer server instances (including the one I tried to start) fail to bind to port 3000 if it's already held, or they bind but don't receive the traffic.

## Proposed Actions

### 1. Environment Sanitization
- Terminate all active Node.js processes associated with the application to ensure no stale code is running.
- Verify port 3000 is free using `netstat`.

### 2. Manual Data Cleanup
- Execute a Node.js script to connect to `server/db/harvest.db` using `better-sqlite3`.
- Delete all rows from the `delivery_windows` table where `date_label` or `date_value` contains the case-insensitive string "test".

### 3. Verification & Restart
- Restart the server using `node server/index.js`.
- Verify the `/api/admin/utilities/clean-delivery-windows` endpoint is accessible (authenticated) using a diagnostic `curl` or `Invoke-WebRequest`.
- Verify the manual deletion by querying the database.

## Reflection (CRITIC-PASS)
- **Potential Race Conditions**: Killing processes while DB connections are active. SQLite handles this with file locks, but a clean shutdown is preferred if possible. Since we are in a broken state, `taskkill /F` is necessary.
- **Security Flaws**: The manual cleanup script will use parameterized queries to avoid SQL injection, although the input ("test") is currently hardcoded.
- **Architectural Debt**: The project currently lacks a robust "dev" process runner (like `nodemon`) that reliably cleans up children on Windows.

## Approval Required
- Approval to terminate all `node.exe` processes (PIDs `13264`, `22476`, `3128`).
- Approval to run the manual cleanup script.

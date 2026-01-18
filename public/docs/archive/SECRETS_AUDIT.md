# Hardcoded Secrets & Configuration Audit

**Date:** 2026-01-08  
**Target:** Harvest App Codebase  
**Auditor:** Antigravity  

## Executive Summary

A targeted audit was performed to identify hardcoded secrets, API keys, and environment-specific configuration details. **High** severity issues were found regarding the JWT secret configuration and hardcoded administrative credentials in management scripts.

## Findings Summary

| ID | Severity | Finding | Location | Description |
|----|----------|---------|----------|-------------|
| 1 | **HIGH** | Hardcoded JWT Secret Fallback | `server/middleware/auth.js` | Verification uses a hardcoded string if `JWT_SECRET` is missing from the environment. |
| 2 | **MEDIUM** | Hardcoded Admin Credentials | `scripts/management/` | Helper scripts contain hardcoded passwords for creating admin users. |
| 3 | **LOW** | Hardcoded URLs / Localhost | Various Scripts | Multiple scripts assume `localhost:3000`, which may break in other environments. |

---

## Detailed Findings

### 1. Hardcoded JWT Secret Fallback

**Location:** `server/middleware/auth.js` (Line 3)

**Code:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'harvest-secret-key-change-in-prod';
```

**Risk:**
If the environment variable is not correctly set during deployment, the application silently falls back to a known weak secret. Attackers who know this codebase (which is open source or shared) can sign their own tokens and gain full administrative access.

**Recommendation:**
Remove the fallback. The application should fail to start (crash) if the critical `JWT_SECRET` is missing.

### 2. Hardcoded Administrative Credentials

**Location:** 
- `scripts/management/create_superadmin.js`
- `scripts/management/create_admin.js`

**Code:**
```javascript
const password = 'HarvestAdmin!2026';
// ...
const password = 'password123';
```

**Risk:**
While these are "scripts", they are often committed to version control. If these scripts are run in production to "reset" or "init" the DB, they create accounts with known credentials.

**Recommendation:**
- Accept passwords via command-line arguments or environment variables.
- Do not commit these files with real or "default" passwords that might be used in production.

### 3. Environment Assumptions (Localhost)

**Location:** 
- `server/index.js` (logs `http://localhost:${PORT}`)
- Multiple test/verify scripts

**Risk:**
Minor. Primarily an operational headache. If deployed to a different port or domain, logs and scripts might be misleading or fail.

**Recommendation:**
Use `process.env.BASE_URL` or similar configuration for scripts.

---

## Next Steps

1.  **Refactor `server/middleware/auth.js`** to throw an error if `process.env.JWT_SECRET` is undefined.
2.  **Update Management Scripts** to prompt for passwords or read from `process.env`.
3.  **Review `.env.example`** to ensure all required keys are documented.

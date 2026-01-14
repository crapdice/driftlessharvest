require('dotenv').config();

const app = require('./app');
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'config.json');
const DEFAULTS_FILE = path.join(__dirname, 'data/config.defaults.json');

// Ensure Data Dir exists
async function ensureDataDir() {
    try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch (e) { }
}

// Bootstrapping: Ensure valid config exists
async function bootstrapConfig() {
    try {
        await fs.access(DATA_FILE);
        // Exists - do nothing (Disk persistence wins to keep Admin edits)
        // Note: In a pure stateless Docker setup, you might want ENV to always win.
        // For now, we assume if you edit via Admin, you want to keep those edits.
        console.log('[Boot] Config found.');
    } catch {
        console.log('[Boot] No config.json found. Generating from Defaults + ENV...');
        try {
            const defaults = JSON.parse(await fs.readFile(DEFAULTS_FILE, 'utf8'));

            // Overlay Environment Variables (White Labeling)
            if (process.env.APP_NAME) defaults.business.name = process.env.APP_NAME;
            if (process.env.THEME_COLOR) defaults.theme.colors.kale = process.env.THEME_COLOR; // Primary Brand Color
            if (process.env.ADMIN_EMAIL) defaults.business.email = process.env.ADMIN_EMAIL;

            await fs.writeFile(DATA_FILE, JSON.stringify(defaults, null, 2));
        } catch (e) {
            console.error('[Boot] Failed to bootstrap config:', e);
        }
    }
}

// Start Server
bootstrapConfig().then(() => {
    // Start Services
    const { startSweeper } = require('./services/paymentSweeper');
    startSweeper();

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
});
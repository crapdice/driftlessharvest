import fs from 'fs';
import path from 'path';

const apiKeysPath = 'public/admin/js/modules/api-keys.js';
const settingsPath = 'public/admin/js/modules/settings.js';

function verifyIntegration() {
    console.log('--- Verifying Admin Module Integration ---');

    // 1. Get all exported names from api-keys.js
    const apiKeysContent = fs.readFileSync(apiKeysPath, 'utf8');
    const exports = [
        ...apiKeysContent.matchAll(/export async function (\w+)/g),
        ...apiKeysContent.matchAll(/export function (\w+)/g)
    ].map(m => m[1]);

    console.log('Available exports in api-keys.js:', exports);

    // 2. Get all imported names in settings.js from api-keys.js
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    const importMatch = settingsContent.match(/import {([^}]+)} from '\.\/api-keys\.js'/);

    if (!importMatch) {
        console.log('✅ No imports from api-keys.js found in settings.js');
        process.exit(0);
    }

    const imports = importMatch[1].split(',').map(s => s.trim()).filter(id => id);
    console.log('Required imports in settings.js:', imports);

    let failed = false;
    imports.forEach(imp => {
        if (!exports.includes(imp)) {
            console.error(`❌ ERROR: settings.js imports "${imp}" but it is not exported by api-keys.js`);
            failed = true;
        } else {
            console.log(`✅ Valid import: ${imp}`);
        }
    });

    if (failed) {
        console.error('\n--- TEST FAILED ---');
        process.exit(1);
    } else {
        console.log('\n--- TEST PASSED ---');
        process.exit(0);
    }
}

verifyIntegration();

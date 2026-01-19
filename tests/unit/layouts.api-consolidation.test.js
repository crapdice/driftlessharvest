/**
 * TDD Test: Verify layouts.js uses api.getConfig() instead of raw fetch('/api/config')
 * 
 * This test ensures Phase 2 API consolidation is complete for layouts.js
 */

const fs = require('fs');
const path = require('path');

describe('layouts.js API Consolidation', () => {
    const layoutsPath = path.join(__dirname, '../../public/admin/js/modules/layouts.js');
    let fileContent;

    beforeAll(() => {
        fileContent = fs.readFileSync(layoutsPath, 'utf-8');
    });

    test('should import api from api.js', () => {
        expect(fileContent).toMatch(/import\s+\{\s*api[^}]*\}\s+from\s+['"]\.\/api\.js['"]/);
    });

    test('should NOT use raw fetch for /api/config endpoint', () => {
        // This regex matches fetch('/api/config') or fetch("/api/config")
        const rawFetchPattern = /fetch\s*\(\s*['"]\/api\/config['"]\s*\)/g;
        const matches = fileContent.match(rawFetchPattern) || [];

        // Report locations for debugging
        if (matches.length > 0) {
            const lines = fileContent.split('\n');
            const locations = [];
            lines.forEach((line, idx) => {
                if (rawFetchPattern.test(line)) {
                    locations.push(`Line ${idx + 1}: ${line.trim()}`);
                }
                // Reset regex lastIndex
                rawFetchPattern.lastIndex = 0;
            });
            console.error('Found raw fetch calls at:', locations);
        }

        expect(matches.length).toBe(0);
    });

    test('should use api.getConfig() for config retrieval', () => {
        // Ensure api.getConfig() is called somewhere in the file
        expect(fileContent).toMatch(/api\.getConfig\s*\(\s*\)/);
    });
});

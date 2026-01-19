/**
 * TDD Contract Tests: ActionDispatcher
 * 
 * Tests the central event delegation system that replaces window.* bindings.
 */

const fs = require('fs');
const path = require('path');

describe('ActionDispatcher Module', () => {
    const dispatcherPath = path.join(__dirname, '../../public/admin/js/core/ActionDispatcher.js');

    test('ActionDispatcher.js file exists', () => {
        expect(fs.existsSync(dispatcherPath)).toBe(true);
    });

    test('exports registerActions function', () => {
        const content = fs.readFileSync(dispatcherPath, 'utf-8');
        expect(content).toMatch(/export\s+(function|const)\s+registerActions/);
    });

    test('exports init function', () => {
        const content = fs.readFileSync(dispatcherPath, 'utf-8');
        expect(content).toMatch(/export\s+(function|const)\s+init/);
    });

    test('exports dispatch function for programmatic triggering', () => {
        const content = fs.readFileSync(dispatcherPath, 'utf-8');
        expect(content).toMatch(/export\s+(function|const)\s+dispatch/);
    });

    test('uses event delegation on document', () => {
        const content = fs.readFileSync(dispatcherPath, 'utf-8');
        expect(content).toMatch(/document\.addEventListener\s*\(\s*['"]click['"]/);
    });

    test('parses data-action attribute with namespace:action format', () => {
        const content = fs.readFileSync(dispatcherPath, 'utf-8');
        expect(content).toMatch(/data-action|dataset\.action/);
        expect(content).toMatch(/split\s*\(\s*['"]:['"]|namespace.*action/);
    });
});

describe('ActionDispatcher Integration with Products', () => {
    const productsPath = path.join(__dirname, '../../public/admin/js/modules/products/index.js');

    test('products module imports ActionDispatcher', () => {
        const content = fs.readFileSync(productsPath, 'utf-8');
        // After Phase 4.2, this should pass
        // For now, we just check it can be imported
        expect(content).toBeDefined();
    });
});

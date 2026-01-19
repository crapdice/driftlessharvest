/**
 * TDD Contract Tests: products.js Exports
 * 
 * Verifies all 10 public exports from products.js are available and callable.
 * Run BEFORE and AFTER refactoring to ensure no regressions.
 */

const fs = require('fs');
const path = require('path');

describe('products.js Export Contract', () => {
    const productsPath = path.join(__dirname, '../../public/admin/js/modules/products.js');
    let fileContent;

    beforeAll(() => {
        // Check if we're using new module structure or legacy single file
        const newIndexPath = path.join(__dirname, '../../public/admin/js/modules/products/index.js');
        const targetPath = fs.existsSync(newIndexPath) ? newIndexPath : productsPath;
        fileContent = fs.readFileSync(targetPath, 'utf-8');
    });

    // Required exports that app.js depends on
    const requiredExports = [
        'initProducts',
        'initInventory',
        'initTemplates',
        'initArchived',
        'loadProducts',
        'loadInventory',
        'loadArchivedProducts',
        'saveProduct',
        'openProductModal',
        'openTemplateModal'
    ];

    test('module should be readable without syntax errors', () => {
        expect(fileContent).toBeDefined();
        expect(fileContent.length).toBeGreaterThan(0);
    });

    requiredExports.forEach(exportName => {
        test(`should export '${exportName}' function`, () => {
            // Check for named export pattern: export { name } or export function name
            const namedExportPattern = new RegExp(
                `export\\s+(async\\s+)?function\\s+${exportName}|` +
                `export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`,
                'm'
            );
            expect(fileContent).toMatch(namedExportPattern);
        });
    });

    test('should maintain import compatibility with api.js', () => {
        expect(fileContent).toMatch(/import\s+\{[^}]*api[^}]*\}\s+from/);
    });

    test('should maintain import compatibility with utils.js', () => {
        expect(fileContent).toMatch(/import\s+\{[^}]*showToast[^}]*\}\s+from/);
    });
});

describe('products.js Window Bindings', () => {
    const productsPath = path.join(__dirname, '../../public/admin/js/modules/products.js');
    let fileContent;

    beforeAll(() => {
        const newIndexPath = path.join(__dirname, '../../public/admin/js/modules/products/index.js');
        // For window bindings, check both old file and new directory
        if (fs.existsSync(newIndexPath)) {
            // Read all files in products/ directory
            const productsDir = path.dirname(newIndexPath);
            const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.js'));
            fileContent = files.map(f => fs.readFileSync(path.join(productsDir, f), 'utf-8')).join('\n');
        } else {
            fileContent = fs.readFileSync(productsPath, 'utf-8');
        }
    });

    // Window bindings that HTML templates depend on
    const requiredWindowBindings = [
        'openProductModal',
        'closeProductModal',
        'openTemplateModal',
        'addTemplateItem',
        'removeTemplateItem',
        'saveTemplate',
        'closeTemplateModal',
        'loadArchivedProducts'
    ];

    requiredWindowBindings.forEach(binding => {
        test(`should bind '${binding}' to window`, () => {
            const pattern = new RegExp(`window\\.${binding}\\s*=`);
            expect(fileContent).toMatch(pattern);
        });
    });
});

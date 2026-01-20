/**
 * TDD Contract Tests: Modal Extraction
 * 
 * Verifies that modals are properly extracted to views/*.html
 * and can be dynamically loaded.
 */

const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '../../public/admin/views');
const indexPath = path.join(__dirname, '../../public/admin/index.html');

describe('Modal View Files Exist', () => {
    test('product-modals.html exists', () => {
        const filePath = path.join(viewsDir, 'product-modals.html');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    test('product-modals.html contains product modal elements', () => {
        const content = fs.readFileSync(path.join(viewsDir, 'product-modals.html'), 'utf-8');
        expect(content).toMatch(/id="product-modal"/);
        expect(content).toMatch(/id="p-name"/);
        expect(content).toMatch(/id="p-price"/);
    });

    test('product-modals.html contains template modal elements', () => {
        // Template modal is in the same file as product modal
        const content = fs.readFileSync(path.join(viewsDir, 'product-modals.html'), 'utf-8');
        expect(content).toMatch(/id="template-modal"/);
        expect(content).toMatch(/id="t-name"/);
        expect(content).toMatch(/id="t-items-list"/);
    });

    test('order-modals.html exists', () => {
        const filePath = path.join(viewsDir, 'order-modals.html');
        expect(fs.existsSync(filePath)).toBe(true);
    });

    test('order-modals.html contains order modal elements', () => {
        const content = fs.readFileSync(path.join(viewsDir, 'order-modals.html'), 'utf-8');
        expect(content).toMatch(/id="schedule-modal"/);
        expect(content).toMatch(/id="date-modal"/);
        expect(content).toMatch(/id="order-edit-modal"/);
    });
});

describe('index.html Modal Cleanup', () => {
    let indexContent;

    beforeAll(() => {
        indexContent = fs.readFileSync(indexPath, 'utf-8');
    });

    test('index.html should have modal containers', () => {
        expect(indexContent).toMatch(/id="product-modals-container"/);
        expect(indexContent).toMatch(/id="order-modals-container"/);
    });

    test('index.html should NOT have embedded template-modal', () => {
        // After extraction, this should not be in index.html
        const templateModalRegex = /<div id="template-modal"[\s\S]*?<!-- TEMPLATE MODAL END -->/;
        expect(indexContent).not.toMatch(templateModalRegex);
    });

    test('index.html should NOT have embedded product-modal', () => {
        // Product modal should be in product-modals.html, not index.html
        const productModalRegex = /<div id="product-modal"[\s\S]*?closeProductModal/;
        expect(indexContent).not.toMatch(productModalRegex);
    });

    test('index.html should NOT have embedded order-edit-modal', () => {
        const orderModalRegex = /<div id="order-edit-modal"[\s\S]*?Edit Order Details/;
        expect(indexContent).not.toMatch(orderModalRegex);
    });
});

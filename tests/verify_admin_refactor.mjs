import fs from 'fs';
import path from 'path';

const views = [
    { name: 'products', path: 'public/admin/views/products.html', id: 'view-products' },
    { name: 'inventory', path: 'public/admin/views/inventory.html', id: 'view-inventory' },
    { name: 'templates', path: 'public/admin/views/templates.html', id: 'view-templates' },
    { name: 'archived', path: 'public/admin/views/archived.html', id: 'view-archived' },
];

let failed = false;

console.log("--- Starting Refactor Verification ---");

views.forEach(view => {
    try {
        const fullPath = path.resolve(view.path);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // We want to ensure the ID is NOT present in the view file itself (it causes duplicate ID with index.html wrapper)
            if (content.includes(`id="${view.id}"`)) {
                console.error(`[FAIL] ${view.name}.html contains wrapper id="${view.id}". Should be removed.`);
                failed = true;
            } else {
                console.log(`[PASS] ${view.name}.html wrapper ID removed.`);
            }
        } else {
            console.warn(`[WARN] File not found: ${view.path}`);
        }
    } catch (e) {
        console.error(`[ERROR] checking ${view.name}: ${e.message}`);
    }
});

// Check index.html for inline content (heuristic: large inline block presence)
try {
    const indexPath = path.resolve('public/admin/index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // Check if the loaders are present
    if (indexContent.includes('<div id="view-products" class="hidden">')) {
        console.log("[PASS] index.html: view-products has loader structure.");
    } else {
        console.error("[FAIL] index.html: view-products does not match expected loader structure.");
        failed = true;
    }

    if (indexContent.includes('<div id="view-inventory" class="hidden">')) {
        console.log("[PASS] index.html: view-inventory has loader structure.");
    } else {
        console.error("[FAIL] index.html: view-inventory does not match expected loader structure.");
        failed = true;
    }

    // Check if the old content is gone (Sample ID from the old inline table)
    if (indexContent.includes('id="products-table-body"')) {
        console.error("[FAIL] index.html: products-table-body ID found (Inline content lingering?)");
        failed = true;
    } else {
        console.log("[PASS] index.html: products-table-body removed.");
    }

} catch (e) {
    console.error("Error reading index.html", e);
    failed = true;
}

if (failed) {
    console.log("\n--- Verification FAILED ---");
    process.exit(1);
} else {
    console.log("\n--- Verification PASSED ---");
}

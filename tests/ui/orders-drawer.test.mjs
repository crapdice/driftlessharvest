import assert from 'assert';
import { renderOrderDrawer } from '../../public/admin/js/modules/orders/ui.js';

console.log('🧪 Testing: Order Drawer UI');

// Mock Data
const mockOrder = {
    id: 'ORD-123',
    status: 'Pending',
    customer: { name: 'Sarah Connor', email: 'sarah@example.com' },
    shipping_address: { street: '309 Pico Blvd', city: 'Los Angeles', zip: '90001' },
    items: [
        { name: 'Box A', qty: 1, price: 20 },
        { name: 'Box B', qty: 2, price: 15 }
    ],
    total: 50
};

// --- Test 1: Function Existence ---
try {
    assert.strictEqual(typeof renderOrderDrawer, 'function');
    console.log('✅ renderOrderDrawer is a function');
} catch (e) {
    console.error('❌ renderOrderDrawer is not defined');
    process.exit(1);
}

// --- Test 2: HTML Output ---
try {
    const html = renderOrderDrawer(mockOrder);

    // Check for Container ID (The drawer itself)
    // assert.ok(html.includes('id="order-drawer-content"'), 'Missing drawer content container');

    // Check for Customer Name
    assert.ok(html.includes('Sarah Connor'), 'Customer name missing');

    // Check for Order ID
    assert.ok(html.includes('ORD-123'), 'Order ID missing');

    // Check for Status
    assert.ok(html.includes('Pending'), 'Status missing');

    // Check for Items (Check for "Box A")
    assert.ok(html.includes('Box A'), 'Item Box A missing');

    console.log('✅ HTML generation tests passed');
} catch (e) {
    console.error('❌ HTML generation failed:', e.message);
    process.exit(1);
}

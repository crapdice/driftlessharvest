// Admin Utilities Functions
// Standalone utilities script for admin panel

// Toast notification function (local implementation)
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast px-6 py-4 rounded-lg shadow-lg text-white ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} mb-3`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function cleanOrders() {
    if (!confirm('⚠️ WARNING: This will delete ALL orders, order items, carts, and payment records. This cannot be undone. Continue?')) {
        return;
    }

    if (!confirm('Are you absolutely sure? This action is irreversible.')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/utilities/clean-orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Orders cleaned successfully');
            document.getElementById('db-stats').innerHTML = `
                <div class="space-y-2">
                    <p class="text-sm text-green-700 font-semibold">✅ Orders cleaned successfully</p>
                    <div class="text-xs text-gray-600">
                        <p>• Deleted ${data.deleted.orders} orders</p>
                        <p>• Deleted ${data.deleted.orderItems} order items</p>
                        <p>• Deleted ${data.deleted.carts} active carts</p>
                        <p>• Deleted ${data.deleted.payments} payment records</p>
                    </div>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to clean orders');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function cleanUsers() {
    if (!confirm('⚠️ WARNING: This will delete ALL customer users and their addresses (admin accounts will be preserved). This cannot be undone. Continue?')) {
        return;
    }

    if (!confirm('Are you absolutely sure? This action is irreversible.')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/utilities/clean-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Customer users cleaned successfully');
            document.getElementById('db-stats').innerHTML = `
                <div class="space-y-2">
                    <p class="text-sm text-green-700 font-semibold">✅ Customer users cleaned successfully</p>
                    <div class="text-xs text-gray-600">
                        <p>• Deleted ${data.deleted.users} customer users</p>
                        <p>• Deleted ${data.deleted.addresses} addresses</p>
                    </div>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to clean users');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function seedDatabase() {
    if (!confirm('🌱 This will create 5 dummy customer users and 5 dummy orders. Continue?')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/utilities/seed-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Database seeded successfully');
            document.getElementById('db-stats').innerHTML = `
                <div class="space-y-2">
                    <p class="text-sm text-green-700 font-semibold">✅ Database seeded successfully</p>
                    <div class="text-xs text-gray-600">
                        <p>• Created ${data.created.users} customer users</p>
                        <p>• Created ${data.created.addresses} addresses</p>
                        <p>• Created ${data.created.orders} orders</p>
                        <p>• Created ${data.created.orderItems} order items</p>
                    </div>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to seed database');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function verifyDatabase() {
    try {
        const response = await fetch('/api/admin/utilities/verify-database', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('db-stats').innerHTML = `
                <div class="space-y-2">
                    <p class="text-sm text-gray-700 font-semibold mb-2">Database Statistics</p>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="bg-white p-3 rounded border border-gray-200">
                            <p class="text-gray-500 text-xs">Total Users</p>
                            <p class="text-2xl font-bold text-gray-900">${data.counts.users}</p>
                        </div>
                        <div class="bg-white p-3 rounded border border-gray-200">
                            <p class="text-gray-500 text-xs">Admin Users</p>
                            <p class="text-2xl font-bold text-purple-600">${data.counts.admins}</p>
                        </div>
                        <div class="bg-white p-3 rounded border border-gray-200">
                            <p class="text-gray-500 text-xs">Orders</p>
                            <p class="text-2xl font-bold text-blue-600">${data.counts.orders}</p>
                        </div>
                        <div class="bg-white p-3 rounded border border-gray-200">
                            <p class="text-gray-500 text-xs">Products</p>
                            <p class="text-2xl font-bold text-green-600">${data.counts.products}</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to verify database');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function cleanTempFiles() {
    if (!confirm('Delete cleanup-db.js and cleanup-result.txt?')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/utilities/clean-temp-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Temporary files cleaned');
        } else {
            throw new Error(data.error || 'Failed to clean temp files');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Database Query Functions
async function queryTable(tableName) {
    try {
        const response = await fetch(`/api/admin/utilities/query/${tableName}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayQueryResults(tableName, data.results);
        } else {
            throw new Error(data.error || 'Failed to query table');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function displayQueryResults(tableName, results) {
    const container = document.getElementById('query-results');

    if (!results || results.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500">No results found in ${tableName}</p>`;
        return;
    }

    const keys = Object.keys(results[0]);

    container.innerHTML = `
        <div class="mb-3 flex justify-between items-center">
            <h4 class="font-semibold text-gray-800">${tableName.toUpperCase()} (${results.length} rows)</h4>
            <button onclick="document.getElementById('query-results').innerHTML='<p class=\\'text-sm text-gray-500\\'>Click a button above to view database contents</p>'" 
                    class="text-xs text-gray-500 hover:text-gray-700">Clear</button>
        </div>
        <div class="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded">
            <table class="w-full text-xs">
                <thead class="bg-gray-100 sticky top-0">
                    <tr>
                        ${keys.map(key => `<th class="p-2 text-left border-b font-semibold">${key}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${results.map((row, idx) => `
                        <tr class="hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
                            ${keys.map(key => {
        let val = row[key];
        // Truncate long values
        if (typeof val === 'string' && val.length > 50) {
            val = val.substring(0, 50) + '...';
        }
        return `<td class="p-2 border-b text-gray-700">${val !== null && val !== undefined ? val : '-'}</td>`;
    }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Specific query functions
window.viewAllUsers = () => queryTable('users');
window.viewAllOrders = () => queryTable('orders');
window.viewAllProducts = () => queryTable('products');
window.viewDeliveryWindows = () => queryTable('delivery_windows');
window.viewAddresses = () => queryTable('addresses');

// Make functions globally available
window.cleanOrders = cleanOrders;
window.cleanUsers = cleanUsers;
window.seedDatabase = seedDatabase;
window.verifyDatabase = verifyDatabase;
window.cleanTempFiles = cleanTempFiles;

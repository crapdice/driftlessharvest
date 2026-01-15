// Admin Utilities Functions
// Add these to public/admin/js/modules/app.js

async function cleanDatabase() {
    if (!confirm('⚠️ WARNING: This will delete ALL orders and customer users (admin accounts will be preserved). This cannot be undone. Continue?')) {
        return;
    }

    if (!confirm('Are you absolutely sure? This action is irreversible.')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/utilities/clean-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Database cleaned successfully');
            document.getElementById('db-stats').innerHTML = `
                <div class="space-y-2">
                    <p class="text-sm text-green-700 font-semibold">✅ Database cleaned successfully</p>
                    <div class="text-xs text-gray-600">
                        <p>• Deleted ${data.deleted.orders} orders</p>
                        <p>• Deleted ${data.deleted.orderItems} order items</p>
                        <p>• Deleted ${data.deleted.users} customer users</p>
                        <p>• Deleted ${data.deleted.addresses} addresses</p>
                        <p>• Deleted ${data.deleted.carts} active carts</p>
                        <p>• Deleted ${data.deleted.payments} payment records</p>
                    </div>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to clean database');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function verifyDatabase() {
    try {
        const response = await fetch('/api/admin/utilities/verify-database', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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

// Make functions globally available
window.cleanDatabase = cleanDatabase;
window.verifyDatabase = verifyDatabase;
window.cleanTempFiles = cleanTempFiles;

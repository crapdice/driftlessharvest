import { api } from './api.js';
import { showToast, formatPhoneNumber } from './utils.js';

let usersCache = [];
let currentMode = 'customer'; // 'customer' or 'admin'

export async function loadUsers(mode = 'customer') {
    currentMode = mode;
    const titleEl = document.getElementById('customers-view-title');
    if (titleEl) titleEl.innerText = (mode === 'admin') ? 'User Management' : 'Customers';

    const addBtn = document.getElementById('btn-add-user');
    if (addBtn) addBtn.classList.toggle('hidden', mode !== 'admin');

    try {
        const users = await api.getUsers();
        usersCache = users;
        renderUsers(users, mode);
    } catch (e) {
        console.error("Failed to load users", e);
        showToast("Failed to load users", "error");
    }
}

// Track edited rows
const editedRows = new Set();

// Search State
let activeUserSearch = '';
window.searchUsers = (query) => {
    activeUserSearch = query.trim();
    renderUsers(usersCache, currentMode);
};

function renderUsers(users, mode) {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;

    // Filter logic
    let filtered = users;

    // 1. Filter by Search Query
    if (activeUserSearch) {
        const term = activeUserSearch.toLowerCase();
        filtered = filtered.filter(u =>
            u.email.toLowerCase().includes(term) ||
            (u.phone && u.phone.includes(term)) ||
            (u.id && String(u.id).includes(term))
        );
    }

    tbody.innerHTML = filtered.map(u => {
        const addr = u.address || {};
        const addressText = addr.street ? `${addr.street}, ${addr.city || ''} ${addr.state || ''} ${addr.zip || ''}`.trim() : '';

        return `
        <tr class="hover:bg-gray-50" data-user-id="${u.id}">
            <td class="p-4 font-mono text-xs text-gray-400">${String(u.id).slice(-6)}</td>
            <td class="p-4 text-sm font-medium text-gray-900">
                <div contenteditable="true" 
                     data-field="email" 
                     data-user-id="${u.id}"
                     class="editable-cell px-2 py-1 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                     oninput="markRowAsEdited(${u.id})">${u.email}</div>
            </td>
            <td class="p-4 text-sm text-gray-600">
                <div contenteditable="true" 
                     data-field="phone" 
                     data-user-id="${u.id}"
                     class="editable-cell px-2 py-1 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                     oninput="markRowAsEdited(${u.id})">${u.phone || ''}</div>
            </td>
            <td class="p-4 text-sm">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.order_count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}">
                    ${u.order_count || 0}
                </span>
            </td>
            <td class="p-4 text-sm text-gray-500">${new Date(u.created_at).toLocaleDateString()}</td>
            <td class="p-4 text-sm text-gray-600">
                <div contenteditable="true" 
                     data-field="address" 
                     data-user-id="${u.id}"
                     class="editable-cell px-2 py-1 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[200px]"
                     oninput="markRowAsEdited(${u.id})">${addressText}</div>
            </td>
            <td class="p-4 text-sm font-medium ${u.role?.includes('admin') ? 'text-purple-600' : 'text-gray-500'}">
                ${u.role || 'user'}
            </td>
            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="saveUserInline(${u.id})" 
                            id="save-btn-${u.id}"
                            class="hidden text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors">
                        Save
                    </button>
                    ${(mode === 'admin') ? `
                        <button data-action="reset-pwd" data-id="${u.id}" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors">Reset Pwd</button>
                        <button data-action="delete" data-id="${u.id}" class="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-full transition-colors">Delete</button>
                    ` : '<span class="text-gray-300 text-xs">View Only</span>'}
                </div>
            </td>
        </tr>
    `}).join('');
}

// Mark row as edited
window.markRowAsEdited = function (userId) {
    editedRows.add(userId);
    const saveBtn = document.getElementById(`save-btn-${userId}`);
    if (saveBtn) {
        saveBtn.classList.remove('hidden');
    }
};

// Save inline edits
window.saveUserInline = async function (userId) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!row) return;

    const emailCell = row.querySelector('[data-field="email"]');
    const phoneCell = row.querySelector('[data-field="phone"]');

    const email = emailCell.textContent.trim();
    const phone = phoneCell.textContent.trim();

    // CLIENT-SIDE VALIDATION
    const errors = [];

    // Email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Valid email required');
        emailCell.classList.add('ring-2', 'ring-red-500');
    } else {
        emailCell.classList.remove('ring-2', 'ring-red-500');
    }

    // Phone validation (optional but format if provided)
    if (phone && phone.replace(/\D/g, '').length > 0 && phone.replace(/\D/g, '').length !== 10) {
        errors.push('Phone must be 10 digits');
        phoneCell.classList.add('ring-2', 'ring-red-500');
    } else {
        phoneCell.classList.remove('ring-2', 'ring-red-500');
    }

    if (errors.length > 0) {
        showToast(errors.join(', '), 'error');
        return;
    }

    try {
        // Send only the fields that backend expects
        await api.updateUser(userId, {
            email,
            phone: phone.replace(/\D/g, ''), // Strip formatting
            role: 'user' // Required field
        });

        showToast('User updated successfully');
        editedRows.delete(userId);
        const saveBtn = document.getElementById(`save-btn-${userId}`);
        if (saveBtn) {
            saveBtn.classList.add('hidden');
        }

        // Reload to refresh data
        loadUsers(currentMode);
    } catch (e) {
        showToast(e.message || 'Failed to save', 'error');
    }
};

// User Actions
export async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
        await api.deleteUser(id);
        showToast("User deleted");
        loadUsers(currentMode);
    } catch (e) {
        showToast(e.message, "error");
    }
}

export async function resetUserPassword(id) {
    if (!confirm('Reset password for this user?')) return;
    try {
        await api.resetPassword(id);
        showToast('Password reset triggered');
    } catch (e) {
        showToast('Failed to reset', 'error');
    }
}

// Edit/Create Modal Logic
export function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('u-modal-title');
    const pwdContainer = document.getElementById('u-password-container');

    if (userId) {
        // Edit
        const user = usersCache.find(u => u.id === userId);
        if (!user) return;

        title.innerText = "Edit User";
        pwdContainer.classList.add('hidden');
        document.getElementById('u-id').value = user.id;
        document.getElementById('u-email').value = user.email;
        document.getElementById('u-role').value = user.role;
        document.getElementById('u-phone').value = user.phone || '';

        // Address Parsing
        let street = '', city = '', zip = '', state = '';
        if (typeof user.address === 'object' && user.address) {
            street = user.address.street || '';
            city = user.address.city || '';
            state = user.address.state || '';
            zip = user.address.zip || '';
        } else if (typeof user.address === 'string' && user.address.startsWith('{')) {
            try {
                const parsed = JSON.parse(user.address);
                street = parsed.street; city = parsed.city; state = parsed.state; zip = parsed.zip;
            } catch (e) { }
        }

        document.getElementById('u-address').value = street;
        document.getElementById('u-city').value = city;
        document.getElementById('u-state').value = state;
        document.getElementById('u-zip').value = zip;

    } else {
        // Create
        title.innerText = "Add New User";
        pwdContainer.classList.remove('hidden');
        document.getElementById('u-id').value = '';
        document.getElementById('u-email').value = '';
        document.getElementById('u-password').value = '';
        document.getElementById('u-role').value = 'user';
        document.getElementById('u-phone').value = '';
        document.getElementById('u-city').value = 'Viroqua';
        document.getElementById('u-state').value = 'WI';
        document.getElementById('u-zip').value = '54665';
        document.getElementById('u-address').value = '';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export async function saveUser() {
    const id = document.getElementById('u-id').value;
    const email = document.getElementById('u-email').value;
    const role = document.getElementById('u-role').value;
    const city = document.getElementById('u-city').value;
    const state = document.getElementById('u-state').value.toUpperCase();
    const zip = document.getElementById('u-zip').value;
    const address = document.getElementById('u-address').value;
    const phone = document.getElementById('u-phone').value;
    const password = document.getElementById('u-password').value;

    const payload = { email, role, city, state, zip, address, phone };
    if (!id) payload.password = password;

    try {
        if (id) await api.updateUser(id, payload);
        else await api.createUser(payload);

        showToast(id ? 'User updated' : 'User created');
        document.getElementById('user-modal').classList.add('hidden');
        loadUsers(currentMode);
    } catch (e) {
        showToast(e.message, "error");
    }
}

// Event Delegation for Table Actions
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id, 10); // Convert to number

    if (action === 'delete') deleteUser(id);
    if (action === 'reset-pwd') resetUserPassword(id);
    if (action === 'edit') openUserModal(id);
});

// Phone Formatting Input
const phoneInput = document.getElementById('u-phone');
if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        e.target.value = formatPhoneNumber(e.target.value);
    });
}

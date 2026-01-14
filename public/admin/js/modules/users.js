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

    // 2. Role Filter (Modified: User requested to see admins even in customer view if that's all there is)
    // We will show all users by default for now, or we could just filter if the search is empty?
    // User complaint was "no customers appearing because only admin have been customers".
    // So we will REMOVE the explicit hide of admins.

    /* 
    const filteredByMode = filtered.filter(u => {
        const isAdmin = (u.role === 'admin' || u.role === 'super_admin');
        return (mode === 'admin') ? true : !isAdmin;
    });
    */
    // rendering 'filtered' directly now (all roles visible)

    tbody.innerHTML = filtered.map(u => `
        <tr class="hover:bg-gray-50">
            <td class="p-4 font-mono text-xs text-gray-400">${String(u.id).slice(-6)}</td>
            <td class="p-4 text-sm font-medium text-gray-900">${u.email}</td>
            <td class="p-4 text-sm text-gray-500">${new Date(u.created_at).toLocaleDateString()}</td>
            <td class="p-4 text-sm text-gray-600">
                ${renderAddress(u.address)}
            </td>
            <td class="p-4 text-sm font-medium ${u.role?.includes('admin') ? 'text-purple-600' : 'text-gray-500'}">
                ${u.role || 'user'}
            </td>
            <td class="p-4 text-right">
                ${(mode === 'admin') ? renderAdminActions(u) : '<span class="text-gray-300 text-xs">View Only</span>'}
            </td>
        </tr>
    `).join('');
}

// Search State
let activeUserSearch = '';
window.searchUsers = (query) => {
    activeUserSearch = query.trim();
    renderUsers(usersCache, currentMode);
};

function renderAddress(addr) {
    if (!addr) return '<span class="text-gray-300 italic">No address</span>';
    // Handle JSON object vs string legacy
    let city = '', zip = '';
    if (typeof addr === 'object') {
        city = addr.city;
        zip = addr.zip;
    } else if (typeof addr === 'string' && addr.startsWith('{')) {
        try {
            const parsed = JSON.parse(addr);
            city = parsed.city;
            zip = parsed.zip;
        } catch (e) { }
    }

    if (city) return `${city}, ${zip}`;
    return '<span class="text-gray-300 italic">No address</span>';
}

function renderAdminActions(u) {
    return `
        <button data-action="reset-pwd" data-id="${u.id}" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors mr-2">Reset Pwd</button>
        <button data-action="delete" data-id="${u.id}" class="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-full transition-colors mr-2">Delete</button>
        <button data-action="edit" data-id="${u.id}" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
    `;
}

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
    const id = btn.dataset.id;

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

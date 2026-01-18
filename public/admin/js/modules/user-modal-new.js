/**
 * User Modal - Modern FormModal Implementation
 * 
 * This is a NEW implementation using the FormModal component.
 * The old implementation is preserved for rollback safety.
 * 
 * To activate: Change openUserModal to openUserModalNew in users.js
 * To rollback: Change back to openUserModal
 */

import { FormModal } from '../components/FormModal.js';
import { api } from './api.js';
import { showToast, formatPhoneNumber } from './utils.js';

let userModalInstance = null;

/**
 * Open user modal (modern version)
 */
export async function openUserModalNew(userId = null) {
    let user = null;

    // If editing, fetch user data
    if (userId) {
        const usersCache = window.usersCache || [];
        user = usersCache.find(u => u.id === userId);
        if (!user) {
            showToast('User not found', 'error');
            return;
        }
    }

    // Parse address if editing
    let address = { street: '', city: 'Viroqua', state: 'WI', zip: '54665' };
    if (user && user.address) {
        if (typeof user.address === 'object') {
            address = { ...address, ...user.address };
        } else if (typeof user.address === 'string' && user.address.startsWith('{')) {
            try {
                address = { ...address, ...JSON.parse(user.address) };
            } catch (e) {
                console.error('Failed to parse address:', e);
            }
        }
    }

    // Prepare form data
    const formData = {
        email: user?.email || '',
        phone: formatPhoneNumber(user?.phone || ''),
        role: user?.role || 'user',
        password: '',
        address: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip
    };

    console.log('🔍 DEBUG - User data:', user);
    console.log('🔍 DEBUG - FormData:', formData);

    // Define form fields
    const fields = [
        // Account Section
        {
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true,
            fullWidth: false
        },
        {
            name: 'phone',
            type: 'tel',
            label: 'Phone',
            placeholder: '(555) 555-5555',
            fullWidth: false
        },
        {
            name: 'role',
            type: 'select',
            label: 'Role',
            options: [
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super Admin' }
            ],
            fullWidth: false
        },
        // Password (only for new users)
        ...(!userId ? [{
            name: 'password',
            type: 'password',
            label: 'Password',
            required: true,
            fullWidth: false
        }] : []),
        // Address Section
        {
            name: 'address',
            type: 'text',
            label: 'Street',
            fullWidth: true
        },
        {
            name: 'city',
            type: 'text',
            label: 'City',
            fullWidth: false
        },
        {
            name: 'state',
            type: 'text',
            label: 'State',
            maxlength: 2,
            fullWidth: false
        },
        {
            name: 'zip',
            type: 'text',
            label: 'ZIP',
            fullWidth: false
        }
    ];

    // Create or reuse modal instance
    if (!userModalInstance) {
        console.log('[UserModal] Creating new modal with data:', formData);
        userModalInstance = new FormModal({
            title: userId ? 'Edit User' : 'Add New User',
            size: 'lg',
            layout: 'double',
            fields: fields,
            data: formData,
            submitText: 'Save User',
            closeOnEscape: true,
            onSubmit: async (formData) => {
                await saveUserData(userId, formData);
            }
        });
    } else {
        // Update existing modal
        console.log('[UserModal] Updating modal with data:', formData);
        userModalInstance.title = userId ? 'Edit User' : 'Add New User';
        userModalInstance.fields = fields;
        userModalInstance.data = formData;
        userModalInstance.closeOnEscape = true;
        userModalInstance.renderForm();
    }

    // Add phone formatting
    const phoneInput = userModalInstance.element.querySelector('[name="phone"]');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    // Auto-uppercase state
    const stateInput = userModalInstance.element.querySelector('[name="state"]');
    if (stateInput) {
        stateInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    userModalInstance.open();
}

/**
 * Save user data
 */
async function saveUserData(userId, formData) {
    const payload = {
        email: formData.email,
        role: formData.role,
        phone: formData.phone?.replace(/\D/g, ''), // Strip formatting
        address: formData.address,
        city: formData.city,
        state: formData.state?.toUpperCase(),
        zip: formData.zip
    };

    // Add password for new users
    if (!userId && formData.password) {
        payload.password = formData.password;
    }

    // Validate required fields
    if (!payload.email || !payload.email.trim()) {
        showToast('❌ Email is required', 'error');
        throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
        showToast('❌ Invalid email format (example@domain.com)', 'error');
        throw new Error('Invalid email format');
    }

    // Validate password for new users
    if (!userId && (!formData.password || formData.password.length < 6)) {
        showToast('❌ Password must be at least 6 characters', 'error');
        throw new Error('Password too short');
    }

    // Validate phone if provided (check stripped version)
    const strippedPhone = formData.phone?.replace(/\D/g, '') || '';
    if (strippedPhone.length > 0 && strippedPhone.length !== 10) {
        showToast(`❌ Phone must be 10 digits, you entered ${strippedPhone.length} (${strippedPhone})`, 'error');
        throw new Error('Invalid phone number');
    }

    try {
        if (userId) {
            await api.updateUser(userId, payload);
            showToast('User updated successfully');
        } else {
            await api.createUser(payload);
            showToast('User created successfully');
        }

        // Reload users list
        if (window.loadUsers) {
            window.loadUsers(window.currentMode || 'customer');
        }

    } catch (error) {
        showToast(error.message || 'Failed to save user', 'error');
        throw error; // Re-throw to prevent modal from closing
    }
}

// Make available globally for testing
window.openUserModalNew = openUserModalNew;

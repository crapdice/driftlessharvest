import { store } from '../store/index.js';
import * as api from './api.js';
import { setView } from './router.js';
import { formatPhoneNumber, showToast } from '../utils.js';
import * as Validator from './validation.js';
import { OrderCard } from '../components/OrderCard_v3.js';

export async function loadUserOrders() {
    const container = document.getElementById('dashboard-orders-list');
    if (!container) return; // Not on view

    try {
        const orders = await api.fetchMyOrders();

        if (orders.length === 0) {
            container.innerHTML = `
        <div class="text-center py-24 bg-white border border-nature-100 rounded-lg shadow-sm">
            <div class="text-6xl mb-6 opacity-20 filter grayscale">🥕</div>
            <h3 class="font-serif text-3xl text-nature-900 mb-3">No harvests yet</h3>
            <p class="text-nature-500 mb-8 font-sans text-sm tracking-wide max-w-xs mx-auto leading-relaxed">Your journey with local soil begins with a single box.</p>
            <button onclick="setView('home')" class="bg-nature-900 text-white px-8 py-3 rounded-full font-serif font-bold italic hover:bg-harvest-gold hover:text-nature-900 transition-all shadow-md">Start Shopping</button>
          </div>
        `;
            return;
        }

        container.innerHTML = orders.map(OrderCard).join('');

    } catch (err) {
        console.error('Order fetch failed:', err);
        container.innerHTML = `<div class="p-8 text-center text-nature-400 italic">Unable to load order history.</div>`;
    }
}

export async function loadUserProfile() {
    // 1. Try to fetch fresh data
    try {
        const freshUser = await api.fetchProfile();
        // Update store
        store.setUser(freshUser);
    } catch (e) { console.error("Failed to sync profile", e); }

    const u = store.getUser();
    if (!u) return;

    if (document.getElementById('prof-email')) {
        document.getElementById('prof-email').value = u.email || '';
    }
    if (document.getElementById('prof-first-name')) {
        document.getElementById('prof-first-name').value = u.firstName || '';
    }
    if (document.getElementById('prof-last-name')) {
        document.getElementById('prof-last-name').value = u.lastName || '';
    }
    // Main contact phone
    if (document.getElementById('prof-phone')) {
        document.getElementById('prof-phone').value = u.phone || '';
    }

    // Billing Address
    const billing = u.billingAddress || {};
    if (document.getElementById('billing-street')) {
        document.getElementById('billing-street').value = billing.street || '';
        document.getElementById('billing-city').value = billing.city || '';
        document.getElementById('billing-state').value = billing.state || '';
        document.getElementById('billing-zip').value = billing.zip || '';
        document.getElementById('billing-phone').value = billing.phone || '';
    }

    // Shipping Address
    const shipping = u.shippingAddress || {};
    if (document.getElementById('shipping-street')) {
        document.getElementById('shipping-street').value = shipping.street || '';
        document.getElementById('shipping-city').value = shipping.city || '';
        document.getElementById('shipping-state').value = shipping.state || '';
        document.getElementById('shipping-zip').value = shipping.zip || '';
        document.getElementById('shipping-phone').value = shipping.phone || '';
    }

    // Legacy support: If no billing/shipping but 'address' exists, fill both
    if (!billing.street && !shipping.street && u.address) {
        let legacyAddr = u.address;
        if (typeof legacyAddr === 'string' && legacyAddr.startsWith('{')) {
            try { legacyAddr = JSON.parse(legacyAddr); } catch (e) { }
        }

        if (legacyAddr.street) {
            // Fill Billing
            if (document.getElementById('billing-street')) {
                document.getElementById('billing-street').value = legacyAddr.street;
                document.getElementById('billing-city').value = legacyAddr.city || '';
                document.getElementById('billing-state').value = legacyAddr.state || '';
                document.getElementById('billing-zip').value = legacyAddr.zip || '';
            }
        }
    }

    // Handle "Same as Billing" checkbox state initial load could be complex, 
    // for now we trust the default checked state or user interaction, 
    // unless we strictly check if shipping == billing deep equal.
}

export async function updateProfile(e) {
    e.preventDefault();

    const firstName = document.getElementById('prof-first-name').value;
    const lastName = document.getElementById('prof-last-name').value;
    const email = document.getElementById('prof-email').value;
    const phone = document.getElementById('prof-phone').value;

    // Billing
    const billingAddress = {
        street: document.getElementById('billing-street').value.trim(),
        city: document.getElementById('billing-city').value.trim(),
        state: document.getElementById('billing-state').value,
        zip: document.getElementById('billing-zip').value.trim(),
        phone: document.getElementById('billing-phone').value.trim()
    };

    // Shipping
    const isSame = document.getElementById('same-as-billing').checked;
    let shippingAddress = {};

    if (isSame) {
        shippingAddress = { ...billingAddress };
        // If billing phone is empty, maybe fallback to main phone? 
        // For now, exact copy is safest interpretation of "Same as".
    } else {
        shippingAddress = {
            street: document.getElementById('shipping-street').value.trim(),
            city: document.getElementById('shipping-city').value.trim(),
            state: document.getElementById('shipping-state').value,
            zip: document.getElementById('shipping-zip').value.trim(),
            phone: document.getElementById('shipping-phone').value.trim()
        };
    }

    const password = document.getElementById('prof-password').value;

    // Validation
    const errors = [];
    if (!firstName || firstName.length < 2) errors.push("First Name is required (min 2 chars).");
    if (!lastName || lastName.length < 2) errors.push("Last Name is required (min 2 chars).");
    if (!Validator.validateEmail(email)) errors.push("Invalid Email Address.");
    if (phone && !Validator.validateSimplePhone(phone)) errors.push("Contact Phone must be 10 digits.");

    // Billing Validation
    if (!Validator.validateStreet(billingAddress.street)) errors.push("Billing Street must have at least 1 number and 2 letters.");
    if (!Validator.validateCity(billingAddress.city)) errors.push("Billing City must have at least 2 letters.");
    if (!billingAddress.state) errors.push("Billing State is required.");
    if (!Validator.validateZip(billingAddress.zip)) errors.push("Invalid Billing Zip Code.");

    // Shipping Validation
    if (!isSame) {
        if (!Validator.validateStreet(shippingAddress.street)) errors.push("Shipping Street must have at least 1 number and 2 letters.");
        if (!Validator.validateCity(shippingAddress.city)) errors.push("Shipping City must have at least 2 letters.");
        if (!shippingAddress.state) errors.push("Shipping State is required.");
        if (!Validator.validateZip(shippingAddress.zip)) errors.push("Invalid Shipping Zip Code.");
    }

    // Password (if provided)
    // Needs to check if the fields are visible or just if they have values.
    // We expect `password` (new) and `passwordConfirm`
    const passwordConfirm = document.getElementById('prof-password-confirm')?.value.trim() || '';

    // Only validate if password field has value or is visible (implying intent)
    if (password) {
        if (password.length < 8) errors.push("New Password must be at least 8 characters.");
        if (password !== passwordConfirm) errors.push("Passwords do not match.");
    }

    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }

    const payload = {
        firstName,
        lastName,
        email,
        phone,
        billingAddress,
        shippingAddress
    };

    // Only add password to payload if it was provided and valid
    if (password) {
        payload.password = password;
    }

    try {
        await api.updateProfile(payload);
        showToast('Profile updated successfully');

        // Update local store
        const currentUser = store.getUser() || {};
        const updatedUser = {
            ...currentUser,
            firstName,
            lastName,
            email,
            phone,
            billingAddress,
            shippingAddress
        };
        store.setUser(updatedUser);

        // Sidebar update if present
        if (document.querySelector('aside .font-serif')) {
            const sidebarEmail = document.querySelector('aside .font-serif');
            if (sidebarEmail) sidebarEmail.innerText = email;
        }

    } catch (err) {
        showToast(err.message || 'Error updating profile', 'error');
        console.error(err);
    }
}


export function handlePhoneInput(input) {
    const formatted = formatPhoneNumber(input.value);
    input.value = formatted;

    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;

    // Reset classes
    input.classList.remove(
        'border-stone-200', 'focus:ring-kale/20',
        'focus:border-kale', 'focus:border-root', 'focus:border-harvest-gold', // Remove theme focus borders
        'border-red-600', 'border-2', 'focus:ring-red-200',
        'border-green-500', 'focus:ring-green-200',
        'border-red-500' // Legacy removal
    );

    if (formatted.length === 0) {
        input.classList.add('border-stone-200', 'focus:ring-kale/20');
    } else if (phoneRegex.test(formatted)) {
        input.classList.add('border-green-500', 'focus:ring-green-200');
    } else {
        input.classList.add('border-red-600', 'border-2', 'focus:ring-red-200');
    }
}

export function validateInput(input) {
    const id = input.id;
    const val = input.value.trim();
    let isValid = false;

    // Determine Rule
    if (id === 'prof-email') {
        isValid = Validator.validateField('email', val);
    } else if (id.includes('zip')) {
        isValid = Validator.validateField('zip', val);
    } else if (id.includes('first-name') || id.includes('last-name')) {
        isValid = Validator.validateField('name', val);
    } else if (id === 'prof-password') {
        isValid = Validator.validateField('password', val);
        // Trigger confirm check if it has value
        const confirmField = document.getElementById('prof-password-confirm');
        if (confirmField && confirmField.value) {
            validateInput(confirmField);
        }
    } else if (id === 'prof-password-confirm') {
        const passwordField = document.getElementById('prof-password');
        const passwordVal = passwordField ? passwordField.value.trim() : '';
        isValid = val === passwordVal && val.length >= 8;
    } else if (id.includes('state')) {
        isValid = val !== '';
    } else if (id.includes('street')) {
        isValid = Validator.validateField('street', val);
    } else if (id.includes('city')) {
        isValid = Validator.validateField('city', val);
    } else {
        // Default required fields
        isValid = Validator.validateField('required', val);
    }

    // Apply Styles
    input.classList.remove(
        'border-stone-200', 'focus:ring-kale/20',
        'focus:border-kale', 'focus:border-root', 'focus:border-harvest-gold',
        'border-red-600', 'border-2', 'focus:ring-red-200',
        'border-green-500', 'focus:ring-green-200',
        'border-red-500'
    );

    if (val.length === 0 && id !== 'prof-password') {
        // Empty is neutral/reset unless required? 
        // Let's make empty = red for required fields on blur
        input.classList.add('border-red-600', 'border-2', 'focus:ring-red-200');
    } else if (isValid) {
        input.classList.add('border-green-500', 'focus:ring-green-200');
    } else {
        input.classList.add('border-red-600', 'border-2', 'focus:ring-red-200');
    }

    // Special case: Password empty is Valid (Neutral)
    if ((id === 'prof-password' || id === 'prof-password-confirm') && val.length === 0) {
        input.classList.remove('border-green-500', 'focus:ring-green-200', 'border-red-600', 'border-2', 'focus:ring-red-200');
        input.classList.add('border-stone-200', 'focus:ring-kale/20');
    }
}

import { state } from './state.js';
import { setView } from './router.js';
import { formatPhoneNumber, showToast } from '../utils.js';
import { OrderCard } from '../components/OrderCard_v3.js';

export async function loadUserOrders() {
    const container = document.getElementById('dashboard-orders-list');
    if (!container) return; // Not on view

    try {
        const res = await fetch('/api/orders/mine', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        if (!res.ok) {
            const errText = await res.text();
            console.error('Order fetch failed:', res.status, errText);
            throw new Error('Failed to load orders');
        }

        const orders = await res.json();

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
        container.innerHTML = `<div class="p-8 text-center text-nature-400 italic">Unable to load order history.</div>`;
    }
}

export async function loadUserProfile() {
    // 1. Try to fetch fresh data
    try {
        const res = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        if (res.ok) {
            const freshUser = await res.json();
            // Update state
            state.user = freshUser;
            localStorage.setItem('harvest_user', JSON.stringify(state.user));
        }
    } catch (e) { console.error("Failed to sync profile", e); }

    const u = state.user;
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

    let street = '', city = '', zip = '', stateCode = '';
    if (u.address && typeof u.address === 'object') {
        street = u.address.street || '';
        city = u.address.city || '';
        zip = u.address.zip || '';
        stateCode = u.address.state || '';
    } else if (u.address && typeof u.address === 'string' && u.address.startsWith('{')) {
        try {
            const parsed = JSON.parse(u.address);
            street = parsed.street || '';
            city = parsed.city || '';
            zip = parsed.zip || '';
            stateCode = parsed.state || '';
        } catch (e) { }
    } else if (typeof u.address === 'string') {
        street = u.address;
    }

    if (document.getElementById('prof-address')) {
        document.getElementById('prof-address').value = street;
        document.getElementById('prof-city').value = city;
        document.getElementById('prof-state').value = stateCode;
        document.getElementById('prof-zip').value = zip;
        document.getElementById('prof-phone').value = u.phone || '';
    }
}

export async function updateProfile(e) {
    e.preventDefault();

    const firstName = document.getElementById('prof-first-name').value;
    const lastName = document.getElementById('prof-last-name').value;
    const email = document.getElementById('prof-email').value;
    const phone = document.getElementById('prof-phone').value;
    const address = document.getElementById('prof-address').value;
    const city = document.getElementById('prof-city').value;
    const stateCode = document.getElementById('prof-state').value;
    const zip = document.getElementById('prof-zip').value;
    const password = document.getElementById('prof-password').value;

    const payload = { firstName, lastName, email, phone, address, city, state: stateCode, zip, password };

    try {
        const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('Profile updated successfully');
            if (!state.user) state.user = {};
            state.user.firstName = firstName;
            state.user.lastName = lastName;
            state.user.email = email;
            state.user.phone = phone;
            if (typeof state.user.address !== 'object' || state.user.address === null) state.user.address = {};
            state.user.address.street = address;
            state.user.address.city = city;
            state.user.address.state = stateCode;
            state.user.address.zip = zip;

            localStorage.setItem('harvest_user', JSON.stringify(state.user));
            // Assuming setView or simple re-render isn't needed unless we want to refresh sidebar name
            if (document.querySelector('aside .font-serif')) {
                const sidebarEmail = document.querySelector('aside .font-serif');
                if (sidebarEmail) sidebarEmail.innerText = email;
            }
        } else {
            const err = await res.json();
            showToast(err.error || 'Failed to update', 'error');
        }
    } catch (err) {
        showToast('Error updating profile', 'error');
        console.error(err);
    }
}

export function handlePhoneInput(input) {
    const formatted = formatPhoneNumber(input.value);

    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    input.classList.remove(
        'border-stone-200', 'focus:ring-kale/20',
        'border-red-500', 'focus:ring-red-200',
        'border-green-500', 'focus:ring-green-200'
    );

    if (formatted.length === 0) {
        input.classList.add('border-stone-200', 'focus:ring-kale/20');
    } else if (phoneRegex.test(formatted)) {
        input.classList.add('border-green-500', 'focus:ring-green-200');
    } else {
        input.classList.add('border-red-500', 'focus:ring-red-200');
    }
}

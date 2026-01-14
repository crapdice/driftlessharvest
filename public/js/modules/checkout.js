import { state } from './state.js';
import { setView } from './router.js';
import { showToast } from '../utils.js';
import { saveCart } from './cart.js'; // Cyclic dependency potential? 
// cart.js imports state, router, layout, marketplace, utils, quantitycontrol. 
// It does NOT import checkout. So this direction is safe.

let stripe;
let elements;
let currentOrderId;

export async function initCheckout() {
    // 1. Initialize Stripe
    if (!stripe) {
        // We assume the key is in the public config, or hardcoded for dev if missing
        const key = window.CONFIG?.stripePublishableKey || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
        if (!window.Stripe) {
            console.error("Stripe.js not loaded");
            return;
        }
        stripe = Stripe(key);
    }

    // 2. Create PaymentIntent (Server)
    try {
        const res = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: state.cart, userEmail: state.user?.email })
        });

        if (!res.ok) {
            const err = await res.json();
            // Handle Stock Errors (Specific UX)
            if (res.status === 409 && err.failedItems) {
                const names = err.failedItems.map(i => i.name).join(', ');
                alert(`The following items are out of stock: ${names}. They will be removed.`);
                const failIds = err.failedItems.map(i => i.id);
                state.cart = state.cart.filter(item => !failIds.includes(item.id));
                saveCart();
                setView('cart');
                return;
            }
            throw new Error(err.error || 'Failed to initialize payment');
        }

        const { clientSecret, orderId } = await res.json();
        currentOrderId = orderId;

        // 3. Mount Elements
        const appearance = { theme: 'stripe', variables: { colorPrimary: '#3d5a49' } };
        elements = stripe.elements({ appearance, clientSecret });

        const paymentElement = elements.create("payment");
        const container = document.getElementById("payment-element");
        if (container) {
            container.innerHTML = ''; // Clear loader
            paymentElement.mount("#payment-element");
        }

    } catch (e) {
        const el = document.getElementById("payment-element");
        if (el) el.innerHTML = `<div class="p-4 text-red-600 bg-red-50 rounded">${e.message}</div>`;
    }
}

export async function placeOrder() {
    if (!stripe || !elements) {
        showToast('Payment not initialized', 'error');
        return;
    }

    const firstName = document.getElementById('checkout-first-name').value;
    const lastName = document.getElementById('checkout-last-name').value;
    const email = document.getElementById('checkout-email').value;
    const phone = document.getElementById('checkout-phone').value;

    // Shipping Address
    const shipAddr = document.getElementById('checkout-address').value;
    const shipCity = document.getElementById('checkout-city').value;
    const shipState = document.getElementById('checkout-state').value;
    const shipZip = document.getElementById('checkout-zip').value;

    // Delivery Window
    const deliveryWindowInput = document.querySelector('input[name="delivery-date"]:checked');
    const deliveryWindow = deliveryWindowInput ? deliveryWindowInput.value : 'Standard';

    // Validate Shipping Phase
    if (!firstName || !lastName || !email || !shipAddr || !shipCity || !shipState || !shipZip) {
        showToast('Please fill in all shipping fields.', 'error');
        return;
    }

    // Billing Logic
    let billing = {
        name: `${firstName} ${lastName}`.trim(),
        email: email,
        phone: phone,
        address: {
            line1: shipAddr,
            city: shipCity,
            state: shipState,
            postal_code: shipZip,
            country: 'US',
        }
    };

    // Shipping Object (For Stripe & Backend Webhook)
    const shipping = {
        name: `${firstName} ${lastName}`.trim(),
        address: {
            line1: shipAddr,
            city: shipCity,
            state: shipState,
            postal_code: shipZip,
            country: 'US',
        },
        phone: phone
    };

    const sameAsShipping = document.getElementById('billing-same-as-shipping').checked;

    if (!sameAsShipping) {
        // Capture specific billing inputs
        const bFirst = document.getElementById('billing-first-name').value;
        const bLast = document.getElementById('billing-last-name').value;
        const bAddr = document.getElementById('billing-address').value;
        const bCity = document.getElementById('billing-city').value;
        const bState = document.getElementById('billing-state').value;
        const bZip = document.getElementById('billing-zip').value;

        if (!bFirst || !bLast || !bAddr || !bCity || !bState || !bZip) {
            showToast('Please fill in all billing fields.', 'error');
            return;
        }

        billing.name = `${bFirst} ${bLast}`.trim();
        billing.address = {
            line1: bAddr,
            city: bCity,
            state: bState,
            postal_code: bZip,
            country: 'US'
        };
    }

    // Lock button
    const btn = document.querySelector('button[onclick="placeOrder()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Processing...';
    }

    try {
        // ---------------------------------------------------------
        // CRITICAL STEP: Save Data BEFORE Payment
        // ---------------------------------------------------------
        const legacyShipping = {
            name: billing.name,
            street: shipAddr,
            city: shipCity,
            state: shipState,
            zip: shipZip,
            phone: phone
        };

        console.log("Saving Order Details Pre-Payment...", legacyShipping);

        try {
            await updateBackendOrderDetails(currentOrderId, legacyShipping, deliveryWindow, email);
        } catch (saveErr) {
            console.error("Failed to save order details pre-payment", saveErr);
        }

        // ---------------------------------------------------------
        // STRIPE CONFIRMATION
        // ---------------------------------------------------------
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/dashboard',
                payment_method_data: {
                    billing_details: billing
                },
                shipping: shipping,
            },
            redirect: 'if_required'
        });

        console.log("Stripe Confirm Result:", { error, paymentIntent });

        if (error) {
            throw error;
        } else {
            // Success
            triggerSuccessUI(email, btn);
        }
    } catch (e) {
        console.error(e);
        showToast(e.message || 'Payment Error', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Confirm Harvest Order';
        }
    }
}

// Helper to reliably save data to our DB regardless of Stripe Webhook timing
async function updateBackendOrderDetails(orderId, shipping, window, email) {
    try {
        await fetch('/api/orders/update-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            },
            body: JSON.stringify({
                orderId,
                shipping,
                delivery_window: window,
                email: email
            })
        });
    } catch (e) { console.warn("Failed to update backend details", e); }
}

async function triggerSuccessUI(email, btn) {
    // 1. Immediately verify payment on server to update status
    //    (Fixes "Pending Payment" / Missing Webhooks issue)
    if (currentOrderId) {
        try {
            console.log(`Verifying payment for Order ${currentOrderId}...`);
            await fetch(`/api/orders/${currentOrderId}/verify-payment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
            });
        } catch (e) { console.warn("Auto-verification failed", e); }
    }

    // Celebration Overlay
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] bg-nature-900/95 flex items-center justify-center opacity-0 transition-opacity duration-700';
    overlay.innerHTML = `
                <div class="text-center transform transition-all duration-700 translate-y-10 scale-95" id="celebration-content">
                    <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-harvest-gold text-nature-900 text-5xl shadow-2xl mb-8 animate-bounce-short">🌱</div>
                    <h2 class="text-5xl font-serif text-white mb-6">Order Planted!</h2>
                    <p class="text-nature-300 text-xl max-w-md mx-auto leading-relaxed font-light">
                        Thank you for your payment.<br>
                        We've sent a receipt to <span class="text-white font-medium">${email}</span>.
                    </p>
                </div>
            `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        const content = overlay.querySelector('#celebration-content');
        content.classList.remove('translate-y-10', 'scale-95');
    });

    state.cart = [];
    saveCart(); // Sync empty cart

    setTimeout(() => {
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            document.body.removeChild(overlay);
            setView('dashboard');
        }, 700);
    }, 3000);
}

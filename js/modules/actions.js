
import { state } from './state.js';
import { setView, router as render } from './router.js'; // Router's render re-renders current view
import { renderHeaderCount } from '../views/layout.js';
import { getMarketplaceData, setMarketplaceData } from '../views/marketplace.js';
import { formatPhoneNumber, showToast } from '../utils.js';
import { createOrderPayload } from '../models.js';
import { FeaturedProducts } from '../components/FeaturedProducts.js';
import { BentoGrid } from '../components/BentoGrid.js';
import { QuantityControl } from '../components/QuantityControl.js';

// ------------------------------------------------------------------
// INIT
// ------------------------------------------------------------------
export async function initApp() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Failed to load config');
        window.CONFIG = await response.json();

        // Check for existing token
        try {
            const token = localStorage.getItem('harvest_token');
            const savedUser = localStorage.getItem('harvest_user');
            if (token && savedUser) {
                state.user = JSON.parse(savedUser);
            }
        } catch (e) {
            console.warn("Failed to restore user session", e);
            localStorage.removeItem('harvest_token');
            localStorage.removeItem('harvest_user');
        }

        try {
            loadCart();
        } catch (e) {
            console.warn("Failed to load cart", e);
            localStorage.removeItem('harvest_cart');
        }

        // Check for login redirect from admin
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'login') {
            state.view = 'login';
        }

        // Apply Theme
        if (window.CONFIG.theme?.colors) {
            const root = document.documentElement;
            Object.entries(window.CONFIG.theme.colors).forEach(([key, val]) => {
                root.style.setProperty(`--color-${key}`, val);
            });
        }

        startApp();

        startApp();
    } catch (err) {
        console.error(err);
        document.body.innerHTML = '<div class="p-10 text-red-600">Failed to load application configuration.</div>';
    }
}

export function startApp() {
    render(); // Render based on current URL
}

// ------------------------------------------------------------------
// AUTH
// ------------------------------------------------------------------
// Helper for safe JSON parsing
async function safeJson(res) {
    try {
        return await res.json();
    } catch (e) {
        return { error: `Server Error: ${res.status} ${res.statusText}` };
    }
}

export async function login(email, password) {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Login failed');

        state.user = data.user;
        localStorage.setItem('harvest_token', data.token);
        localStorage.setItem('harvest_user', JSON.stringify(data.user));
        setView('home');
        showToast(`Welcome back, ${data.user.email}!`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

export async function signup(email, password) {
    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Signup failed');

        state.user = data.user;
        localStorage.setItem('harvest_token', data.token);
        localStorage.setItem('harvest_user', JSON.stringify(data.user));
        setView('home');
        showToast('Account created successfully!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

export function logout() {
    state.user = null;
    localStorage.removeItem('harvest_token');
    localStorage.removeItem('harvest_user');
    setView('home');
    showToast('Logged out successfully.');
}

// ------------------------------------------------------------------
// GLOBAL ACTIONS
// ------------------------------------------------------------------
window.verifyOrderPayment = async function (orderId) {
    const btn = event.target;
    // Simple safety check if event exists
    if (!btn) return;

    const originalText = btn.innerText;
    btn.innerText = 'Checking...';
    btn.disabled = true;

    try {
        const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        const data = await res.json();

        if (data.success && data.status === 'Paid') {
            import('../utils.js').then(u => u.showToast('Payment confirmed! Updating status...'));
            // Refresh Orders
            import('./profile_v2.js').then(m => m.loadUserOrders());
        } else {
            import('../utils.js').then(u => u.showToast(data.msg || 'Payment not yet confirmed', 'info'));
            btn.innerText = 'Check Again';
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        import('../utils.js').then(u => u.showToast('Verification failed to connect', 'error'));
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// ------------------------------------------------------------------
// CART & MARKETPLACE
// ------------------------------------------------------------------
// Helper to sync with server if logged in
async function syncCartToServer() {
    const token = localStorage.getItem('harvest_token');
    // If logged in, use token. If not, use guestId.

    let guestId = localStorage.getItem('harvest_guest_id');
    if (!guestId) {
        guestId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('harvest_guest_id', guestId);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        await fetch('/api/cart/sync', {
            method: 'POST',
            headers,
            body: JSON.stringify({ items: state.cart, guestId })
        });
    } catch (e) { console.warn("Background cart sync failed", e); }
}

export function saveCart() {
    localStorage.setItem('harvest_cart', JSON.stringify(state.cart));
    // Trigger background sync
    syncCartToServer();
}

export function loadCart() {
    const saved = localStorage.getItem('harvest_cart');
    if (saved) {
        try {
            state.cart = JSON.parse(saved);
            if (!Array.isArray(state.cart)) state.cart = [];
        } catch (e) {
            state.cart = [];
            console.warn("Corrupt cart data reset");
        }
    }
}

export async function loadMarketplace() {
    try {
        const [pRes, tRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/box-templates')
        ]);
        if (!pRes.ok) throw new Error('Failed to load products');
        const products = await pRes.json();
        const templates = tRes.ok ? await tRes.json() : [];

        // RECONCILIATION: Subtract items already in cart from "Available" stock
        // This ensures a refresh doesn't reset the optimistic lock visual
        if (state.cart && state.cart.length > 0) {
            state.cart.forEach(cartItem => {
                if (cartItem.type === 'box') return; // Boxes handled via templates (complex)
                const p = products.find(prod => String(prod.id) === String(cartItem.id));
                if (p) {
                    p.stock = Math.max(0, p.stock - cartItem.qty);
                }
            });
        }

        setMarketplaceData(products, templates);
        render(); // Re-render to show data
    } catch (e) {
        console.error(e);
    }
}

// Used primarily by Home view for Featured Products
export async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products-container');
    if (!container || !CONFIG.featuredProducts || CONFIG.featuredProducts.length === 0) return;

    try {
        const ids = CONFIG.featuredProducts;
        let items = [];

        const [products, boxes] = await Promise.all([
            fetch('/api/products').then(r => r.json()),
            // Shim boxes to look like products for the card
            fetch('/api/box-templates').then(r => r.json().then(data => data.map(b => ({ ...b, type: 'box' }))))
        ]);

        const allItems = [...products, ...boxes];
        items = ids.map(id => allItems.find(i => String(i.id) === String(id))).filter(Boolean);

        if (items.length === 0) return;

        // Cache for addToCart logic helper
        window.FEATURED_ITEMS = items;

        // Use Bento Grid if enabled, otherwise legacy list
        const title = CONFIG.meta?.featuredTitle;
        const subtitle = CONFIG.meta?.featuredSubtitle;
        const showTooltips = CONFIG.meta?.showBoxTooltips ?? true;

        if (CONFIG.meta?.useBentoGrid) {
            container.innerHTML = BentoGrid(items, { title, subtitle, showTooltips });
        } else {
            container.innerHTML = FeaturedProducts(items, { title, subtitle });
        }

    } catch (e) { console.error("Featured load failed", e); }
}


export async function addToCart(itemsOrId, type = 'product') {
    if (Array.isArray(itemsOrId)) {
        state.cart = [...state.cart, ...itemsOrId.filter(i => i.qty > 0)];
        saveCart();
        renderHeaderCount();
        showToast('Added items to cart!');
        return;
    }

    if (type === 'box') {
        await addTemplateToCart(itemsOrId);
        return;
    }

    await addProductToCart(itemsOrId);
}

export async function addProductToCart(productId) {
    const { availableProducts } = getMarketplaceData();
    let product = null;

    if (window.FEATURED_ITEMS) product = window.FEATURED_ITEMS.find(p => String(p.id) === String(productId));
    if (!product && availableProducts) product = availableProducts.find(p => String(p.id) === String(productId));

    if (!product) {
        // Fetch fallback
        try {
            const res = await fetch(`/api/products`);
            if (res.ok) {
                const all = await res.json();
                product = all.find(p => String(p.id) === String(productId));
            }
        } catch (e) { }
    }

    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    try {
        const existingIdx = state.cart.findIndex(i => String(i.id) === String(productId) && i.type !== 'box');
        const currentQty = existingIdx > -1 ? state.cart[existingIdx].qty : 0;

        const res = await fetch('/api/cart/check-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, qty: 1, currentCartQty: currentQty })
        });

        if (res.ok) {
            const existingIdx = state.cart.findIndex(i => String(i.id) === String(productId) && i.type !== 'box');

            if (existingIdx > -1) {
                state.cart[existingIdx].qty++;
            } else {
                const cartItem = {
                    ...product,
                    qty: 1,
                    price: Number(product.price || product.base_price || 0)
                };
                state.cart.push(cartItem);
            }

            saveCart();
            renderHeaderCount();

            // Optimistic UI Update (only visual, actual stock decrements on payment)
            if (availableProducts) {
                const localP = availableProducts.find(p => String(p.id) === String(productId));
                if (localP) localP.stock--;
                updateCartUI(productId, (existingIdx > -1 ? state.cart[existingIdx].qty : 1), (localP ? localP.stock : 0));
            }

            showToast(`Added ${product.name} to cart!`);
        } else {
            const err = await safeJson(res);
            if (res.status === 409) showToast('Not enough stock available', 'error');
            else showToast(err.error || 'Failed to add item', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error connecting to server', 'error');
    }
}

export async function addTemplateToCart(templateId) {
    const { availableTemplates, availableProducts } = getMarketplaceData();
    try {
        const res = await fetch('/api/cart/check-template-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateId })
        });

        if (res.ok) {
            const data = await res.json();

            const template = availableTemplates.find(t => String(t.id) === String(templateId));

            if (template) {
                const existingIdx = state.cart.findIndex(i => String(i.id) === String(templateId) && i.type === 'box');
                if (existingIdx > -1) {
                    state.cart[existingIdx].qty += 1;
                } else {
                    state.cart.push({
                        type: 'box',
                        id: template.id,
                        name: template.name,
                        price: template.base_price,
                        qty: 1,
                        image_url: template.image_url,
                        description: template.description || 'Curated Box',
                        items: data.items
                    });
                }
            }

            // Update local stock (optimistic)
            if (availableProducts) {
                data.items.forEach(newItem => {
                    const p = availableProducts.find(p => String(p.id) === String(newItem.id));
                    if (p) p.stock -= newItem.qty;
                });
            }

            saveCart();
            render(true); // Preserve scroll position
            renderHeaderCount();
            showToast('Box added to cart!');
        } else {
            const err = await safeJson(res);
            showToast(err.error || 'Failed to add box', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error adding box', 'error');
    }
}

export async function removeFromCart(index) {
    const item = state.cart[index];
    const { availableProducts } = getMarketplaceData();

    // Animate Removal (Crumple Effect)
    const el = document.getElementById(`cart-item-${index}`);
    if (el) {
        el.style.transition = 'all 0.5s ease-in';
        el.style.transform = 'scale(0.1) rotate(15deg)'; // Shrink to ball
        el.style.opacity = '0';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#d6d6d6';
        el.style.boxShadow = 'none';
        el.style.pointerEvents = 'none';
        el.style.overflow = 'hidden';
    }

    // Wait for animation before removing from state
    setTimeout(() => {
        state.cart.splice(index, 1);

        if (item.type !== 'box' && availableProducts) {
            const p = availableProducts.find(p => String(p.id) === String(item.id));
            if (p) p.stock += item.qty;
        }

        saveCart();
        render(true); // Preserve scroll position
        renderHeaderCount();
    }, 300);
}

export function updateCartUI(productId, newQty, productStock) {
    const count = state.cart.length;
    const cartBtn = document.getElementById('nav-cart-btn');
    if (cartBtn) {
        cartBtn.innerHTML = `Cart ${count > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">${count}</span>` : ''} `;
    }

    // Re-render Quantity Control if container exists (Handles Add <-> +/- transition)
    const ctrlContainer = document.getElementById(`ctrl-${productId}`);
    if (ctrlContainer) {
        // Determine layout from global config
        const isEditorial = window.CONFIG?.theme?.layout === 'editorial';
        // Need price to render "Add" button correctly if reverting to 0
        // We can find price in state.cart or AvailableProducts
        let price = 0;
        const cartItem = state.cart.find(c => String(c.id) === String(productId));
        if (cartItem) price = cartItem.price;
        else {
            const { availableProducts } = getMarketplaceData();
            const p = availableProducts ? availableProducts.find(x => String(x.id) === String(productId)) : null;
            if (p) price = p.price;
        }

        ctrlContainer.innerHTML = QuantityControl({
            id: productId,
            qty: newQty,
            price: price,
            // If qty > 0, we still want to show the control even if stock is 0 (it means we have it all)
            isStocked: productStock > 0 || newQty > 0,
            maxReached: productStock <= 0,
            layout: isEditorial ? 'editorial' : 'grid'
        });
    } else {
        // Fallback for non-refactored views (if any)
        const qtyDisplay = document.getElementById(`qty-${productId}`);
        const minusBtn = document.getElementById(`minus-${productId}`);
        if (qtyDisplay) qtyDisplay.innerText = newQty;
        if (minusBtn) minusBtn.disabled = newQty <= 0;
    }

    // Update Marketplace Header Total
    const totalEl = document.getElementById('marketplace-cart-total');
    if (totalEl) {
        const total = state.cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        totalEl.innerText = `$${total.toFixed(2)}`;
    }
}

export async function updateProductQty(productId, change) {
    const { availableProducts } = getMarketplaceData();
    const product = availableProducts ? availableProducts.find(p => String(p.id) === String(productId)) : null;
    if (!product) return;

    const cartItemIndex = state.cart.findIndex(i => String(i.id) === String(productId));
    const currentQty = cartItemIndex > -1 ? state.cart[cartItemIndex].qty : 0;

    if (change < 0) {
        if (currentQty > 0) {
            if (currentQty === 1) state.cart.splice(cartItemIndex, 1);
            else state.cart[cartItemIndex].qty--;

            product.stock++;
            saveCart();
            updateCartUI(productId, currentQty - 1, product.stock);
        }
    }
    else {
        if (product.stock <= 0) {
            showToast('Sorry, this item is out of stock.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/cart/check-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, qty: 1 })
            });

            if (res.ok) {
                if (cartItemIndex > -1) state.cart[cartItemIndex].qty++;
                else state.cart.push({ ...product, qty: 1, tags: product.tags });

                product.stock--;
                saveCart();
                updateCartUI(productId, currentQty + 1, product.stock);
                showToast(`Added ${product.name} `);
            } else {
                const err = await safeJson(res);
                if (res.status === 409) showToast('Not enough stock available', 'error');
                else showToast(err.error || 'Request failed', 'error');
                return;
            }
        } catch (e) {
            showToast('Failed to add item', 'error');
            console.error(e);
        }
    }
}


// ------------------------------------------------------------------
// ORDERS & PROFILE
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// STRIPE & CHECKOUT
// ------------------------------------------------------------------
let stripe;
let elements;
let currentOrderId;

export async function initCheckout() {
    // 1. Initialize Stripe
    if (!stripe) {
        // We assume the key is in the public config, or hardcoded for dev if missing
        const key = window.CONFIG?.stripePublishableKey || 'pk_test_...';
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
        document.getElementById("payment-element").innerHTML = `<div class="p-4 text-red-600 bg-red-50 rounded">${e.message}</div>`;
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
        // This prevents race conditions where a redirect or browser close 
        // after payment but before the callback prevents data saving.
        const legacyShipping = {
            name: billing.name, // Use the full name constructed earlier
            street: shipAddr,
            city: shipCity,
            state: shipState,
            zip: shipZip,
            phone: phone
        };

        console.log("Saving Order Details Pre-Payment...", legacyShipping);

        // We await this. If it fails, we still allow payment? 
        // Ideally no, but for resilience we might log and proceed. 
        // But if this fails, the order looks broken. Let's block on it.
        try {
            await updateBackendOrderDetails(currentOrderId, legacyShipping, deliveryWindow, email);
        } catch (saveErr) {
            console.error("Failed to save order details pre-payment", saveErr);
            // deciding to continue anyway to capture revenue, but log it.
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId,
                shipping,
                delivery_window: window,
                email: email
            })
        });
    } catch (e) { console.warn("Failed to update backend details", e); }
}

function triggerSuccessUI(email, btn) {
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


export async function loadUserOrders() {
    const m = await import('./profile_v2.js');
    return m.loadUserOrders();
}

async function loadUserOrders_LEGACY() {
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

        const statusConfig = {
            'Pending': { label: 'Received', style: 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20', desc: 'We have received your order.' },
            'Shipped': { label: 'On its Way', style: 'bg-indigo-50 text-indigo-700 border-indigo-100', desc: 'Your box has left the farm.' },
            'Delivered': { label: 'Delivered', style: 'bg-nature-100 text-nature-800 border-nature-200', desc: 'Enjoy your harvest!' },
            'Canceled': { label: 'Canceled', style: 'bg-red-50 text-red-600 border-red-100', desc: 'This order was canceled.' }
        };

        container.innerHTML = orders.map(o => {
            // Aggregate items
            const counts = {};
            o.items.forEach(i => {
                const key = i.name; // Simple aggregation
                counts[key] = counts[key] || { ...i, qty: 0 };
                counts[key].qty++;
            });
            const aggregatedItems = Object.values(counts);

            // Detailed Shipping
            const ship = o.shipping || {};
            const streetLine = ship.street || ship.address;
            const addressString = [
                streetLine,
                ship.city ? `${ship.city}, ${ship.state || 'WI'} ${ship.zip || ''}` : null
            ].filter(Boolean).join('<br>');

            let statusInfo = statusConfig[o.status] || { label: o.status, style: 'bg-stone-100 text-stone-500' };

            // Dynamic override for Pending to show Delivery Date
            if (o.status === 'Pending') {
                const deliveryDate = ship.date;
                statusInfo = {
                    label: 'Pending Delivery',
                    style: 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20',
                    desc: deliveryDate ? `Expected on ${deliveryDate}` : 'Processing...'
                };
            }

            return `
        <div class="bg-white border border-nature-100 rounded-lg p-0 shadow-sm relative group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <!-- Left accent line -->
            <div class="absolute top-0 left-0 w-1 h-full bg-nature-900 group-hover:bg-harvest-gold transition-colors"></div>

            <!-- Header -->
            <div class="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start gap-4 bg-stone-50/50 border-b border-stone-100">
                <div>
                     <div class="flex items-center gap-3 mb-2">
                         <span class="font-mono text-xs text-nature-400">#${o.id.substring(0, 8)}</span>
                         <span class="h-px w-8 bg-nature-200"></span>
                         <span class="font-sans text-xs font-bold uppercase tracking-widest text-nature-400">${new Date(o.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                     </div>
                     <h3 class="font-serif text-3xl text-nature-900 leading-none mb-1 group-hover:text-harvest-gold transition-colors">${new Date(o.date).toLocaleDateString(undefined, { weekday: 'long' })}'s Harvest</h3>
                </div>

                <div class="text-right">
                    <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusInfo.style}">
                        ${statusInfo.label}
                    </span>
                </div>
            </div>

            <!-- Items List -->
            <div class="px-6 md:px-8 py-8">
                <ul class="space-y-3 mb-8">
                    ${aggregatedItems.map(i => `
                        <li class="flex justify-between items-baseline group/item text-sm">
                            <div class="flex items-baseline gap-2 flex-1">
                                <span class="font-mono text-nature-400 w-6 text-right font-bold">${i.qty}x</span>
                                <span class="text-nature-900 font-serif font-medium tracking-wide">${i.name}</span>
                                <span class="flex-1 border-b border-dotted border-nature-200 mx-2 relative top-[-4px]"></span>
                            </div>
                            <span class="font-mono text-nature-500 font-medium">$${(i.price * i.qty).toFixed(2)}</span>
                        </li>
                    `).join('')}
                </ul>

                <!-- Footer -->
                <div class="flex flex-col sm:flex-row justify-between items-end gap-6 pt-6 border-t border-stone-100">
                     <div class="max-w-xs">
                        <div class="text-[10px] uppercase tracking-widest font-bold text-nature-400 mb-1">Delivered To</div>
                        <div class="text-nature-600 text-sm leading-relaxed font-sans">${addressString || 'Pick up at Viroqua Food Co-op'}</div>
                     </div>
                     
                     <div class="text-right">
                        <div class="text-[10px] uppercase tracking-widest font-bold text-nature-400 mb-1">Total</div>
                        <div class="text-3xl font-serif text-nature-900 font-bold">$${o.total.toFixed(2)}</div>
                     </div>
                </div>
            </div>
        </div>
        `}).join('');

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
                // Creating a mini re-render of sidebar info if needed, or just let router reload eventually
                // Ideally we call render() but if it resets tab it might be annoying.
                // Let's just update the local DOM if it exists to be snappy
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

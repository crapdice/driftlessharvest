import { state } from './state.js';
import { router as render } from './router.js';
import { renderHeaderCount } from '../views/layout.js';
import { getMarketplaceData } from '../views/marketplace.js';
import { showToast } from '../utils.js';
import { QuantityControl } from '../components/QuantityControl.js';

// Helper for safe JSON parsing needed if we copy logic that uses it
// But simple fetch wrappers might be better. 
// Let's import or dupe safeJson if needed, or just standard try/catch
// The original used `safeJson` in addToCart error handling.
async function safeJson(res) {
    try { return await res.json(); } catch (e) { return { error: `Server Error: ${res.status}` }; }
}

// ------------------------------------------------------------------
// CART & MARKETPLACE SYNC
// ------------------------------------------------------------------
async function syncCartToServer() {
    const token = localStorage.getItem('harvest_token');
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

// ------------------------------------------------------------------
// CART OPERATIONS
// ------------------------------------------------------------------

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
        const res = await fetch('/api/cart/check-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, qty: 1 })
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

            // Optimistic UI Update
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

            if (availableProducts) {
                data.items.forEach(newItem => {
                    const p = availableProducts.find(p => String(p.id) === String(newItem.id));
                    if (p) p.stock -= newItem.qty;
                });
            }

            saveCart();
            render(true);
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

    const el = document.getElementById(`cart-item-${index}`);
    if (el) {
        el.style.transition = 'all 0.5s ease-in';
        el.style.transform = 'scale(0.1) rotate(15deg)';
        el.style.opacity = '0';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#d6d6d6';
        el.style.boxShadow = 'none';
        el.style.pointerEvents = 'none';
        el.style.overflow = 'hidden';
    }

    setTimeout(() => {
        state.cart.splice(index, 1);

        if (item.type !== 'box' && availableProducts) {
            const p = availableProducts.find(p => String(p.id) === String(item.id));
            if (p) p.stock += item.qty;
        }

        saveCart();
        render(true);
        renderHeaderCount();
    }, 300);
}

export function updateCartUI(productId, newQty, productStock) {
    const count = state.cart.length;
    const cartBtn = document.getElementById('nav-cart-btn');
    if (cartBtn) {
        cartBtn.innerHTML = `Cart ${count > 0 ? `<span class="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">${count}</span>` : ''} `;
    }

    const ctrlContainer = document.getElementById(`ctrl-${productId}`);
    if (ctrlContainer) {
        const isEditorial = window.CONFIG?.theme?.layout === 'editorial';
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
            isStocked: productStock > 0,
            layout: isEditorial ? 'editorial' : 'grid'
        });
    } else {
        const qtyDisplay = document.getElementById(`qty-${productId}`);
        const minusBtn = document.getElementById(`minus-${productId}`);
        if (qtyDisplay) qtyDisplay.innerText = newQty;
        if (minusBtn) minusBtn.disabled = newQty <= 0;
    }

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

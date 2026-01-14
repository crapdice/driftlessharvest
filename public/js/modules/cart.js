import { store } from '../store/index.js';
import * as api from './api.js';
import { router as render } from './router.js';
import { renderHeaderCount } from '../views/layout.js';
import { getMarketplaceData } from '../views/marketplace.js';
import { showToast } from '../utils.js';
import { QuantityControl } from '../components/QuantityControl.js';

// ------------------------------------------------------------------
// SYNC & SUBSCRIPTIONS
// ------------------------------------------------------------------

// Sync to server on change
store.subscribe('cartUpdated', async (cart) => {
    // 1. Sync to Server
    const token = localStorage.getItem('harvest_token');
    let guestId = localStorage.getItem('harvest_guest_id');
    if (!guestId) {
        guestId = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('harvest_guest_id', guestId);
    }

    try {
        await api.syncCart(cart.items, guestId);
    } catch (e) {
        console.warn("Background cart sync failed", e);
    }

    // 2. Update Header UI
    renderHeaderCount();
});

// Initial Load
export function loadCart() {
    // Store loads from localstorage on init
    // Just force header render
    renderHeaderCount();
}

// ------------------------------------------------------------------
// CART ACTIONS (Called by UI)
// ------------------------------------------------------------------

export async function addToCart(itemsOrId, type = 'product') {
    if (Array.isArray(itemsOrId)) {
        // Bulk add (e.g. reorder)
        itemsOrId.forEach(item => store.addToCart(item, item.qty, item.isBox));
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
    let product = store.state.products.find(p => String(p.id) === String(productId));

    // Fallback search if not in store (e.g. direct link deep dive?)
    if (!product) {
        try {
            const all = await api.fetchProducts();
            product = all.find(p => String(p.id) === String(productId));
        } catch (e) { }
    }

    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    try {
        // Check Stock against TOTAL quantity (Current + 1)
        const currentItem = store.getCart().items.find(i => String(i.id) === String(productId));
        const currentQty = currentItem ? currentItem.qty : 0;

        const res = await api.checkStock(productId, currentQty + 1);

        // Add to Store
        store.addToCart(product, 1);

        // Optimistic UI Stock Update (Local only)
        if (availableProducts) {
            const localP = availableProducts.find(p => String(p.id) === String(productId));
            if (localP) localP.stock--;
        }

        // Trigger UI refresh for specific item control if visible
        updateCartItemUI(productId);

        showToast(`Added ${product.name} to cart!`);

    } catch (e) {
        console.error(e);
        if (e.message && e.message.includes('stock')) showToast(e.message, 'error');
        else showToast('Failed to add item', 'error');
    }
}

export async function addTemplateToCart(templateId) {
    try {
        const res = await api.checkTemplateStock(templateId);

        // Ideally we get the template details from store or response
        let template = store.state.templates.find(t => String(t.id) === String(templateId));

        if (!template && res.items) {
            // Fallback if template not in cache but we have ID? 
            // Logic assumes we have it. If not, we might need to fetch it.
        }

        if (template) {
            store.addToCart({
                id: template.id,
                name: template.name,
                price: template.base_price,
                image_url: template.image_url,
                description: template.description || 'Curated Box',
                items: res.items, // The contents determine availability
                isBox: true
            }, 1, true);

            showToast('Box added to cart!');
            renderHeaderCount(); // Ensure header updates
            // Force re-render of cart view if open?
            // render(true); 
        }

    } catch (e) {
        showToast(e.message || 'Failed to add box', 'error');
    }
}

export async function removeFromCart(index) {
    const cart = store.getCart();
    const item = cart.items[index];
    if (!item) return;

    // UI Animation (keep existing logic)
    const el = document.getElementById(`cart-item-${index}`);
    if (el) {
        el.style.opacity = '0';
        // ... omitted stylistic animation for brevity, assuming CSS handles transition class
    }

    setTimeout(() => {
        // We need an ID to remove from store. Store uses ID. 
        // But Store.removeFromCart(itemId) removes ALL instances?
        // Wait, store logic: "this.state.cart.items = this.state.cart.items.filter(i => i.id !== itemId);"
        // This removes the item entirely. The UI index based removal suggests unique rows?
        // Yes, store logic seems to align with 1 row per product ID.
        store.removeFromCart(item.id);
        render(true); // Re-render cart view
    }, 300);
}

export async function updateProductQty(productId, change) {
    const cart = store.getCart();
    const item = cart.items.find(i => String(i.id) === String(productId));
    const currentQty = item ? item.qty : 0;
    const newQty = Math.max(0, currentQty + change);

    if (newQty > currentQty) {
        // Increasing

        // If item is not in cart yet, add it properly
        if (currentQty === 0) {
            await addProductToCart(productId);
            return;
        }

        // Check Stock for increment (Total new quantity vs Stock)
        try {
            await api.checkStock(productId, newQty);
            store.updateCartQty(productId, newQty);
        } catch (e) {
            showToast(e.message || 'Not enough stock', 'error');
        }
    } else {
        // Decreasing
        store.updateCartQty(productId, newQty);
    }

    updateCartItemUI(productId);
}

// Internal UI Helper to update specific controls without full re-render
function updateCartItemUI(productId) {
    const { availableProducts } = getMarketplaceData();
    const product = availableProducts ? availableProducts.find(p => String(p.id) === String(productId)) : null;
    const cartItem = store.getCart().items.find(c => String(c.id) === String(productId));
    const newQty = cartItem ? cartItem.qty : 0;

    // Update Quantity Control if present
    const ctrlContainer = document.getElementById(`ctrl-${productId}`);
    if (ctrlContainer) {
        const isEditorial = window.CONFIG?.theme?.layout === 'editorial';
        const price = cartItem ? cartItem.price : (product ? product.price : 0);

        ctrlContainer.innerHTML = QuantityControl({
            id: productId,
            qty: newQty,
            price: price,
            isStocked: (product ? product.stock : 0) > 0,
            layout: isEditorial ? 'editorial' : 'grid'
        });
    }

    // Update Total
    const totalEl = document.getElementById('marketplace-cart-total');
    if (totalEl) {
        totalEl.innerText = `$${store.getCart().total.toFixed(2)}`;
    }
}

// Deprecated / Bridge methods
export function saveCart() { store.saveCart(); }
export function updateCartUI(pid, qty, stock) { updateCartItemUI(pid); }

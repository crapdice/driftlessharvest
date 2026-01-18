/**
 * Simple Pub/Sub Store for Harvest Storefront
 * Replaces global variables (window.cart, window.FEATURED_ITEMS)
 * and decouples UI from Data.
 */

class Store {
    constructor() {
        this.events = {};
        this.state = {
            user: null,
            products: [],      // All products cache
            featured: [],      // Featured products list
            templates: [],     // Box templates
            cart: {
                items: [],
                total: 0
            },
            config: {}         // Site config
        };

        // Load initial state from local storage if available
        this.loadCart();
        this.loadSession();
    }

    /**
     * Subscribe to state changes
     * @param {string} event - Event name (e.g., 'cartUpdated')
     * @param {function} callback 
     */
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return () => this.unsubscribe(event, callback); // Return generic unsubscribe function
    }

    unsubscribe(event, callback) {
        if (!this.events[event]) return;
        this.events[event].forEach(cb => cb !== callback);
    }

    publish(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }

    /**
     * Core Actions
     */

    setUser(user) {
        this.state.user = user;
        if (user) {
            localStorage.setItem('harvest_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('harvest_user');
            // Token cleared via API logout - not stored in localStorage anymore
        }
        this.publish('userChanged', user);
    }

    loadSession() {
        try {
            // Token validation happens server-side via cookie
            // Only restore user object for UI state
            const savedUser = localStorage.getItem('harvest_user');
            if (savedUser) {
                this.state.user = JSON.parse(savedUser);
            }
        } catch (e) {
            console.warn("Failed to restore session", e);
            localStorage.removeItem('harvest_user');
            this.state.user = null;
        }
    }

    setProducts(products) {
        this.state.products = products;
        this.publish('productsLoaded', products);
    }

    setFeatured(products) {
        this.state.featured = products;
        this.publish('featuredLoaded', products);
    }

    setTemplates(templates) {
        this.state.templates = templates;
        this.publish('templatesLoaded', templates);
    }

    setConfig(config) {
        this.state.config = config;
        this.publish('configLoaded', config);
    }

    // --- Cart Actions ---

    loadCart() {
        const saved = localStorage.getItem('harvest_cart');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Schema Migration: If it's an array (Legacy), wrap it.
                if (Array.isArray(parsed)) {
                    this.state.cart = {
                        items: parsed,
                        total: parsed.reduce((sum, item) => sum + (item.price * item.qty), 0)
                    };
                } else if (parsed && Array.isArray(parsed.items)) {
                    this.state.cart = parsed;
                } else {
                    // Invalid/Unknown format, reset
                    this.state.cart = { items: [], total: 0 };
                }
            } catch (e) {
                console.error("Failed to parse cart", e);
                localStorage.removeItem('harvest_cart');
                this.state.cart = { items: [], total: 0 };
            }
        }
    }

    saveCart() {
        localStorage.setItem('harvest_cart', JSON.stringify(this.state.cart));
        this.publish('cartUpdated', this.state.cart);
    }

    addToCart(product, qty = 1, isBox = false) {
        const existing = this.state.cart.items.find(i => String(i.id) === String(product.id) && i.isBox === isBox);

        if (existing) {
            existing.qty += qty;
        } else {
            this.state.cart.items.push({
                ...product,
                qty,
                isBox // Flag to distinguish Templates from Products
            });
        }

        this._recalcCart();
    }

    removeFromCart(itemId) {
        this.state.cart.items = this.state.cart.items.filter(i => String(i.id) !== String(itemId));
        this._recalcCart();
    }

    updateCartQty(itemId, qty) {
        const item = this.state.cart.items.find(i => String(i.id) === String(itemId));
        if (item) {
            item.qty = Math.max(0, qty);
            if (item.qty === 0) {
                this.removeFromCart(itemId);
                return;
            }
        }
        this._recalcCart();
    }

    clearCart() {
        this.state.cart = { items: [], total: 0 };
        this.saveCart();
    }

    _recalcCart() {
        this.state.cart.total = this.state.cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        this.saveCart();
    }

    // --- Selectors ---

    getCart() { return this.state.cart; }
    getCartCount() { return this.state.cart.items.reduce((sum, item) => sum + item.qty, 0); }
    getUser() { return this.state.user; }
    getState() { return this.state; }
}

// Export singleton
export const store = new Store();
window.harvestStore = store; // Temporary exposure for debugging/migration

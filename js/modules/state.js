
/**
 * Global App State
 */
export const state = {
    view: "home",
    user: null, // { email, address, role }
    cart: []    // Array of items
};

// Simple event bus for state changes if needed
// For now, we stick to the mutable object pattern used in script.js to minimize friction during refactor

export function savedState() {
    try {
        const token = localStorage.getItem('harvest_token');
        const savedUser = localStorage.getItem('harvest_user');
        if (token && savedUser) {
            state.user = JSON.parse(savedUser);
        }

        const savedCart = localStorage.getItem('harvest_cart');
        if (savedCart) {
            state.cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.warn("Failed to restore state", e);
    }
}

export function saveCart() {
    localStorage.setItem('harvest_cart', JSON.stringify(state.cart));
}

export function clearCart() {
    state.cart = [];
    localStorage.removeItem('harvest_cart');
}

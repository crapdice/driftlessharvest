/**
 * Orders State Management
 */

let ordersCache = [];
let templatesCache = [];
let productsCache = [];
let currentOrderItems = [];
let activeOrderSearch = '';

export const state = {
    // Getters
    getOrders: () => ordersCache,
    getTemplates: () => templatesCache,
    getProducts: () => productsCache,
    getCurrentItems: () => currentOrderItems,
    getSearchQuery: () => activeOrderSearch,

    // Setters
    setOrders: (data) => ordersCache = data,
    setTemplates: (data) => templatesCache = data,
    setProducts: (data) => productsCache = data,
    setSearchQuery: (query) => activeOrderSearch = query.trim().toLowerCase(),

    // Order Item Mutators (for editing)
    setCurrentItems: (items) => currentOrderItems = JSON.parse(JSON.stringify(items)),
    updateCurrentItemQty: (idx, qty) => {
        if (currentOrderItems[idx]) currentOrderItems[idx].qty = parseInt(qty);
    },
    removeCurrentItem: (idx) => {
        currentOrderItems.splice(idx, 1);
    },
    addCurrentItem: (item) => {
        const existing = currentOrderItems.find(i => i.product_id === item.product_id || i.name === item.name);
        if (existing) {
            existing.qty += item.qty;
        } else {
            currentOrderItems.push(item);
        }
    },

    // Helpers
    findOrder: (id) => ordersCache.find(o => String(o.id) === String(id)),
    findProduct: (id) => productsCache.find(p => p.id === id),
    findTemplate: (name) => templatesCache.find(t => t.name === name)
};

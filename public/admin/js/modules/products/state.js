/**
 * Products State Management
 * 
 * Centralized state for products, templates, and inventory.
 * Follows the pattern established in orders/state.js
 */

let productsCache = [];
let templatesCache = [];
let currentTemplateItems = [];
let pollInterval = null;

export const state = {
    // Getters
    getProducts: () => productsCache,
    getTemplates: () => templatesCache,
    getCurrentTemplateItems: () => currentTemplateItems,
    getPollInterval: () => pollInterval,

    // Setters
    setProducts: (data) => { productsCache = data; },
    setTemplates: (data) => { templatesCache = data; },
    setCurrentTemplateItems: (items) => { currentTemplateItems = items; },
    setPollInterval: (interval) => { pollInterval = interval; },

    // Template Item Mutators
    addTemplateItem: (item) => { currentTemplateItems.push(item); },
    updateTemplateItem: (idx, updates) => {
        if (currentTemplateItems[idx]) {
            Object.assign(currentTemplateItems[idx], updates);
        }
    },
    removeTemplateItem: (idx) => { currentTemplateItems.splice(idx, 1); },
    clearTemplateItems: () => { currentTemplateItems = []; },

    // Helpers
    findProduct: (id) => productsCache.find(p => String(p.id) === String(id)),
    findTemplate: (id) => templatesCache.find(t => String(t.id) === String(id)),

    // Polling Control
    startPolling: (callback, intervalMs = 30000) => {
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(callback, intervalMs);
    },
    stopPolling: () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }
};

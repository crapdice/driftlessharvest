/**
 * ActionDispatcher - Central Event Delegation System
 * 
 * Replaces window.* bindings with data-action attributes.
 * Uses event delegation for efficient click handling.
 * 
 * Usage:
 *   HTML: <button data-action="products:archive" data-id="123">Archive</button>
 *   JS:   registerActions('products', { archive: (data) => archiveProduct(data.id) });
 * 
 * @module core/ActionDispatcher
 */

// Handler registry: namespace -> { action: handler }
const handlers = new Map();

// Track if initialized
let initialized = false;

/**
 * Register action handlers for a namespace.
 * @param {string} namespace - Module namespace (e.g., 'products', 'orders')
 * @param {Object} actions - Map of action names to handler functions
 */
export function registerActions(namespace, actions) {
    if (handlers.has(namespace)) {
        // Merge with existing handlers
        const existing = handlers.get(namespace);
        handlers.set(namespace, { ...existing, ...actions });
    } else {
        handlers.set(namespace, actions);
    }
}

/**
 * Programmatically dispatch an action.
 * @param {string} namespace - Module namespace
 * @param {string} action - Action name
 * @param {Object} data - Data to pass to handler
 * @returns {*} Handler return value
 */
export function dispatch(namespace, action, data = {}) {
    const handler = handlers.get(namespace)?.[action];
    if (handler) {
        return handler(data, null);
    }
    console.warn(`[ActionDispatcher] No handler for ${namespace}:${action}`);
    return undefined;
}

/**
 * Initialize event delegation on document.
 * Call once on DOMContentLoaded.
 */
export function init() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('click', (e) => {
        // Find closest element with data-action
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const actionStr = target.dataset.action;
        if (!actionStr || !actionStr.includes(':')) {
            console.warn('[ActionDispatcher] Invalid data-action format:', actionStr);
            return;
        }

        const [namespace, action] = actionStr.split(':');
        const handler = handlers.get(namespace)?.[action];

        if (handler) {
            e.preventDefault();
            e.stopPropagation();

            // Pass all data-* attributes to handler
            handler(target.dataset, e);
        } else {
            console.warn(`[ActionDispatcher] No handler for ${namespace}:${action}`);
        }
    });

    // Also handle change events for inputs/selects
    document.addEventListener('change', (e) => {
        const target = e.target.closest('[data-action-change]');
        if (!target) return;

        const actionStr = target.dataset.actionChange;
        if (!actionStr || !actionStr.includes(':')) return;

        const [namespace, action] = actionStr.split(':');
        const handler = handlers.get(namespace)?.[action];

        if (handler) {
            handler({ ...target.dataset, value: target.value }, e);
        }
    });
}

/**
 * Get registered handlers for testing/debugging.
 * @returns {Map} Handler registry
 */
export function getHandlers() {
    return handlers;
}

/**
 * Clear all handlers (for testing).
 */
export function clearHandlers() {
    handlers.clear();
    initialized = false;
}

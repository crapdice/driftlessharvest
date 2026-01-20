/**
 * App Actions - Registered handlers for global admin functionality.
 * Uses ActionDispatcher event delegation.
 * 
 * @module core/AppActions
 */

import { registerActions } from './ActionDispatcher.js';

// Track registration state
let registered = false;

/**
 * Register all app-level actions.
 * Called once on DOMContentLoaded.
 */
export function registerAppActions() {
    if (registered) return;
    registered = true;

    registerActions('app', {
        // Theme toggle
        cycleTheme: () => {
            if (typeof window.cycleTheme === 'function') {
                window.cycleTheme();
            }
        },

        // Logout
        logout: () => {
            if (typeof window.logout === 'function') {
                window.logout();
            }
        }
    });

    registerActions('inventory', {
        // Sortable columns
        sort: (data) => {
            const field = data.field;
            if (typeof window.sortInventory === 'function') {
                window.sortInventory(field);
            }
        }
    });

    registerActions('delivery', {
        // Add delivery window
        addWindow: () => {
            if (typeof window.addDeliveryWindow === 'function') {
                window.addDeliveryWindow();
            }
        }
    });

    console.log('[AppActions] Registered app, inventory, delivery actions.');
}

/**
 * UtilitiesActions - Registered handlers for utilities module.
 * Uses ActionDispatcher event delegation.
 * 
 * @module core/UtilitiesActions
 */

import { registerActions } from './ActionDispatcher.js';

let registered = false;

/**
 * Register all utilities actions.
 * Called once on DOMContentLoaded.
 */
export function registerUtilitiesActions() {
    if (registered) return;
    registered = true;

    registerActions('utilities', {
        // === Stats ===
        refreshStats: () => window.refreshQuickStats?.(),

        // === Seeding ===
        seedUsers: () => window.seedUsers?.(),
        seedOrders: () => window.seedOrders?.(),

        // === Verification ===
        verifyDatabase: () => window.verifyDatabase?.(),

        // === Cleanup (Destructive) ===
        cleanOrders: () => window.cleanOrders?.(),
        cleanUsers: () => window.cleanUsers?.(),
        cleanAnalytics: () => window.cleanAnalytics?.(),
        cleanDeliveryWindows: () => window.cleanDeliveryWindows?.(),
        cleanDatabase: () => window.cleanDatabase?.(),
        cleanTempFiles: () => window.cleanTempFiles?.(),

        // === Table Inspection ===
        viewAllUsers: () => window.viewAllUsers?.(),
        viewAllOrders: () => window.viewAllOrders?.(),
        viewAllProducts: () => window.viewAllProducts?.(),
        viewDeliveryWindows: () => window.viewDeliveryWindows?.(),
        viewAddresses: () => window.viewAddresses?.(),
        viewCategories: () => window.viewCategories?.(),
        viewFarms: () => window.viewFarms?.(),
        viewPayments: () => window.viewPayments?.(),
        viewOrderItems: () => window.viewOrderItems?.(),
        viewAnalyticsEvents: () => window.viewAnalyticsEvents?.(),
        viewBoxTemplates: () => window.viewBoxTemplates?.(),
        viewBoxItems: () => window.viewBoxItems?.(),
        viewLaunchSignups: () => window.viewLaunchSignups?.()
    });

    console.log('[UtilitiesActions] Registered 21 utilities actions.');
}

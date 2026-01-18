/**
 * Orders Module Entry Point
 * Refactored to MVC pattern in ./orders/
 */
import { controller } from './orders/controller.js';

export const loadOrders = () => controller.loadOrders();
export const openEditOrderModal = (id) => controller.openEditOrderModal(id);
export const saveOrderDetails = () => controller.saveOrderDetails();
// Other globals are bound to window in controller.js

export async function initOrders() {
    const container = document.getElementById('view-orders');
    if (!container) return;

    // Load HTML if not already loaded (use data attribute for robustness)
    if (!container.dataset.loaded) {
        try {
            const response = await fetch('views/orders.html');
            if (response.ok) {
                container.innerHTML = await response.text();
                container.dataset.loaded = 'true';
            } else {
                console.error("Failed to load orders view");
                container.innerHTML = '<div class="p-4 text-red-500">Error loading orders view</div>';
            }
        } catch (e) {
            console.error("Error loading orders template", e);
        }
    }

    await loadOrders();
}

/**
 * Orders Controller
 */
import { api } from '../api.js';
import { showToast } from '../utils.js';
import { state } from './state.js';
import * as UI from './ui.js';

// Order modals loader (fired once on first modal open)
let orderModalsLoaded = false;
async function ensureOrderModalsLoaded() {
    if (orderModalsLoaded) return;
    const container = document.getElementById('order-modals-container');
    if (!container) {
        console.error('order-modals-container not found');
        return;
    }
    try {
        const response = await fetch('views/order-modals.html');
        if (response.ok) {
            container.innerHTML = await response.text();
            orderModalsLoaded = true;
        }
    } catch (e) {
        console.error('Failed to load order modals:', e);
    }
}

// Export so delivery.js can use it
export { ensureOrderModalsLoaded };

export const controller = {
    // ------------------------------------
    // Initialization
    // ------------------------------------
    async loadOrders() {
        try {
            const [orders, templates, products] = await Promise.all([
                api.getOrders(),
                api.getBoxTemplates(),
                api.getProducts()
            ]);

            state.setOrders(orders);
            state.setTemplates(templates);
            state.setProducts(products);

            this.render();
        } catch (e) {
            console.error(e);
            showToast("Failed to load orders", "error");
        }
    },

    render() {
        const query = state.getSearchQuery();
        let orders = state.getOrders();

        if (query) {
            orders = orders.filter(o => {
                const shipping = o.shipping_details || {};
                const name = (shipping.name || o.userEmail || '').toLowerCase();
                const email = (o.userEmail || '').toLowerCase();
                const id = String(o.id).toLowerCase();
                return name.includes(query) || email.includes(query) || id.includes(query);
            });
        }

        UI.renderOrdersTable(orders, state.getTemplates(), state.getProducts(), query);
    },

    searchOrders(query) {
        state.setSearchQuery(query);
        this.render();
    },

    toggleOrderDetails(id) {
        const row = document.getElementById(`details-${id}`);
        if (row) row.classList.toggle('hidden');
    },

    // ------------------------------------
    // Order Editing
    // ------------------------------------
    async openEditOrderModal(orderId) {
        await ensureOrderModalsLoaded();
        const order = state.findOrder(orderId);
        if (!order) return;

        document.getElementById('oe-id').value = order.id;
        document.getElementById('oe-status').value = order.status;

        const shipping = order.shipping_details || {};
        document.getElementById('oe-address').value = shipping.street || '';
        document.getElementById('oe-city').value = shipping.city || '';
        document.getElementById('oe-zip').value = shipping.zip || '';

        state.setCurrentItems(order.items);
        UI.renderEditModalItems(state.getCurrentItems());

        // Picker Population
        const picker = document.getElementById('oe-product-select');
        if (picker.children.length === 0) {
            const products = state.getProducts(); // Should be cached already
            picker.innerHTML = products.map(p => `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}">${p.name} ($${p.price})</option>`).join('');
        }

        const modal = document.getElementById('order-edit-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    updateOrderItemQty(idx, qty) {
        state.updateCurrentItemQty(idx, qty);
        UI.renderEditModalItems(state.getCurrentItems());
    },

    removeOrderItem(idx) {
        state.removeCurrentItem(idx);
        UI.renderEditModalItems(state.getCurrentItems());
    },

    addOrderItem() {
        const select = document.getElementById('oe-product-select');
        const qtyInput = document.getElementById('oe-qty-input');
        const option = select.options[select.selectedIndex];
        if (!option) return;

        state.addCurrentItem({
            product_id: option.value,
            name: option.dataset.name,
            price: parseFloat(option.dataset.price),
            qty: parseInt(qtyInput.value) || 1
        });

        UI.renderEditModalItems(state.getCurrentItems());
        qtyInput.value = 1;
    },

    async saveOrderDetails() {
        const id = document.getElementById('oe-id').value;
        const status = document.getElementById('oe-status').value;

        const updateData = {
            shipping_details: {
                street: document.getElementById('oe-address').value,
                city: document.getElementById('oe-city').value,
                zip: document.getElementById('oe-zip').value
            },
            items: state.getCurrentItems(),
            status: status
        };

        try {
            await api.updateOrderDetails(id, updateData);

            // If status changed via modal (optional, mostly use inline now)
            // We can detect if status input is present and different??
            // For now, let's trust API update.

            showToast("Order updated successfully");
            document.getElementById('order-edit-modal').classList.add('hidden');
            document.getElementById('order-edit-modal').classList.remove('flex');
            this.loadOrders();
        } catch (e) {
            console.error(e);
            showToast("Failed to update order", "error");
        }
    },

    // ------------------------------------
    // Payment & Reschedule
    // ------------------------------------
    async syncPayment(orderId) {
        const btn = document.getElementById(`sync-btn-${orderId}`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Syncing...';
        }

        try {
            const data = await api.syncPayment(orderId); // Uses API client now
            if (data.success) {
                showToast(data.msg, "success");
                this.loadOrders();
            } else {
                showToast(data.msg, "warning");
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Check Payment Status';
                }
            }
        } catch (e) {
            console.error(e);
            showToast("Sync request failed", "error");
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Retry Sync';
            }
        }
    },

    async openDateModal(orderId) {
        await ensureOrderModalsLoaded();
        document.getElementById('reschedule-order-id').value = orderId;
        const container = document.getElementById('reschedule-options');
        container.innerHTML = '<div class="text-sm text-gray-400">Loading windows...</div>';

        const modal = document.getElementById('reschedule-modal');
        modal.style.display = 'flex';

        try {
            const allWindows = await api.getDeliveryWindows();
            const windows = allWindows.filter(w => w.is_active);

            if (!windows.length) {
                container.innerHTML = '<div class="text-sm text-red-500">No active delivery windows found.</div>';
                return;
            }

            container.innerHTML = windows.map(w => `
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-400 cursor-pointer group transition-colors bg-white">
                    <input type="radio" name="delivery-window" value="${w.date_label}" class="text-blue-600 focus:ring-blue-500 h-4 w-4">
                    <span class="ml-3 text-sm font-medium text-gray-700 group-hover:text-blue-700">${w.date_label}</span>
                </label>
            `).join('');
        } catch (e) {
            container.innerHTML = '<div class="text-sm text-red-500">Failed to load windows.</div>';
        }
    },

    async saveReschedule() {
        const id = document.getElementById('reschedule-order-id').value;
        const selected = document.querySelector('input[name="delivery-window"]:checked');

        if (!selected) {
            showToast("Please select a window", "error");
            return;
        }

        try {
            await api.updateOrderDelivery(id, selected.value);
            showToast("Order rescheduled");
            document.getElementById('reschedule-modal').style.display = 'none';
            this.loadOrders();
        } catch (e) {
            showToast("Failed to reschedule", "error");
        }
    },
    async quickUpdateStatus(id, newStatus) {
        // Optimistic UI could happen here, but safely wait for API
        try {
            // Use dedicated status endpoint
            await api.updateOrderStatus(id, newStatus);
            showToast(`Order marked as ${newStatus}`, "success");
            this.loadOrders();
        } catch (e) {
            console.error(e);
            showToast("Failed to update status", "error");
        }
    }
};

// Bind to Window for HTML event handlers
window.ordersController = controller;
window.searchOrders = (q) => controller.searchOrders(q);
window.loadOrders = () => controller.loadOrders();
window.saveOrderDetails = () => controller.saveOrderDetails();
window.saveReschedule = () => controller.saveReschedule();
window.addOrderItem = () => controller.addOrderItem();
window.toggleOrderDetails = (id) => controller.toggleOrderDetails(id);

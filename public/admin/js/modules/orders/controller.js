/**
 * Orders Controller
 */
import { api } from '../api.js';
import { showToast } from '../utils.js';
import { state } from './state.js';
import * as UI from './ui.js';

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

            // Render active view
            if (this.currentView === 'map') {
                this.renderMap();
            } else {
                this.renderList();
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to load orders", "error");
        }
    },

    toggleView(viewName) {
        this.currentView = viewName;

        // Update Buttons
        const listBtn = document.getElementById('btn-view-list');
        const mapBtn = document.getElementById('btn-view-map');

        if (viewName === 'map') {
            listBtn.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
            listBtn.classList.add('text-gray-500', 'hover:text-gray-700');

            mapBtn.classList.add('bg-white', 'text-gray-800', 'shadow-sm');
            mapBtn.classList.remove('text-gray-500', 'hover:text-gray-700');

            document.getElementById('view-list').classList.add('hidden');
            document.getElementById('view-map').classList.remove('hidden');
            document.getElementById('view-map').classList.add('flex');

            this.renderMap(); // Initial render if needed
        } else {
            mapBtn.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
            mapBtn.classList.add('text-gray-500', 'hover:text-gray-700');

            listBtn.classList.add('bg-white', 'text-gray-800', 'shadow-sm');
            listBtn.classList.remove('text-gray-500', 'hover:text-gray-700');

            document.getElementById('view-map').classList.add('hidden');
            document.getElementById('view-map').classList.remove('flex');
            document.getElementById('view-list').classList.remove('hidden');

            this.renderList(); // Ensure list is fresh
        }
    },

    renderList() {
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

    renderMap() {
        const orders = state.getOrders();
        // We need to implement renderMap in UI first, but calling it here as placeholder
        if (UI.renderMapMarkers) {
            UI.renderMapMarkers(orders);
        }
        if (UI.renderMapList) {
            UI.renderMapList(orders);
        }
    },

    render() {
        // This render method is now deprecated or should call renderList/renderMap based on currentView
        // For now, it will just call renderList to maintain existing functionality if not using toggleView
        this.renderList();
    },

    searchOrders(query) {
        state.setSearchQuery(query);
        if (this.currentView === 'map') {
            this.renderMap();
        } else {
            this.renderList();
        }
    },

    toggleOrderDetails(id) {
        // Legacy Accordion - Keeping for fallback or removal
        const row = document.getElementById(`details-${id}`);
        if (row) row.classList.toggle('hidden');
    },

    selectOrder(id) {
        const order = state.findOrder(id);
        if (!order) return;

        const html = UI.renderOrderDrawer(order);
        document.getElementById('order-drawer-content').innerHTML = html;

        const drawer = document.getElementById('order-drawer');
        drawer.classList.remove('translate-x-full');

        const backdrop = document.getElementById('drawer-backdrop');
        backdrop.classList.remove('hidden');
    },

    closeDrawer() {
        const drawer = document.getElementById('order-drawer');
        drawer.classList.add('translate-x-full');

        const backdrop = document.getElementById('drawer-backdrop');
        backdrop.classList.add('hidden');
    },

    // ------------------------------------
    // Order Editing
    // ------------------------------------
    async openEditOrderModal(orderId) {
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
            showToast(`Order marked as ${newStatus}`);

            // Refresh LIST
            await this.loadOrders();

            // Refresh DRAWER if open and matching ID
            // We can check if the drawer is currently showing this ID
            // Or simpler: just re-call selectOrder(id) if the drawer contains this ID header
            const currentDrawerTitle = document.querySelector('#order-drawer-content h3'); // weak check
            // Better: state.findOrder(id) will be updated by loadOrders, so just re-select
            // Check if the drawer is actually open
            const drawer = document.getElementById('order-drawer');
            // We need to know which order is currently in the drawer. 
            // Let's store a data attribute on the drawer content?
            // Or, simpler hack: if the user clicked the button INSIDE the drawer, they are viewing it.

            // Re-render the drawer with the NEW state
            if (!drawer.classList.contains('translate-x-full')) {
                // Only if it's the SAME order
                // We can re-select it safely.
                // To be safe, let's just re-select it. 
                // If the user was viewing a DIFFERENT order (unlikely if they clicked a button), this might jump.
                // But quickUpdateStatus comes from the drawer buttons usually.
                this.selectOrder(id);
            }

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

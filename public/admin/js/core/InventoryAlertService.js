/**
 * InventoryAlertService
 * 
 * Dedicated service for checking low stock inventory status.
 * Uses a lightweight API endpoint instead of fetching all products.
 * 
 * Usage:
 *   import { inventoryAlertService } from './core/InventoryAlertService.js';
 *   inventoryAlertService.start();  // Begin polling
 *   inventoryAlertService.stop();   // Stop polling
 */

class InventoryAlertService {
    #pollInterval = null;
    #pollIntervalMs = 5000;
    #threshold = 10;
    #indicatorId = 'inventory-alert-indicator';

    /**
     * Start polling for inventory status
     */
    start() {
        this.stop(); // Clear any existing interval

        // Read threshold from global config if available
        if (window.globalConfig?.meta?.inventoryAlertLevel) {
            this.#threshold = window.globalConfig.meta.inventoryAlertLevel;
        }

        this.check(); // Immediate check
        this.#pollInterval = setInterval(() => this.check(), this.#pollIntervalMs);
        console.log(`[InventoryAlertService] Started polling (threshold: ${this.#threshold})`);
    }

    /**
     * Stop polling and hide indicator
     */
    stop() {
        if (this.#pollInterval) {
            clearInterval(this.#pollInterval);
            this.#pollInterval = null;
            console.log('[InventoryAlertService] Stopped polling');
        }
        this.#hideIndicator();
    }

    /**
     * Check inventory status once (can be called manually)
     */
    async check() {
        try {
            const token = localStorage.getItem('harvest_token');
            const res = await fetch(`/api/admin/inventory-status?threshold=${this.#threshold}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                console.warn('[InventoryAlertService] Failed to fetch status');
                return;
            }

            const data = await res.json();
            this.#updateIndicator(data.lowStockCount, data.products || []);

            // Dispatch custom event for extensibility
            window.dispatchEvent(new CustomEvent('inventory:status', {
                detail: { lowStockCount: data.lowStockCount, threshold: data.threshold, products: data.products }
            }));

        } catch (e) {
            console.error('[InventoryAlertService] Check failed:', e);
        }
    }

    /**
     * Update the navbar indicator badge and tooltip
     */
    #updateIndicator(count, products = []) {
        const indicator = document.getElementById(this.#indicatorId);
        if (!indicator) return;

        console.log(`[InventoryAlertService] Updating indicator: count=${count}, products=`, products);

        if (count > 0) {
            indicator.classList.remove('hidden');

            // Update the tooltip list
            const list = document.getElementById('inventory-alert-list');
            if (list) {
                if (products.length === 0) {
                    list.innerHTML = '<li class="px-3 py-2 text-xs text-gray-500 italic">No products returned</li>';
                } else {
                    list.innerHTML = products.map(p => `
                        <li class="px-3 py-1.5 flex items-center justify-between hover:bg-gray-800/50">
                            <span class="text-xs text-gray-300 truncate max-w-[160px]">${this.#escapeHtml(p.name)}</span>
                            <span class="text-xs font-mono font-bold ${p.stock === 0 ? 'text-rose-400' : 'text-amber-400'}">${p.stock}</span>
                        </li>
                    `).join('');
                }
            }
        } else {
            indicator.classList.add('hidden');
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    #escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Hide the navbar indicator
     */
    #hideIndicator() {
        const indicator = document.getElementById(this.#indicatorId);
        if (indicator) indicator.classList.add('hidden');
    }

    /**
     * Set the low stock threshold
     */
    setThreshold(threshold) {
        this.#threshold = threshold;
    }

    /**
     * Check if currently polling
     */
    isRunning() {
        return this.#pollInterval !== null;
    }
}

// Singleton instance
export const inventoryAlertService = new InventoryAlertService();

// Also expose on window for debugging
window.inventoryAlertService = inventoryAlertService;

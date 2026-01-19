import { api } from './api.js';
import { showToast, formatCurrency } from './utils.js';

let productsCache = [];
let templatesCache = [];
let ordersCache = [];

export async function initPrototypes(version) {
    const container = document.getElementById('proto-content-area');
    if (!container) return;

    try {
        const [products, templates, orders] = await Promise.all([
            api.getProducts(),
            api.getBoxTemplates(),
            api.getOrders()
        ]);
        productsCache = products;
        templatesCache = templates;
        ordersCache = orders;

        const response = await fetch(`prototypes/inventory_v${version}.html`);
        if (response.ok) {
            container.innerHTML = await response.text();
            renderPrototypeContent(version);
        }
    } catch (e) {
        console.error("Error loading prototype", e);
        showToast("Failed to load prototype", "error");
    }
}

function renderPrototypeContent(version) {
    switch (version) {
        case 1: renderV1Harvest(); break;
        case 2: renderV2Impact(); break;
        case 3: renderV3Action(); break;
        case 4: renderV4Predictive(); break;
        case 5: renderV5Strategy(); break;
    }
}

// --- V4: Predictive Harvest ---
function renderV4Predictive() {
    const list = document.getElementById('v4-predictive-list');
    if (!list) return;

    // Calculate real velocity for each product
    const velocityWindowDays = 30;
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - velocityWindowDays);

    list.innerHTML = productsCache.map(p => {
        // Calculate real units sold in the window
        const unitsSold = ordersCache.reduce((total, order) => {
            const orderDate = new Date(order.date);
            if (orderDate >= startDate && order.status !== 'Canceled') {
                const item = order.items.find(i => String(i.id) === String(p.id));
                if (item) return total + (parseInt(item.qty) || 0);
            }
            return total;
        }, 0);

        const velocity = (unitsSold / velocityWindowDays).toFixed(2); // units/day

        // If velocity is 0, we can't forecast properly - show "Infinite" or "-"
        const daysToZero = velocity > 0 ? Math.ceil(p.stock / velocity) : '∞';
        const healthColor = daysToZero === '∞' ? 'text-emerald-600' : daysToZero < 3 ? 'text-rose-600' : daysToZero < 7 ? 'text-amber-600' : 'text-emerald-600';

        return `
            <div class="p-6 flex items-center gap-8 hover:bg-gray-50/50 transition-colors">
                <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    <img src="${p.image_url || '/images/placeholder.jpg'}" class="w-full h-full object-cover">
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="font-bold text-gray-900">${p.name}</div>
                    <div class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">${p.category}</div>
                </div>

                <div class="hidden md:block w-32 shrink-0">
                    <div class="text-[10px] text-gray-400 font-bold uppercase mb-1">Velocity</div>
                    <div class="flex items-center gap-2">
                         <div class="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full bg-blue-500" style="width: ${velocity * 10}%"></div>
                         </div>
                         <span class="text-xs font-mono font-bold text-gray-900">${velocity}</span>
                    </div>
                </div>

                <div class="w-24 text-center shrink-0">
                    <div class="text-[10px] text-gray-400 font-bold uppercase mb-1">Stock</div>
                    <div class="font-bold text-gray-900">${p.stock}</div>
                </div>

                <div class="w-32 text-right shrink-0">
                    <div class="text-[10px] text-gray-400 font-bold uppercase mb-1">Days Remaining</div>
                    <div class="text-xl font-black ${healthColor}">${daysToZero}d</div>
                </div>
            </div>
        `;
    }).join('');
}

// --- V5: Strategy Lab ---
function renderV5Strategy() {
    const grid = document.getElementById('v5-strategy-grid');
    if (!grid) return;

    grid.innerHTML = productsCache.map(p => {
        // Simulated strategy states (would be in DB meta in real app)
        const isStale = p.stock > 50 && Math.random() > 0.7; // Mock logic
        const isPopular = p.stock < 15 && Math.random() > 0.5;
        const statusLabel = isStale ? 'Stale Inventory' : isPopular ? 'High Demand' : 'Healthy';
        const labelClass = isStale ? 'bg-amber-100 text-amber-700' : isPopular ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600';

        return `
            <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all duration-300">
                <div class="flex justify-between items-start">
                    <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${labelClass}">
                        ${statusLabel}
                    </div>
                    <div class="font-mono text-xs text-gray-400">#${p.id}</div>
                </div>

                <div class="flex items-center gap-4">
                     <div class="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                        <img src="${p.image_url || '/images/placeholder.jpg'}" class="w-full h-full object-cover">
                     </div>
                     <div class="min-w-0">
                        <h4 class="font-bold text-gray-900 text-lg leading-tight truncate">${p.name}</h4>
                        <p class="text-2xl font-black text-gray-900 mt-1">${formatCurrency(p.price)}</p>
                     </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-auto">
                    <button onclick="window.runStrategy('${p.id}', 'flash_sale')" class="py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[10px] uppercase tracking-wider transition-colors">⚡ Flash Sale</button>
                    <button onclick="window.runStrategy('${p.id}', 'promote')" class="py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-wider transition-colors">🚀 Promote</button>
                </div>
            </div>
        `;
    }).join('');
}

// Strategy handler
window.runStrategy = async (id, type) => {
    const p = productsCache.find(x => String(x.id) === String(id));
    if (!p) return;

    if (type === 'flash_sale') {
        const newPrice = p.price * 0.8; // 20% off
        await api.updateProduct(id, { price: newPrice });
        p.price = newPrice;
        showToast(`Flash sale applied to ${p.name}! (80% of original price)`);
    } else if (type === 'promote') {
        showToast(`${p.name} added to "Featured" carousel on storefront!`);
        // In real app, would update a 'featured' flag or marketing tag
    }

    renderV5Strategy();
};

// --- V1: Harvest Command Center ---
function renderV1Harvest() {
    const grid = document.getElementById('v1-inventory-grid');
    if (!grid) return;

    grid.innerHTML = productsCache.map(p => {
        const stockPercent = Math.min(100, (p.stock / 100) * 100); // Assuming 100 is "full"
        const barColor = p.stock < 10 ? 'bg-rose-500' : p.stock < 30 ? 'bg-amber-500' : 'bg-emerald-500';

        return `
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 group hover:shadow-md transition-shadow">
                <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        <img src="${p.image_url || '/images/placeholder.jpg'}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-gray-900 truncate">${p.name}</h4>
                        <p class="text-xs text-gray-500">${p.category}</p>
                        <div class="mt-2 flex items-center gap-2">
                            <span class="text-lg font-mono font-bold text-gray-800">${p.stock}</span>
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Units</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-1">
                    <div class="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>Capacity</span>
                        <span>${Math.round(stockPercent)}%</span>
                    </div>
                    <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full ${barColor} transition-all duration-500" style="width: ${stockPercent}%"></div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                    <button onclick="window.updateStockProto('${p.id}', 10, 1)" class="py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-emerald-600 font-bold text-xs transition-colors">+10</button>
                    <button onclick="window.updateStockProto('${p.id}', -10, 1)" class="py-2 rounded-lg bg-gray-50 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-colors">-10</button>
                </div>
            </div>
        `;
    }).join('');
}

// --- V2: Template Impact Monitor ---
function renderV2Impact() {
    const table = document.getElementById('v2-impact-body');
    if (!table) return;

    table.innerHTML = productsCache.map(p => {
        const affectedTemplates = templatesCache.filter(t =>
            t.items && t.items.some(item => String(item.product_id || item.id) === String(p.id))
        );

        return `
            <tr class="hover:bg-blue-50/20 border-b border-gray-100 last:border-0 transition-colors">
                <td class="p-4 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        <img src="${p.image_url || '/images/placeholder.jpg'}" class="w-full h-full object-cover">
                    </div>
                    <div class="font-medium text-gray-900">${p.name}</div>
                </td>
                <td class="p-4 text-center">
                    <span class="px-2.5 py-1 rounded-md text-sm font-bold bg-white border border-gray-200">${p.stock}</span>
                </td>
                <td class="p-4">
                    <div class="flex flex-wrap gap-1">
                        ${affectedTemplates.length > 0
                ? affectedTemplates.map(t => `<span class="px-2 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px] font-bold border border-purple-100">${t.name}</span>`).join('')
                : '<span class="text-gray-300 text-xs italic">No templates</span>'
            }
                    </div>
                </td>
                <td class="p-4 text-right">
                    <div class="flex justify-end gap-2">
                         <button onclick="window.updateStockProto('${p.id}', 1, 2)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">+</button>
                         <button onclick="window.updateStockProto('${p.id}', -1, 2)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600">-</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// --- V3: Actionable Alert Feed ---
function renderV3Action() {
    const feed = document.getElementById('v3-alert-feed');
    if (!feed) return;

    const lowStock = productsCache.filter(p => p.stock < 10);

    if (lowStock.length === 0) {
        feed.innerHTML = '<div class="p-12 text-center text-gray-400 italic">No low stock alerts. System healthy.</div>';
        return;
    }

    feed.innerHTML = lowStock.map(p => `
        <div class="bg-rose-50/50 border border-rose-100 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="relative">
                <div class="w-20 h-20 rounded-2xl bg-white overflow-hidden shadow-sm border border-rose-100">
                    <img src="${p.image_url || '/images/placeholder.jpg'}" class="w-full h-full object-cover">
                </div>
                <div class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-rose-50">
                    ${p.stock}
                </div>
            </div>
            
            <div class="flex-1 text-center md:text-left">
                <h4 class="text-lg font-bold text-gray-900">${p.name}</h4>
                <p class="text-sm text-rose-600 font-medium">Critical Stock Level Warning</p>
                <div class="mt-2 flex items-center justify-center md:justify-start gap-4">
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Storefront Look:</div>
                    <span class="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full uppercase border border-amber-200">Limited Quantity!</span>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button onclick="window.updateStockProto('${p.id}', 50, 3)" class="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:shadow-lg transition-all">Refill +50</button>
                <button onclick="window.updateStockProto('${p.id}', 100, 3)" class="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:shadow-lg transition-all">Restock +100</button>
            </div>
        </div>
    `).join('');
}

// Global update handler for prototypes
window.updateStockProto = async (id, change, version) => {
    try {
        const p = productsCache.find(x => String(x.id) === String(id));
        if (!p) return;

        const newStock = Math.max(0, p.stock + change);
        await api.updateProduct(id, { stock: newStock });

        // Refresh local cache and UI
        p.stock = newStock;
        renderPrototypeContent(version);
        showToast(`Stock updated to ${newStock}`);

        // Update main inventory list if it exists and is visible
        if (window.loadInventory) window.loadInventory();

        // Trigger health check for alerts
        if (window.inventoryAlertService) window.inventoryAlertService.check();

    } catch (e) {
        showToast("Update failed", "error");
    }
};

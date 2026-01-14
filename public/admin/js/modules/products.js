import { api } from './api.js';
import { showToast, formatCurrency } from './utils.js';
import { AdminBoxCard } from '../components/AdminBoxCard.js';

let productsCache = [];
let templatesCache = [];
let currentTemplateItems = [];
let pollInterval = null;

export function startProductPolling() {
    stopProductPolling();
    loadProducts(); // Initial load
    pollInterval = setInterval(() => {
        // Silent reload
        const isModalOpen = !document.getElementById('product-modal').classList.contains('hidden') ||
            !document.getElementById('template-modal').classList.contains('hidden');
        if (!isModalOpen) loadProducts();
    }, 5000);
}

export function stopProductPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

export async function loadProducts() {
    try {
        const [products, templates] = await Promise.all([
            api.getProducts(),
            api.getBoxTemplates()
        ]);
        productsCache = products;
        templatesCache = templates;

        // GHOST RECONCILIATION:
        // Find all product IDs used in templates
        const usedIds = new Set();
        templates.forEach(t => {
            if (t.items) t.items.forEach(i => usedIds.add(i.product_id || i.id));
        });

        // Find IDs missing from productsCache (Archived/Deleted)
        const missingIds = [...usedIds].filter(id => !productsCache.find(p => String(p.id) === String(id)));

        if (missingIds.length > 0) {
            // console.log("Resolving Ghost Items:", missingIds);
            // Fetch missing items in parallel (limit concurrency if needed, but for now map is fine)
            // We append them to productsCache but allow distinguishing them via is_archived checks logic
            const ghosts = await Promise.all(missingIds.map(async (id) => {
                try {
                    const p = await api.getProduct(id);
                    return p;
                } catch (e) {
                    return null; // Deleted permanently
                }
            }));

            ghosts.filter(Boolean).forEach(g => {
                // Check if already exists (race condition)
                if (!productsCache.find(p => String(p.id) === String(g.id))) {
                    productsCache.push(g);
                }
            });
        }


        if (!window.globalConfig) {
            try {
                window.globalConfig = await fetch('/api/config').then(r => r.json());
            } catch (e) { console.warn("Config load failed", e); }
        }

        // Respect active search
        const searchInput = document.getElementById('search-products-input');
        if (searchInput && searchInput.value.trim()) {
            window.searchProducts(searchInput.value);
        } else {
            renderData(products, templates);
        }

        checkInventoryHealth(products);

        // Update other views if active
        if (document.getElementById('view-inventory') && !document.getElementById('view-inventory').classList.contains('hidden')) {
            renderInventory(products);
        }
        if (document.getElementById('view-categories') && !document.getElementById('view-categories').classList.contains('hidden')) {
            loadCategories(); // Refetch categories + recalc counts
        }
    } catch (e) {
        showToast("Failed to load products/templates", "error");
    }
}

function renderData(products, templates) {
    // Render Products Table
    const pBody = document.getElementById('products-table-body');
    if (pBody) {
        if (products.length === 0) {
            pBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">No products found matching your search.</td></tr>`;
        } else {
            pBody.innerHTML = products.map(p => {
                const isLowStock = p.stock < 10;
                const isOutOfStock = p.stock === 0;

                // Sonar Indicator Logic
                // Removed per user request - see components/SonarIndicator.js for legacy code
                let dotClass = 'bg-emerald-500';
                let textClass = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                let stockLabel = `${p.stock} in stock`;

                // Fetch global config if available (or default to true)
                // Assuming window.configCache or similiar, but we can check if the ping should be active
                // For now, let's assume we want to disable animation if configured. 
                // Since this runs in a render loop, we need access to that config.
                // NOTE: We don't have global config access yet. I will add a window.globalConfig fetch in loadProducts.

                if (isOutOfStock) {
                    dotClass = 'bg-red-600';
                    textClass = 'text-red-700 bg-red-50 border-red-100 font-bold';
                    stockLabel = 'Out of Stock';
                } else if (isLowStock) {
                    dotClass = 'bg-amber-500';
                    textClass = 'text-amber-700 bg-amber-50 border-amber-100 font-bold';
                    // Keep stockLabel as is
                }

                const activeClass = p.is_active
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                    : 'bg-gray-100 text-gray-500 ring-1 ring-gray-500/20';
                const activeLabel = p.is_active ? 'Active' : 'Disabled';

                const rowOpacity = p.is_active ? '' : 'opacity-60 bg-gray-50/50';

                return `
                <tr class="hover:bg-blue-50/30 transition-colors border-b border-gray-100 last:border-0 group ${rowOpacity}">
                    <!-- Image -->
                    <td class="pl-6 py-4 w-20">
                        <div class="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden relative shadow-sm">
                            <img src="${p.image_url || '/images/placeholder.jpg'}" 
                                 class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                 onerror="this.src='https://placehold.co/100x100?text=No+Img'">
                        </div>
                    </td>
                    
                    <!-- Product Info -->
                    <td class="px-4 py-4">
                        <div class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">${p.name}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <button onclick="window.toggleProductStatus('${p.id}', ${p.is_active})" 
                                class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide cursor-pointer hover:shadow-sm transition-all ${activeClass}">
                                ${activeLabel}
                            </button>
                        </div>
                    </td>

                    <!-- ID -->
                    <td class="px-4 py-4 text-xs font-mono text-gray-500">
                        ${p.id}
                    </td>

                    <!-- Farm ID -->
                    <td class="px-4 py-4">
                         ${p.farm_id ?
                        `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                🚜 ${p.farm_id.length > 20 ? p.farm_id.substring(0, 20) + '...' : p.farm_id}
                             </span>`
                        : '<span class="text-gray-300 text-xs text-center block w-full">-</span>'}
                    </td>
                    
                    <!-- Category -->
                    <td class="px-4 py-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            🏷️ ${p.category}
                        </span>
                    </td>
                    
                    <!-- Price -->
                    <td class="px-4 py-4 text-right">
                        <span class="font-mono font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            ${formatCurrency(p.price)}
                        </span>
                    </td>
                    
                    <!-- Stock (Enhanced Indicator) -->
                    <td class="px-4 py-4 text-center">
                        <div class="flex items-center justify-center gap-3">
                            ${(window.globalConfig?.meta?.enableSonar && !isOutOfStock) ? `
                            <span class="relative flex h-3 w-3">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isLowStock ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-3 w-3 ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}"></span>
                            </span>` : ''}

                            <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${textClass} whitespace-nowrap min-w-[80px] justify-center">
                               ${stockLabel}
                            </span>
                        </div>
                    </td>
                    
                    <!-- Actions -->
                    <td class="px-4 py-4 text-right pr-6">
                        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="window.toggleProductStatus('${p.id}', ${p.is_active})" 
                                class="p-2 text-gray-400 hover:text-${p.is_active ? 'amber-600' : 'emerald-600'} hover:bg-${p.is_active ? 'amber-50' : 'emerald-50'} rounded-lg transition-all" 
                                title="${p.is_active ? 'Deactivate' : 'Activate'}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </button>
                            <button onclick="window.editProduct('${p.id}')" 
                                class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="window.archiveProduct('${p.id}')" 
                                class="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Archive">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join('');
        }
    }

    // Render Box Templates Grid
    const tGrid = document.getElementById('templates-grid');
    if (tGrid) {
        tGrid.innerHTML = templates.map(t => AdminBoxCard(t, productsCache)).join('');
    }
}

export async function loadArchivedProducts() {
    try {
        const res = await fetch('/api/admin/products/archived', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        const products = await res.json();

        const tbody = document.getElementById('archived-products-table-body');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-400 italic">No archived products found.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr class="hover:bg-red-50/10 border-b border-gray-100 last:border-0 opacity-75">
                <td class="pl-6 py-4">
                    <div class="w-10 h-10 rounded bg-gray-100 bg-cover bg-center grayscale" style="background-image: url('${p.image_url || '/images/placeholder.jpg'}')"></div>
                </td>
                <td class="px-4 py-4 font-medium text-gray-600">${p.name}</td>
                <td class="px-4 py-4 text-xs font-mono text-gray-500">${p.id}</td>
                <td class="px-4 py-4">
                     ${p.farm_id ?
                `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            🚜 ${p.farm_id.length > 20 ? p.farm_id.substring(0, 20) + '...' : p.farm_id}
                         </span>`
                : '<span class="text-gray-300 text-xs">-</span>'}
                </td>
                <td class="px-4 py-4 text-sm text-gray-500">${p.category}</td>
                <td class="px-4 py-4 font-mono text-xs">${formatCurrency(p.price)}</td>
                <td class="px-4 py-4 text-right">
                    <button onclick="window.restoreProduct('${p.id}')" 
                        class="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-all font-bold mr-2">
                        Restore
                    </button>
                    <button onclick="window.permanentDeleteProduct('${p.id}')" 
                        class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all font-bold">
                        Delete Forever
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (e) {
        showToast("Failed to load archived products", "error");
    }
}

// Search Handler
window.searchProducts = (query) => {
    const term = query.toLowerCase().trim();
    if (!term) {
        renderData(productsCache, templatesCache);
        return;
    }
    const filtered = productsCache.filter(p =>
        p.name.toLowerCase().includes(term) ||
        String(p.category).toLowerCase().includes(term)
    );
    renderData(filtered, templatesCache);
};

// Global exposure for HTML bindings
window.toggleProductStatus = async (id, currentStatus) => {
    try {
        await api.updateProduct(id, { is_active: !currentStatus });
        showToast(`Product ${!currentStatus ? 'Activated' : 'Deactivated'}`);
        loadProducts(); // Reload to refresh list
    } catch (e) {
        showToast("Failed to update status", "error");
        console.error(e);
    }
};

window.editProduct = (id) => {
    // Loose comparison for ID (int vs string)
    const p = productsCache.find(x => String(x.id) === String(id));
    if (p) openProductModal(p);
};
window.archiveProduct = async (id) => {
    if (!confirm("Are you sure you want to archive this product? It will be hidden from the shop.")) return;
    try { await api.deleteProduct(id); showToast("Product Archived"); loadProducts(); loadInventory(); }
    catch (e) { showToast("Failed", "error"); }
};
window.restoreProduct = async (id) => {
    if (!confirm("Restore this product? It will be set to 'Disabled' with 0 stock.")) return;
    try {
        await fetch(`/api/admin/products/${id}/restore`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        showToast("Product Restored");
        loadArchivedProducts();
        loadProducts(); // In case we want to update counters or cache
    } catch (e) { showToast("Failed to restore", "error"); }
};
window.permanentDeleteProduct = async (id) => {
    if (!confirm("PERMANENTLY DELETE this product? This acton cannot be undone!")) return;
    try {
        await fetch(`/api/admin/products/${id}/permanent`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        showToast("Permanently Deleted");
        loadArchivedProducts();
    } catch (e) { showToast("Failed to delete", "error"); }
};
window.editTemplate = (idOrObj) => {
    let t;
    if (typeof idOrObj === 'object') {
        t = idOrObj;
    } else {
        t = templatesCache.find(x => String(x.id) === String(idOrObj));
    }
    if (t) openTemplateModal(t);
};
window.deleteTemplate = async (id) => {
    if (!confirm("Delete template?")) return;
    try { await api.deleteBoxTemplate(id); showToast("Deleted"); loadProducts(); }
    catch (e) { showToast("Failed", "error"); }
};

// Modal Logic: Product
export async function openProductModal(p = null) {
    const modal = document.getElementById('product-modal');
    document.getElementById('p-modal-title').innerText = p ? 'Edit Product' : 'Add Product';

    document.getElementById('p-id').value = p ? p.id : '';
    document.getElementById('p-name').value = p ? p.name : '';

    // Load Categories dynamic
    const catSelect = document.getElementById('p-category');
    if (catSelect.children.length <= 1) { // Load if empty
        try {
            const res = await fetch('/api/categories');
            const cats = await res.json();
            catSelect.innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        } catch (e) { }
    }

    if (p) catSelect.value = p.category;
    document.getElementById('p-price').value = p ? p.price : '';
    document.getElementById('p-stock').value = p ? p.stock : '100';
    document.getElementById('p-image').value = p ? p.image_url : '';
    document.getElementById('p-preview-img').src = (p && p.image_url) ? p.image_url : '/images/placeholder.jpg';

    document.getElementById('p-tags').value = p ? (Array.isArray(p.tags) ? p.tags.join(', ') : p.tags) : '';
    document.getElementById('p-farm-id').value = p ? (p.farm_id || '') : '';
    document.getElementById('p-active').checked = p ? !!p.is_active : true;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-modal').classList.remove('flex');
}
window.closeProductModal = closeProductModal;

export async function saveProduct() {
    const id = document.getElementById('p-id').value;
    const body = {
        name: document.getElementById('p-name').value,
        category: document.getElementById('p-category').value,
        price: parseFloat(document.getElementById('p-price').value),
        stock: parseInt(document.getElementById('p-stock').value),
        image_url: document.getElementById('p-image').value,
        tags: document.getElementById('p-tags').value.split(',').map(s => s.trim()).filter(s => s),
        farm_id: document.getElementById('p-farm-id').value.trim().replace(/[^a-zA-Z0-9\-_]/g, '').toUpperCase(),
        is_active: document.getElementById('p-active').checked
    };

    try {
        if (id) await api.updateProduct(id, body);
        else await api.createProduct(body);

        showToast("Product Saved");
        closeProductModal();
        loadProducts();
        loadInventory();
    } catch (e) { showToast(e.message, "error"); }
}

// --------------------------------------------------------
// TEMPLATE BUILDER LOGIC
// --------------------------------------------------------

export function openTemplateModal(t = null) {
    const modal = document.getElementById('template-modal');
    document.getElementById('tmpl-modal-title').innerText = t ? 'Edit Template' : 'New Box Template';
    document.getElementById('t-id').value = t ? t.id : '';
    document.getElementById('t-name').value = t ? t.name : '';
    document.getElementById('t-desc').value = t ? t.description : '';
    document.getElementById('t-price').value = t ? (typeof t.base_price === 'number' ? t.base_price : t.base_price || '') : '';
    document.getElementById('t-image').value = t ? t.image_url : '';
    document.getElementById('t-preview-img').src = (t && t.image_url) ? t.image_url : '/images/placeholder.jpg';
    document.getElementById('t-active').checked = t ? !!t.is_active : true;

    // Init Items
    currentTemplateItems = t ? (JSON.parse(JSON.stringify(t.items || []))) : [];

    // Normalize items: Backend sends 'id' for product ID, but we use 'product_id' locally
    currentTemplateItems.forEach(item => {
        if (!item.product_id && item.id) item.product_id = item.id;
    });

    // Populate Product Picker if empty
    renderProductDropdownOptions(); // Populate the custom dropdown

    // Reset selection
    document.getElementById('t-product-select').value = '';
    document.getElementById('dropdown-label').innerText = 'Select Product...';

    renderTemplateItems();

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function renderTemplateItems() {
    const tbody = document.getElementById('t-items-list');
    const emptyMsg = document.getElementById('t-empty-msg');

    if (currentTemplateItems.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.classList.remove('hidden');
    } else {
        emptyMsg.classList.add('hidden');
        tbody.innerHTML = currentTemplateItems.map((item, idx) => {
            const p = productsCache.find(x => String(x.id) === String(item.product_id));
            const name = p ? p.name : (item.name || 'Unknown Product');
            const image = p ? p.image_url : '/images/placeholder.jpg';
            const farmId = p && p.farm_id ? p.farm_id : null;

            return `

                <tr class="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td class="py-3 px-4">
                        <div class="w-10 h-10 rounded bg-gray-100 bg-cover bg-center border border-gray-200 relative" 
                             style="background-image: url('${image}')">
                             ${!p ? '<div class="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-xs bg-red-50">?</div>' : ''}
                        </div>
                    </td>
                    <td class="py-3 px-4 font-medium text-gray-800 text-sm">
                        ${name}
                        ${(p && p.is_archived) ? '<span class="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Archived</span>' : ''}
                        ${(!p) ? '<span class="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Deleted</span>' : ''}
                        ${(p && !p.is_active && !p.is_archived) ? '<span class="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">Inactive</span>' : ''}
                        ${(p && p.stock < item.qty) ? `<span class="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Low Stock (${p.stock})</span>` : ''}
                    </td>
                    <td class="py-3 px-4 text-center">
                        <span class="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono text-xs font-bold border border-gray-200">${item.qty}</span>
                    </td>
                    <td class="py-3 px-4 text-xs font-mono text-gray-500">
                        ${item.product_id}
                    </td>
                    <td class="py-3 px-4">
                         ${farmId ?
                    `<span class="inline-flex items-center gap-1.5 px-2. py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 font-mono whitespace-nowrap">
                                🚜 ${farmId}
                             </span>`
                    : '<span class="text-gray-300 text-xs">-</span>'}
                    </td>
                    <td class="py-3 px-4 text-right">
                        <button onclick="removeTemplateItem(${idx})" class="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

export function addTemplateItem() {
    const select = document.getElementById('t-product-select');
    const qtyInput = document.getElementById('t-qty-input');
    const id = select.value;
    const qty = parseInt(qtyInput.value) || 1;

    if (!id) return;

    const existing = currentTemplateItems.find(i => String(i.product_id) === String(id));
    if (existing) existing.qty += qty;
    else currentTemplateItems.push({ product_id: id, qty });

    renderTemplateItems();
    qtyInput.value = 1;
}

export function removeTemplateItem(idx) {
    currentTemplateItems.splice(idx, 1);
    renderTemplateItems();
}

export async function saveTemplate() {
    const id = document.getElementById('t-id').value;
    const data = {
        name: document.getElementById('t-name').value,
        description: document.getElementById('t-desc').value,
        price: parseFloat(document.getElementById('t-price').value) || 0, // Changed from base_price to price
        image_url: document.getElementById('t-image').value,
        is_active: document.getElementById('t-active').checked,
        // Harden items payload: Ensure product_id is set
        items: currentTemplateItems.map(i => ({
            product_id: i.product_id || i.id, // Fallback to id if product_id missing
            qty: i.qty || i.quantity || 1
        }))
    };

    // Pre-save Inventory Validation
    const stockIssues = [];
    data.items.forEach(item => {
        const p = productsCache.find(x => String(x.id) === String(item.product_id));
        if (p) {
            if (p.stock < item.qty) {
                stockIssues.push(`${p.name} (Have: ${p.stock}, Need: ${item.qty})`);
            } else if (!p.is_active) {
                stockIssues.push(`${p.name} (Inactive)`);
            }
        } else {
            stockIssues.push(`Unknown Product ID: ${item.product_id}`);
        }
    });

    if (stockIssues.length > 0) {
        const msg = "Inventory Issues Detected:\n" + stockIssues.map(s => "- " + s).join("\n") +
            "\n\nThis box will be saved as INACTIVE until stock is replenished.";

        if (!confirm(msg)) return; // User canceled
        data.is_active = false; // Force inactive
    }

    console.log("Saving Template Payload:", data);

    try {
        if (id) await api.updateBoxTemplate(id, data);
        else await api.createBoxTemplate(data);

        showToast("Template Saved");
        closeTemplateModal();
        loadProducts();
    } catch (e) {
        console.error(e);
        showToast("Failed to save template", "error");
    }
}

export function closeTemplateModal() {
    document.getElementById('template-modal').classList.add('hidden');
    document.getElementById('template-modal').classList.remove('flex');
}

// Expose template helpers
window.openTemplateModal = openTemplateModal;
window.addTemplateItem = addTemplateItem;
window.removeTemplateItem = removeTemplateItem;
window.saveTemplate = saveTemplate;
window.saveTemplate = saveTemplate;
window.closeTemplateModal = closeTemplateModal;
window.loadArchivedProducts = loadArchivedProducts;


// Inventory & Categories View Logic

let currentInventorySort = { column: 'name', direction: 'asc' }; // Default sort

export async function loadInventory() {
    try {
        // Fetch config for settings (Sonar etc)
        try {
            const cfg = await fetch('/api/config').then(r => r.json());
            window.globalConfig = cfg;
        } catch (e) {
            console.warn("Could not load config for product views", e);
        }

        // Ensure products are loaded and cached
        if (productsCache.length === 0) {
            await loadProducts(); // Load products if not already loaded
        }
        renderInventory(productsCache);
    } catch (e) { showToast("Failed to load inventory", "error"); }
}

function getSortedInventory(products) {
    if (!currentInventorySort.column) return products;

    return [...products].sort((a, b) => {
        let valA = a[currentInventorySort.column];
        let valB = b[currentInventorySort.column];

        // Handle nulls/undefined
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';

        // Case insensitive for strings
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        let comparison = 0;
        if (valA > valB) comparison = 1;
        else if (valA < valB) comparison = -1;

        return currentInventorySort.direction === 'asc' ? comparison : -comparison;
    });
}

window.sortInventory = (column) => {
    if (currentInventorySort.column === column) {
        currentInventorySort.direction = currentInventorySort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentInventorySort.column = column;
        currentInventorySort.direction = 'asc';
    }
    renderInventory(productsCache);
};

function renderInventory(products) {
    const tbody = document.getElementById('inventory-list');
    if (!tbody) return;

    // Sort data before rendering
    const sortedProducts = getSortedInventory(products);

    // Update Sort Indicators
    // Reset all arrows
    ['name', 'id', 'farm_id', 'price', 'stock'].forEach(col => {
        const arrow = document.getElementById(`sort-arrow-${col}`);
        if (arrow) arrow.innerText = '↕';
        if (arrow) arrow.classList.add('invisible');
    });

    // Set active arrow
    if (currentInventorySort.column) {
        const arrow = document.getElementById(`sort-arrow-${currentInventorySort.column}`);
        if (arrow) {
            arrow.innerText = currentInventorySort.direction === 'asc' ? '↑' : '↓';
            arrow.classList.remove('invisible');
        }
    }



    tbody.innerHTML = sortedProducts.map(p => {
        let stockClass = 'bg-green-50 text-green-700';
        if (p.stock < 10) stockClass = 'bg-yellow-50 text-yellow-700';
        if (p.stock < 5) stockClass = 'bg-red-50 text-red-700 font-bold';

        const activeBadge = p.is_active
            ? '<span class="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-green-100 text-green-700">Active</span>'
            : '<span class="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-400">Disabled</span>';
        const rowClass = p.is_active ? '' : 'opacity-75 bg-gray-50';

        return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 ${rowClass}">
                <td class="p-4 text-xs font-mono text-gray-500">${p.id}</td>
                <td class="p-4 flex items-center gap-3">
                    <div class="w-10 h-10 rounded bg-gray-100 bg-cover bg-center" style="background-image: url('${p.image_url}')"></div>
                    <div>
                        <div class="flex items-center">
                        <div class="font-medium text-gray-900">${p.name}</div>
                        ${activeBadge}
                        </div>
                        <div class="text-xs text-gray-500">${p.category}</div>
                    </div>
                </td>
                <td class="p-4 text-xs font-mono text-gray-500">
                     ${p.farm_id ?
                `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            🚜 ${p.farm_id.length > 20 ? p.farm_id.substring(0, 20) + '...' : p.farm_id}
                         </span>`
                : '<span class="text-gray-300 text-center block w-full">-</span>'}
                </td>
                <td class="p-4 text-sm text-gray-600">${formatCurrency(p.price)}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <button onclick="window.updateStock('${p.id}', -1)" class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">-</button>
                        


                        <span class="w-12 text-center font-medium bg-white border border-gray-100 rounded py-0.5 ${stockClass}">${p.stock}</span>
                        <button onclick="window.updateStock('${p.id}', 1)" class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold">+</button>
                    </div>
                </td>
                <td class="p-4 text-right">
                    <button onclick="window.editProduct('${p.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">Edit</button>
                    <button onclick="window.archiveProduct('${p.id}')" class="text-gray-400 hover:text-amber-600 text-sm font-medium">Archive</button>
                </td>
            </tr>
        `;
    }).join('');
}

export async function loadCategories() {
    try {
        // Ensure we have products for counts
        if (productsCache.length === 0) {
            try { productsCache = await api.getProducts(); } catch (e) { }
        }

        // Count products per category
        const counts = {};
        productsCache.forEach(p => {
            const key = String(p.category).trim(); // Normalize
            counts[key] = (counts[key] || 0) + 1;
        });

        const res = await fetch('/api/categories');
        const cats = await res.json();

        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        if (cats.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400 italic">No categories found. Create one above!</div>`;
            return;
        }

        const colors = [
            'bg-rose-50 text-rose-600 border-rose-100',
            'bg-orange-50 text-orange-600 border-orange-100',
            'bg-amber-50 text-amber-600 border-amber-100',
            'bg-emerald-50 text-emerald-600 border-emerald-100',
            'bg-cyan-50 text-cyan-600 border-cyan-100',
            'bg-indigo-50 text-indigo-600 border-indigo-100',
            'bg-violet-50 text-violet-600 border-violet-100',
            'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100'
        ];

        grid.innerHTML = cats.map(c => {
            // Deterministic color based on name
            const charCode = (c.name || '?').charCodeAt(0);
            const colorClass = colors[charCode % colors.length];
            const productCount = counts[c.name] || 0;

            return `
            <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all group duration-300">
                <div class="flex items-center gap-4">
                     <div class="w-14 h-14 rounded-xl ${colorClass} border flex items-center justify-center text-2xl font-black shadow-inner">
                         ${(c.name[0] || '?').toUpperCase()}
                     </div>
                     <div>
                         <h3 class="font-bold text-gray-800 text-lg leading-tight mb-1">${c.name}</h3>
                         <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">
                            ${productCount} Product${productCount !== 1 ? 's' : ''}
                         </span>
                     </div>
                </div>
                
                <button onclick="window.deleteCategory('${c.id}')" 
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Category">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `}).join('');
    } catch (e) {
        console.error(e);
        showToast("Failed to load categories", "error");
    }
}

export async function addCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return;
    try {
        await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` },
            body: JSON.stringify({ name })
        });
        document.getElementById('new-cat-name').value = '';
        loadCategories();
        showToast("Category added");
    } catch (e) { showToast("Error", "error"); }
}

window.deleteCategory = async (id) => {
    if (!confirm("Delete category?")) return;
    try {
        await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        loadCategories();
    } catch (e) { showToast("Error", "error"); }
};

window.updateStock = async (id, delta) => {
    const p = productsCache.find(x => String(x.id) === String(id));
    if (!p) return;
    const newStock = Math.max(0, p.stock + delta);

    // We reuse updateProduct but only send stock
    // Since backend update is strict (replaces fields?), looking at product.routes.js:
    // It runs "UPDATE ... SET name=@name ...". It expects ALL fields or defaults?
    // Route logic: "const { name, category ... } = req.body".
    // If I send ONLY stock, name will be undefined?
    // Backend uses `req.body`. If name undefined, `@name` becomes NULL?
    // YES. Backend doesn't merge. It replaces.
    // So I MUST send full object with updated stock.

    const body = { ...p, stock: newStock, tags: p.tags }; // Ensure tags are array or handled
    // Actually tags in cache are array (parsed), backend expects array for stringify. Valid.

    try {
        await api.updateProduct(id, body);
        p.stock = newStock; // Optimistic update
        loadInventory();
        loadProducts(); // Update other view too
    } catch (e) { showToast("Failed to update stock", "error"); }
};

// Update saveTemplate to use 'price' to match backend expectation
// Re-exporting saveTemplate to overwrite previous definition in this file (if using replace block correctly)
// Wait, I should replace the saveTemplate function specifically or the whole block?
// I am replacing from "Inventory & Categories" down. `saveTemplate` is ABOVE this block in the file.
// I need to use `replace_file_content` targeting `saveTemplate` specifically OR use MultiReplace.
// I will use MultiReplace to fix both.
// Helper to check stock levels against config threshold
async function checkInventoryHealth(products) {
    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        const alertLevel = config.meta?.inventoryAlertLevel ?? 5;

        // Check for ANY active product below threshold (but likely > 0 if we only want "low", or <= if we want "low/out")
        // Requirement: "less than a level defined"
        const lowStock = products.some(p => p.is_active && p.stock < alertLevel);

        const indicator = document.getElementById('inventory-alert-indicator');
        if (indicator) {
            if (lowStock) indicator.classList.remove('hidden');
            else indicator.classList.add('hidden');
        }
    } catch (e) {
        console.error("Failed to check inventory health", e);
    }
}

// Custom Product Dropdown Logic
function renderProductDropdownOptions() {
    const container = document.getElementById('dropdown-options');
    if (!container) return;

    // Safety check for cache
    if (!productsCache || !productsCache.length) {
        container.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">No products available</div>';
        return;
    }

    container.innerHTML = productsCache.map(p => `
        <div onclick="window.selectProductOption('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.image_url}')" 
             class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
            <div class="w-10 h-10 rounded bg-gray-100 bg-cover bg-center shrink-0 border border-gray-200" 
                 style="background-image: url('${p.image_url}')"></div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-gray-900 truncate mr-2">${p.name}</span>
                    ${p.farm_id ? `<span class="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 font-mono whitespace-nowrap">🚜 ${p.farm_id}</span>` : ''}
                </div>
                <div class="text-xs font-mono text-gray-400 truncate mt-0.5">${p.id}</div>
            </div>
        </div>
    `).join('');
}

window.toggleProductDropdown = () => {
    const opts = document.getElementById('dropdown-options');
    if (opts) opts.classList.toggle('hidden');
};

window.selectProductOption = (id, name, image) => {
    document.getElementById('t-product-select').value = id;

    // Update label to show selected item nicely
    const label = document.getElementById('dropdown-label');
    label.innerHTML = `<span class="font-medium text-gray-900">${name}</span>`;

    document.getElementById('dropdown-options').classList.add('hidden');
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdown-options');
    const trigger = document.getElementById('dropdown-trigger');
    if (dropdown && !dropdown.classList.contains('hidden') && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

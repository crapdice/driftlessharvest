/**
 * Admin Categories & Tags Module
 * Manages product categorization and tag analytics.
 */

import { api } from './api.js';
import { showToast } from './utils.js';

// --- Internal State ---
const VIEW_PATH = 'views/categories.html';
let productsForTags = [];

// --- Core Functions ---

/**
 * Initialize the Categories & Tags View
 */
export async function initCategories() {
    const container = document.getElementById('view-categories');
    if (!container) return;

    // Load template if needed
    if (container.children.length <= 1) {
        try {
            const response = await fetch(VIEW_PATH);
            if (!response.ok) throw new Error('Failed to load categories view');
            const html = await response.text();
            container.innerHTML = html;

            // Bind global functions for HTML compatibility
            bindGlobalActions();
        } catch (error) {
            console.error('Error initializing categories:', error);
            showToast('Failed to load Categories interface', 'error');
            return;
        }
    }

    // Load data
    loadCategories();
    loadTagDashboard();
}

/**
 * Binds module functions to window for onclick compatibility
 */
function bindGlobalActions() {
    window.addCategory = addCategory;
    window.deleteCategory = deleteCategory;
    window.loadCategories = loadCategories;
    window.filterByTag = filterByTag;
}

/**
 * Load and render categories
 */
export async function loadCategories() {
    try {
        const [products, cats] = await Promise.all([
            api.getProducts(),
            fetch('/api/categories').then(r => r.json())
        ]);

        productsForTags = products; // Cache for tag dashboard

        // Count products per category
        const counts = {};
        products.forEach(p => {
            const key = String(p.category || 'Uncategorized').trim();
            counts[key] = (counts[key] || 0) + 1;
        });

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
                    
                    <button onclick="deleteCategory('${c.id}')" 
                        class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Category">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Failed to load categories:', e);
        showToast("Failed to load categories", "error");
    }
}

/**
 * Add a new category
 */
export async function addCategory() {
    const input = document.getElementById('new-cat-name');
    const name = input.value.trim();
    if (!name) return;

    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('harvest_token')}`
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) throw new Error('Failed to add category');

        input.value = '';
        loadCategories();
        showToast("Category added successfully");
    } catch (e) {
        showToast("Error adding category", "error");
    }
}

/**
 * Delete a category
 */
export async function deleteCategory(id) {
    if (!confirm("Are you sure you want to delete this category? Products in this category will become uncategorized.")) return;

    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });

        if (!response.ok) throw new Error('Failed to delete category');

        loadCategories();
        showToast("Category deleted");
    } catch (e) {
        showToast("Error deleting category", "error");
    }
}

/**
 * Calculate and render the Tag Dashboard
 */
export async function loadTagDashboard() {
    const container = document.getElementById('tags-container');
    const totalEl = document.getElementById('tag-total-count');
    if (!container) return;

    try {
        const products = productsForTags.length > 0 ? productsForTags : await api.getProducts();
        const tagCounts = {};

        products.forEach(p => {
            let tags = [];
            try {
                // Handle different tag formats (stringified JSON or comma-separated)
                if (typeof p.tags === 'string') {
                    if (p.tags.startsWith('[')) tags = JSON.parse(p.tags);
                    else tags = p.tags.split(',').map(t => t.trim()).filter(Boolean);
                } else if (Array.isArray(p.tags)) {
                    tags = p.tags;
                }
            } catch (e) {
                console.warn(`Malformed tags for product ${p.name}:`, p.tags);
            }

            tags.forEach(tag => {
                const normalized = tag.toLowerCase().trim();
                tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
            });
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1]); // Sort by count desc

        if (totalEl) totalEl.textContent = `${sortedTags.length} Tags`;

        if (sortedTags.length === 0) {
            container.innerHTML = `<div class="text-center py-8 text-gray-400 italic text-sm">No product tags found.</div>`;
            return;
        }

        container.innerHTML = sortedTags.map(([tag, count]) => `
            <div onclick="filterByTag('${tag.replace(/'/g, "\\'")}')" 
                 class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group cursor-pointer border border-transparent hover:border-blue-100">
                <div class="flex items-center gap-3 overflow-hidden">
                    <span class="text-xs">🏷️</span>
                    <span class="font-bold text-gray-700 truncate capitalize">${tag}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[11px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">${count}</span>
                    <button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error('Failed to load tag dashboard:', e);
        container.innerHTML = `<div class="text-center py-8 text-red-400 text-xs">Failed to calculate tag metrics</div>`;
    }
}

/**
 * Filter products by a specific tag and navigate to products view
 */
export function filterByTag(tag) {
    if (window.setTab) {
        window.setTab('products');

        // Wait a tiny bit for the view to switch before searching
        setTimeout(() => {
            const searchInput = document.getElementById('search-products-input');
            if (searchInput) {
                searchInput.value = tag;
                if (window.searchProducts) window.searchProducts(tag);
            }
        }, 50);

        showToast(`Filtering by tag: ${tag}`, 'info');
    }
}

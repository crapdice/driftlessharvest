/**
 * Admin Box Card Component
 * Renders the card style for Box Templates in the Admin Panel.
 * 
 * @param {Object} t - The template object
 * @returns {string} - HTML string
 */
/**
 * Admin Box Card Component
 * Renders the card style for Box Templates in the Admin Panel.
 * 
 * @param {Object} t - The template object
 * @returns {string} - HTML string
 */
export function AdminBoxCard(t, productsList = []) {
    const isActive = t.is_active !== 0;
    const price = typeof t.base_price === 'number' ? t.base_price.toFixed(2) : parseFloat(t.base_price || 0).toFixed(2);
    const escapedT = JSON.stringify(t).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

    const maxItems = 100; // Show all items as requested
    const items = t.items || [];

    // Check for stock issues
    let hasIssue = false;
    const enrichedItems = items.map(i => {
        // Use loose equality to handle string/number mismatches in IDs
        // Handle ID mismatch (product_id vs id)
        const targetId = i.product_id || i.id;
        const p = productsList.find(x => x.id == targetId);

        // Robust checks
        const stockVal = p ? parseInt(p.stock) : (i.stock || 0);

        // p might be missing if archived/deleted. Use i props if available.
        // Backend attachBoxItems provides is_active, is_archived, deleted_at
        const isActive = p
            ? (p.is_active == 1 || p.is_active === true || p.is_active === '1')
            : (i.is_active == 1 || i.is_active === true || i.is_active === '1');

        const isArchived = p
            ? (p.is_archived == 1 || p.is_archived === true)
            : (i.is_archived == 1 || i.is_archived === true);

        const isDeleted = p ? !!p.deleted_at : (i.deleted_at);

        // isOOS Logic: 
        // If Deleted -> Issue
        // If Archived -> Issue
        // If Inactive -> Issue
        // If Stock < Required Qty -> Issue
        const needed = i.qty || i.quantity || 1;
        const isOOS = isDeleted || isArchived || !isActive || stockVal < needed;

        if (isOOS) hasIssue = true;

        // Debug Text
        let debugReason = `(Stock: ${stockVal})`;
        let issueType = 'oos';

        if (isDeleted) {
            debugReason = '(Deleted)';
            issueType = 'deleted';
        } else if (isArchived) {
            debugReason = '(Archived)';
            issueType = 'archived'; // New type
        } else if (!isActive) {
            debugReason = '(Inactive)';
            issueType = 'inactive';
        } else if (!p && !i.name) {
            debugReason = '(Not Found)';
            issueType = 'deleted';
        }

        // Determine final name to display
        // If p exists, usage p.name.
        // If not, usage i.name.
        // If i.name is falsy, usage 'Unknown Product'
        let finalName = 'Unknown Product';
        if (p && p.name) finalName = p.name;
        else if (i.name) finalName = i.name;

        // Return enriched item
        return {
            ...i,
            name: finalName,
            isOOS,
            stock: stockVal,
            issueType,
            debugReason
        };
    });

    const visibleItems = enrichedItems.slice(0, maxItems);
    const hiddenCount = items.length - maxItems;

    // Dynamic Styles for Warning
    const containerClass = hasIssue
        ? "border-red-300 ring-2 ring-red-100 shadow-sm"
        : "border-gray-200 ring-1 ring-black/5 hover:ring-blue-500/20";

    return `
    <div class="group bg-white rounded-xl ${containerClass} overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full relative">
        
        <!-- Image Header -->
        <div class="h-48 bg-gray-100 relative overflow-hidden">
             <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                  style="background-image: url('${t.image_url || '/images/placeholder.jpg'}');"></div>
             <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
             
             <!-- Status Badge -->
             <div class="absolute top-3 left-3 flex gap-2">
                ${(isActive && !hasIssue)
            ? '<span class="px-2.5 py-1 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm">Active</span>'
            : ((!isActive)
                ? '<span class="px-2.5 py-1 rounded-md bg-gray-500/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm">Inactive</span>'
                : '<span class="px-2.5 py-1 rounded-md bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm animate-pulse">Unavailable</span>'
            )}
             </div>

             <!-- Actions (Floating) -->
             <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-y-1 group-hover:translate-y-0">
                <button onclick='window.editTemplate(${escapedT})' 
                    class="bg-white text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg shadow-md transition-all">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button onclick="window.deleteTemplate('${t.id}')" 
                    class="bg-white text-gray-700 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg shadow-md transition-all">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
             </div>

             <!-- Title & Price Overlay -->
             <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div class="flex justify-between items-end">
                    <h3 class="font-bold text-lg leading-tight text-shadow-sm line-clamp-1">${t.name}</h3>
                    <span class="font-mono font-bold bg-white/20 backdrop-blur-md px-2 py-1 rounded text-sm">$${price}</span>
                </div>
             </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex-1 flex flex-col space-y-4">
            <p class="text-gray-500 text-sm line-clamp-2 leading-relaxed h-10">${t.description || 'No description provided.'}</p>
            
            <div class="mt-auto border-t border-gray-100 pt-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        Contents
                    </span>
                    <span class="text-xs font-semibold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">${items.length} items</span>
                </div>
                
                <div class="flex flex-wrap gap-1.5 min-h-[50px] content-start">
                    ${items.length === 0 ? '<span class="text-xs text-gray-300 italic pl-1">Empty box</span>' : ''}
                    
                    ${visibleItems.map(i => {
                const style = i.isOOS
                    ? 'bg-red-50 border-red-200 text-red-600 line-through decoration-red-400'
                    : 'bg-blue-50 border-blue-100 text-blue-700';

                let title = '';
                if (i.isOOS) {
                    if (i.issueType === 'inactive') title = 'Product Inactive';
                    else if (i.issueType === 'archived') title = 'Product Archived';
                    else if (i.issueType === 'deleted') title = 'Product Not Found';
                    else title = 'Out of Stock';
                }

                return `<span class="inline-flex items-center px-2 py-1 rounded border ${style} text-[10px] font-medium" title="${title}">
                            <span class="opacity-50 mr-1 no-underline text-inherit">${i.qty}x</span> ${i.name} ${i.isOOS ? `<span class="ml-1 no-underline font-bold">${i.debugReason}</span>` : ''}
                        </span>`;
            }).join('')}
                    
                    ${hiddenCount > 0 ? `
                        <span class="inline-flex items-center px-2 py-1 rounded bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-medium" title="${enrichedItems.slice(maxItems).map(i => i.name + (i.isOOS ? ' (OOS)' : '')).join(', ')}">
                            +${hiddenCount} more
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
    </div>
    `;
}

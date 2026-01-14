
/**
 * QuantityControl Component
 * Renders the increment/decrement controls for a product.
 * 
 * @param {Object} props
 * @param {string} props.id - Product ID
 * @param {number} props.qty - Current Quantity
 * @param {number} props.price - Unit Price (for the 'Add' button state)
 * @param {boolean} props.isStocked - Is product in stock
 * @param {string} props.layout - 'grid' | 'editorial' | 'compact'
 * @returns {string} HTML string
 */
export function QuantityControl({ id, qty, price, isStocked, maxReached = false, layout = 'grid' }) {
    if (!isStocked) return '';

    const actionFn = `updateProductQty('${id}',`;

    // 1. "Add" State (Qty 0)
    // If maxReached is true here, it means weird state (stock 0 but not globally OOS?), should be covered by ProductCard logic.
    if (qty === 0) {
        if (layout === 'editorial') {
            return `
                <button onclick="${actionFn} 1)" 
                    class="text-sm font-bold uppercase tracking-widest text-nature-900 hover:text-harvest-gold underline decoration-1 underline-offset-4 decoration-nature-300 hover:decoration-harvest-gold transition-all">
                    Add to Bag
                </button>
            `;
        }

        // Grid / Default
        return `
            <button onclick="${actionFn} 1)" 
                class="bg-white text-nature-900 px-6 py-3 rounded-full shadow-xl font-serif italic text-lg hover:bg-harvest-gold hover:text-white flex items-center gap-2 transition-all">
                <span>Add</span>
                <span class="not-italic font-sans text-xs font-bold opacity-60 ml-1">$${price.toFixed(2)}</span>
            </button>
        `;
    }

    // 2. "Edit" State (Qty > 0)
    if (layout === 'editorial') {
        return `
            <div class="flex items-center gap-4">
                <span id="qty-${id}" class="font-mono text-xs border border-nature-900 px-2 py-1">${qty} in bag</span>
                <button id="minus-${id}" onclick="${actionFn} -1)" class="text-xs text-nature-400 hover:text-red-500 ml-2">Remove</button>
                <button onclick="${maxReached ? '' : `${actionFn} 1)`}" 
                    class="text-xs ${maxReached ? 'text-gray-300 cursor-not-allowed' : 'text-nature-900 hover:text-harvest-gold'} font-bold"
                    ${maxReached ? 'disabled title="Max stock reached"' : ''}>
                    ${maxReached ? 'Max Reached' : 'Add Another'}
                </button>
            </div>
        `;
    }

    // Grid / Default (Pill Shape)
    return `
        <div class="flex items-center gap-2 bg-white rounded-full p-1 shadow-xl relative group/ctrl">
            <button id="minus-${id}" onclick="${actionFn} -1)" 
                class="w-10 h-10 rounded-full bg-nature-100 hover:bg-nature-200 text-nature-900 font-bold flex items-center justify-center transition-colors">
                -
            </button>
            <span id="qty-${id}" class="font-serif text-xl w-6 text-center text-nature-900 leading-none">
                ${qty}
            </span>
            <button onclick="${maxReached ? '' : `${actionFn} 1)`}" 
                class="w-10 h-10 rounded-full ${maxReached ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-harvest-gold hover:bg-amber-500 text-white'} font-bold flex items-center justify-center transition-colors"
                ${maxReached ? 'disabled' : ''}>
                +
            </button>
            
            ${maxReached ? `<div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-nature-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/ctrl:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">Max Available</div>` : ''}
        </div>
    `;
}

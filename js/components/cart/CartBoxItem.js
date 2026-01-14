
/**
 * CartBoxItem Component
 * Renders a curated box item with its contents list.
 * 
 * @param {Object} item - Cart item object of type 'box'
 * @returns {string} HTML string
 */
export function CartBoxItem(item) {
    let boxContentHtml = '';
    if (item.items) {
        try {
            const boxItems = typeof item.items === 'string' ? JSON.parse(item.items) : item.items;
            if (Array.isArray(boxItems) && boxItems.length > 0) {
                boxContentHtml = `
                    <div class="mt-4 bg-stone-50/50 rounded-lg p-3 border border-stone-100">
                        <div class="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Contains:</div>
                        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm text-stone-600 font-sans">
                            ${boxItems.map(i => `<li class="flex items-center gap-1">
                                <span class="font-medium text-stone-700">${i.qty} x ${i.name}</span>
                            </li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        } catch (e) { }
    }

    return `
      <div id="cart-item-${item.originalIndex}" class="bg-white p-6 rounded-xl border border-clay grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-x-8 gap-y-6 shadow-sm hover:border-root/30 transition-all duration-300 relative">
        
        <!-- Col 1: Thumbnail -->
        <div class="h-48 w-full md:w-48 bg-stone rounded-lg bg-cover bg-center shadow-inner self-start" style="background-image: url('${item.image_url || ''}');"></div>
        
        <!-- Col 2: Details -->
        <div class="flex flex-col min-w-0">
           <!-- Row 1: Title & Close -->
            <div class="flex justify-between items-start mb-1">
                <h3 class="font-serif text-2xl font-medium text-loam leading-tight">${item.name}</h3>
                <button onclick="removeFromCart(${item.originalIndex})" class="text-stone-300 hover:text-root transition-colors text-2xl leading-none -mt-1 -mr-2 p-2">&times;</button>
            </div>

            <!-- Row 2: Description -->
            <p class="text-stone-500 text-sm font-sans uppercase tracking-wider mb-2">
               ${item.description || 'Seasonal Curated Box'}
            </p>

            <!-- Row 3: Contents -->
            ${boxContentHtml}
        </div>

        <!-- Bottom Row: Pricing Footer (Spans Full Grid) -->
        <div class="col-span-1 md:col-span-2 border-t border-stone-100 pt-4 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
             <div class="text-sm text-stone-500 font-sans bg-stone-50 px-3 py-1.5 rounded flex items-center gap-2">
                <span class="bg-kale/10 text-kale px-2 py-0.5 rounded-full text-xs font-bold">BOX</span>
                <span><span class="font-bold text-charcoal">${item.qty}</span> x $${item.price.toFixed(2)}</span>
             </div>
             
             <div class="text-right">
                 <div class="text-xs text-stone-400 font-bold uppercase tracking-wider mb-0.5">Total Price</div>
                 <div class="font-serif text-3xl text-charcoal font-medium">$${(item.price * item.qty).toFixed(2)}</div>
             </div>
        </div>
      </div>
    `;
}

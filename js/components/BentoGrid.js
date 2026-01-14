
export function BentoGrid(items, config = {}) {
    if (!items || items.length === 0) return '';

    const {
        title = "Editor's Picks",
        subtitle = "Seasonal Favorites",
        showTooltips = true
    } = config;

    return `
        <div class="text-center mb-12">
            <h3 class="text-3xl font-serif text-loam mb-2">${title}</h3>
            <div class="w-16 h-1 bg-kale/20 mx-auto rounded-full"></div>
            <p class="text-stone-500 text-xs uppercase tracking-widest mt-3 font-sans">${subtitle}</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
            ${items.map((item, index) => {
        const price = Number(item.price || item.base_price || 0).toFixed(2);
        const isBox = item.type === 'box';
        const tag = item.category || (isBox ? 'Curated Box' : 'Produce');

        // Smart Grid Logic
        let spanClass = "md:col-span-1 md:row-span-1";
        let layout = "vertical";

        // 1. Hero (Index 0): Always 2x2
        if (index === 0) {
            spanClass = "md:col-span-2 md:row-span-2";
            layout = "hero";
        }
        // 2. Wide (Index 3): Always 2x1 Horizontal
        else if (index === 3) {
            spanClass = "md:col-span-2 md:row-span-1";
            layout = "horizontal";
        }
        // 3. Smart Fill for Orphaned Items (End of list)
        // If we are at the last item (index === items.length - 1) AND we have an odd number of slots filled so far?
        // Actually simpler logic for now: If we have exactly 2 items left at the end of a row (indices 4 & 5 in a 6 item list), they fit 1x1.
        // But if we have 5 items total: 0(4), 1(1), 2(1), 3(2) = 8 slots filled. Row 1+2 filled.
        // Wait, grid is 4 wide.
        // Row 1: Hero(2) + Item1(1) + Item2(1) = 4 cols. Full.
        // Row 2: Hero cont. + Item3(2)? No.
        // Let's stick to the visual plan:
        // Grid: 
        // [ Hero 2x2 ] [ Item1 ] [ Item2 ]  (Row 1, 4 cols)
        // [ Hero 2x2 ] [   Item3 (Wide)  ]  (Row 2, 4 cols)
        // [ Item4 ] [ Item5 ] ...           (Row 3)

        // If we have items 4 and 5 (total 6 items), they sit on Row 3.
        // If we want them to fill the row, they should each be col-span-2.
        else if (index >= 4) {
            const remaining = items.length - 4; // Items on the last row(s)
            // If 2 items remaining, make them both wide
            if (remaining === 2) {
                spanClass = "md:col-span-2 md:row-span-1";
                layout = "horizontal";
            }
            // If 1 item remaining, make it super wide? or just center it? 
            // Let's default to standard 1x1 for >= 3 items in bottom row, or wide for 1-2.
            else if (remaining === 1) {
                spanClass = "md:col-span-4 md:row-span-1"; // Full width
                layout = "horizontal";
            }
        }

        // Tooltip Content for Boxes
        let tooltip = '';
        if (isBox && item.items && showTooltips) { // Assuming 'items' or similar prop holds box contents
            const contents = item.items.map(i => `<li class="text-[10px] text-stone-600 list-disc ml-3">${i.qty || 1}x ${i.name}</li>`).join('');
            tooltip = `
                        <div class="absolute inset-0 bg-paper/95 backdrop-blur-sm p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex flex-col justify-center pointer-events-none">
                            <h5 class="font-serif text-lg text-loam mb-2 text-center">In This Box</h5>
                            <p class="text-xs text-stone-500 mb-3 text-center line-clamp-2">${item.description}</p>
                            <ul class="grid grid-cols-2 gap-1 mb-2 max-h-[120px] overflow-hidden">
                                ${contents || '<li class="text-xs text-stone-400 italic">Seasonal Assortment</li>'}
                            </ul>
                        </div>
                     `;
        }


        return `
                    <div class="${spanClass} bg-white border border-stone-200 overflow-hidden hover:border-kale/50 transition-all duration-300 group relative flex ${layout === 'horizontal' ? 'flex-row' : 'flex-col'} hover:shadow-lg hover:scale-[1.01] hover:z-10">
                        
                        ${tooltip}

                        <!-- Image Container -->
                        <div class="${layout === 'horizontal' ? 'w-1/2 h-full' : (layout === 'hero' ? 'absolute inset-0' : 'h-40')} bg-stone bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                             style="background-image: url('${item.image_url || ''}');">
                             ${layout === 'hero' ? '<div class="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-transparent"></div>' : ''}
                        </div>

                        <!-- Tag -->
                        <div class="absolute top-4 left-4 z-20 bg-paper/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-charcoal border border-white/20 shadow-sm rounded-sm">
                            ${tag}
                        </div>

                        <!-- Content -->
                        ${layout === 'hero' ? `
                            <div class="absolute bottom-0 left-0 right-0 p-8 text-white z-20">
                                <h4 class="font-serif text-4xl mb-2 tracking-tight">${item.name}</h4>
                                <p class="text-white/80 text-sm mb-6 line-clamp-2 max-w-lg font-light leading-relaxed">${item.description || 'Fresh from the farm.'}</p>
                                <div class="flex items-center justify-between">
                                    <span class="font-sans font-medium text-2xl tracking-tight">$${price}</span>
                                    <button onclick="addToCart('${item.id}', '${item.type || 'product'}')" class="bg-white text-kale px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-kale hover:text-white transition-colors shadow-lg">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ` : (layout === 'horizontal' ? `
                             <div class="w-1/2 p-6 flex flex-col justify-center bg-white relative z-10">
                                <h4 class="font-serif text-xl text-loam mb-2 leading-tight">${item.name}</h4>
                                <p class="text-stone-500 text-xs mb-4 line-clamp-2 leading-relaxed">${item.description || ''}</p>
                                <div class="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
                                    <span class="font-sans font-medium text-lg text-charcoal">$${price}</span>
                                    <button onclick="addToCart('${item.id}', '${item.type || 'product'}')" class="text-kale hover:text-loam font-bold text-[10px] uppercase tracking-wider border-b border-kale/20 pb-0.5 hover:border-loam transition-colors">
                                        Add
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <div class="p-5 flex flex-col flex-1 relative bg-white z-10">
                                <h4 class="font-serif text-lg text-loam mb-1 leading-tight">${item.name}</h4>
                                <div class="mt-auto flex items-center justify-between pt-3 border-t border-stone-100">
                                    <span class="font-sans font-medium text-charcoal">$${price}</span>
                                    <button onclick="addToCart('${item.id}', '${item.type || 'product'}')" class="text-kale hover:text-loam font-bold text-[10px] uppercase tracking-wider border-b border-kale/20 pb-0.5 hover:border-loam transition-colors">
                                        Add
                                    </button>
                                </div>
                            </div>
                        `)}
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

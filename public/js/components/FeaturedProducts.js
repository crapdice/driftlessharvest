
export function FeaturedProducts(items, config = {}) {
    if (!items || items.length === 0) return '';

    const {
        title = "Fresh this Week",
        subtitle = "Curated Selections"
    } = config;

    // Layout Logic for Uniformity
    // 1, 2, 4 items -> Use a 2-column or 1-column max-width constraint to keep things balanced.
    // 3, 5, 6 items -> Use 3-column.
    // For 5 items specifically, we want the last row to be centered (2 items). 
    // Flexbox `justify-center` with `flex-wrap` is often cleaner for "centering the odd ones out" 
    // than Grid, provided the widths are consistent.

    let containerClass = "grid md:grid-cols-3 gap-8";

    // If we have 4 items, 2x2 looks much better than 3+1.
    // If we have 2 items, 2 cols centered.
    if (items.length === 2 || items.length === 4) {
        containerClass = "grid md:grid-cols-2 gap-x-8 gap-y-16 max-w-4xl mx-auto";
    } else if (items.length === 1) {
        containerClass = "grid grid-cols-1 gap-x-8 gap-y-16 max-w-lg mx-auto";
    } else if (items.length === 5) {
        // For 5 layout (3 top, 2 bottom centered), Grid is tricky without specific spans.
        // Let's use Flexbox to naturally wrap and center.
        containerClass = "flex flex-wrap justify-center gap-8 max-w-7xl mx-auto";
    } else {
        // Default 3-column
        containerClass = "grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 max-w-7xl mx-auto";
    }

    return `
        <div class="text-center mb-16">
            <h3 class="text-4xl md:text-5xl font-serif text-nature-900 mb-4">${title}</h3>
            <p class="text-nature-500 text-sm uppercase tracking-[0.2em] font-sans">${subtitle}</p>
        </div>
        
        <div class="${containerClass}">
            ${items.map(item => {
        const price = Number(item.price || item.base_price || 0).toFixed(2);
        const tag = item.category || (item.type === 'box' ? 'Curated Box' : 'Seasonal');

        return `
            <div class="group cursor-pointer flex flex-col items-center">
                <!-- Image Container -->
                <div class="relative w-full aspect-[4/5] overflow-hidden bg-nature-100 mb-6">
                    <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                         style="background-image: url('${item.image_url || ''}');"></div>
                    
                    <!-- Tag -->
                    <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-nature-800">
                        ${tag}
                    </div>

                    <!-- Quick Add Button (Hover) -->
                    <button onclick="addToCart('${item.id}', '${item.type || 'product'}'); event.stopPropagation();" 
                            class="absolute bottom-6 right-6 bg-white text-nature-900 px-6 py-3 rounded-full shadow-xl 
                                   opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 
                                   font-serif italic text-lg hover:bg-harvest-gold hover:text-white flex items-center gap-2">
                        <span>Add to Cart</span>
                        <span class="not-italic font-sans text-xs font-bold opacity-60 ml-1">$${price}</span>
                    </button>
                </div>

                <!-- Content -->
                <h4 class="font-serif text-2xl text-nature-900 mb-2 group-hover:text-harvest-gold transition-colors">${item.name}</h4>
                <p class="text-nature-500 font-sans font-light text-sm line-clamp-2 max-w-xs text-center">${item.description || ''}</p>
            </div>
        `;
    }).join('')}
        </div>
    `;
}

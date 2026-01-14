
import { state } from '../../modules/state.js';
import { QuantityControl } from '../QuantityControl.js';

/**
 * ProductCard Component
 * Renders a single product item in either 'grid' or 'editorial' (list) layout.
 * 
 * @param {Object} item - The product object { id, name, price, image_url, stock, tags, ... }
 * @param {string} layout - 'grid' or 'editorial'
 * @returns {string} HTML string
 */
export function ProductCard(item, layout = 'grid') {
    const inCart = state.cart.find(c => String(c.id) === String(item.id));
    const qtyInCart = inCart ? inCart.qty : 0;

    // item.stock is "Remaining Stock" (decremented by loadMarketplace)
    // So if I have 3 in cart and 0 remaining, item.stock is 0.
    // True "Sold Out" is when I have 0 in cart AND 0 remaining.
    const isGloballyOutOfStock = item.stock <= 0 && qtyInCart === 0;
    const isMaxedOut = item.stock <= 0 && qtyInCart > 0;

    // --- EDITORIAL (LIST) LAYOUT ---
    if (layout === 'editorial') {
        const showLowStock = !isGloballyOutOfStock && item.stock < 10 && item.stock > 0;

        return `
        <div class="py-12 flex flex-col md:flex-row gap-8 items-start group">
            <div class="w-full md:w-1/3 aspect-square bg-nature-100 relative overflow-hidden cursor-pointer">
                 <img src="${item.image_url}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isGloballyOutOfStock ? 'grayscale' : ''}">
                 ${showLowStock ? `<span class="absolute top-2 left-2 text-[10px] font-mono border border-nature-900 px-1 bg-white">LOW STOCK</span>` : ''}
            </div>
            <div class="flex-1 pt-2">
                <div class="flex justify-between items-baseline mb-4">
                    <h3 class="font-serif text-2xl text-nature-900">${item.name}</h3>
                    <span class="font-serif text-lg italic text-nature-600">$${item.price.toFixed(2)}</span>
                </div>
                <p class="font-serif text-nature-600 leading-relaxed mb-6 max-w-md">Freshly harvested. ${(item.tags || []).join(', ')}.</p>
                
                ${!isGloballyOutOfStock ? `
                     <div id="ctrl-${item.id}">
                        ${QuantityControl({ id: item.id, qty: qtyInCart, price: item.price, isStocked: true, maxReached: isMaxedOut, layout: 'editorial' })}
                     </div>
                ` : '<span class="font-mono text-sm uppercase text-nature-400">Out of Stock</span>'}
            </div>
        </div>
        `;
    }

    // --- STANDARD GRID LAYOUT ---
    return `
    <div class="group cursor-pointer flex flex-col items-center relative">
        <div class="relative w-full aspect-[4/5] overflow-hidden bg-nature-100 mb-6 rounded-sm">
             <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 ${isGloballyOutOfStock ? 'grayscale' : ''}" style="background-image: url('${item.image_url}');"></div>
             ${isGloballyOutOfStock ? `<div class="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]"><span class="bg-nature-900 text-white px-4 py-2 text-sm font-bold uppercase tracking-widest">Sold Out</span></div>` : ''}
             ${!isGloballyOutOfStock && item.stock < 10 && item.stock > 0 ? `<div class="absolute top-2 right-2 bg-harvest-gold text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">Low Stock</div>` : ''}

             ${!isGloballyOutOfStock ? `
               <div class="absolute bottom-6 right-6 z-20" id="ctrl-${item.id}">
                    ${QuantityControl({ id: item.id, qty: qtyInCart, price: item.price, isStocked: true, maxReached: isMaxedOut, layout: 'grid' })}
               </div>
             ` : ''}
        </div>
    
        <h3 class="font-serif text-2xl font-medium text-nature-900 mb-1 group-hover:text-harvest-gold transition-colors">${item.name}</h3>
        <div class="flex items-center gap-2 text-sm text-nature-500 font-sans">
             <span>$${item.price.toFixed(2)} / unit</span>
             ${(item.tags || []).slice(0, 1).map(t => `<span class="bg-nature-100 text-nature-600 px-2 py-0.5 rounded-[2px] text-[10px] uppercase tracking-wider font-bold">${t}</span>`).join('')}
        </div>
    </div>`;
}

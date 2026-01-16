import { QuantityControl } from '../QuantityControl.js';

/**
 * CartProductItem Component
 * Renders a standard product line item in the cart.
 * 
 * @param {Object} item - Cart item object
 * @param {string} extraContent - Optional HTML string
 * @param {string} badges - Optional HTML string
 * @returns {string} HTML string
 */
export function CartProductItem(item, extraContent = '', badges = '') {
  const { originalIndex, id, name, image_url, price, qty, subtitle, stock } = item;

  // Default subtitle logic if not passed
  const finalSubtitle = subtitle || item.category || item.description || 'Produce';

  // Determine if max stock is reached (user has all available stock in cart)
  const maxReached = stock !== undefined && qty >= stock;

  return `
          <div id="cart-item-${originalIndex}" class="bg-white p-6 rounded-xl border border-clay flex items-center gap-6 shadow-sm hover:border-root/30 transition-all duration-300 relative group h-full">
            <button onclick="removeFromCart(${originalIndex})" class="absolute top-2 right-2 text-stone-300 hover:text-root transition-colors p-2 text-xl leading-none" title="Remove all from cart">&times;</button>
            
            <div class="h-24 w-24 bg-stone rounded-lg bg-cover bg-center flex-shrink-0" style="background-image: url('${image_url || ''}');"></div>
            
            <div class="flex-1 min-w-0">
              <h3 class="font-serif text-xl font-medium text-loam mb-2 pr-4 leading-tight">${name}</h3>
              <p class="text-stone-500 text-sm font-sans uppercase tracking-wider mb-4">
                ${badges}
                ${finalSubtitle}
              </p>

              ${extraContent}
              
              <div class="flex justify-between items-end border-t border-stone-100 pt-3 mt-2">
                  <div class="flex items-center gap-4">
                    <div id="cart-ctrl-${id}" class="scale-90 origin-left">
                      ${QuantityControl({
    id,
    qty,
    price,
    isStocked: true,
    maxReached,
    layout: 'compact'
  })}
                    </div>
                    <div class="text-xs text-stone-400 font-sans">
                      $${price.toFixed(2)} each
                    </div>
                  </div>
                  <div class="text-right">
                     <div id="cart-total-${id}" class="font-serif text-2xl text-charcoal font-medium">$${(price * qty).toFixed(2)}</div>
                  </div>
              </div>
            </div>
          </div>
    `;
}

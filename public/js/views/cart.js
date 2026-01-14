import { store } from '../store/index.js';
import { setView } from '../modules/router.js';
import { CartProductItem } from '../components/cart/CartProductItem.js';
import { CartBoxItem } from '../components/cart/CartBoxItem.js';

export function renderCart() {
  const cart = store.getCart().items;

  if (cart.length === 0) {
    return `
      <section class="max-w-4xl mx-auto px-6 py-24 text-center space-y-6">
        <h2 class="text-4xl font-serif text-loam">Your Cart</h2>
        <p class="text-charcoal/60 font-sans text-lg">Your harvest basket is currently empty.</p>
        <button onclick="setView('boxes')" class="bg-root text-paper px-8 py-3 rounded-full font-serif text-lg hover:bg-loam transition-colors shadow-sm">Start Filling Your Box</button>
      </section>
      `;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Helper to separate items but keep track of original index for deletion
  const cartWithIndex = cart.map((item, index) => ({ ...item, originalIndex: index }));
  const boxes = cartWithIndex.filter(i => i.type === 'box');
  const products = cartWithIndex.filter(i => i.type !== 'box');

  return `
      <section class="max-w-4xl mx-auto px-6 py-12">
      <h2 class="text-4xl font-serif text-loam mb-10">Shopping Cart</h2>
      
      <div class="space-y-12">
        ${boxes.length > 0 ? `
            <div>
                <h3 class="text-2xl font-serif text-loam mb-6 border-b border-clay pb-2">Curated Boxes</h3>
                <div class="space-y-6">
                    ${boxes.map(CartBoxItem).join('')}
                </div>
            </div>
        ` : ''}

        ${products.length > 0 ? `
            <div>
                <h3 class="text-2xl font-serif text-loam mb-6 border-b border-clay pb-2">Market Products</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${products.map(p => CartProductItem(p)).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="py-8 border-t border-clay mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <button onclick="setView('boxes')" class="text-loam underline decoration-loam/30 underline-offset-4 hover:decoration-loam transition-all">Continue Shopping</button>
           
           <div class="flex items-center gap-8">
             <div class="text-3xl font-serif text-loam font-medium">$${total.toFixed(2)}</div>
             <button onclick="setView('checkout')" class="bg-yellow-400 text-paper px-10 py-4 rounded-full font-serif text-xl hover:bg-loam shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5">Proceed to Checkout</button>
           </div>
        </div>
      </div>
    </section>
      `;
}

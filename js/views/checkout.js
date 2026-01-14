
import { state } from '../modules/state.js';
import { renderCart } from './cart.js';
import { renderReceipt } from './receipt.js';
import { formatPhoneNumber } from '../utils.js';

export function renderCheckout() {
    if (state.cart.length === 0) return renderCart();

    // Pre-fill if logged in
    const user = state.user || {};
    const address = user.address || {};

    // Fetch delivery windows asynchronously
    // Note: ideally this should be in a store/action, but for now we keep it here as in script.js
    fetch('/api/delivery-windows')
        .then(res => res.json())
        .then(wins => {
            const container = document.getElementById('checkout-windows');
            if (container) {
                if (wins.length === 0) {
                    container.innerHTML = '<div class="col-span-2 text-red-500 p-4 bg-red-50 rounded text-center">No delivery windows available. Please contact support.</div>';
                } else {
                    container.innerHTML = wins.map((w, i) => `
      <label class="block p-4 border border-stone-200 rounded-lg cursor-pointer hover:border-kale has-[:checked]:border-kale has-[:checked]:bg-kale/5 transition-all">
        <input type="radio" name="delivery-date" value="${w.date_label}" ${i === 0 ? 'checked' : ''} class="accent-kale h-4 w-4">
          <span class="block font-serif font-medium text-lg mt-1 text-loam">${w.date_label}</span>
          <span class="text-sm text-stone-500 font-sans">8am - 8pm</span>
        </label>
    `).join('');
                }
            }
        }).catch(() => { });

    return `
    <section class="max-w-6xl mx-auto px-6 py-12">
      <div class="flex items-center gap-4 mb-8">
        <button onclick="setView('cart')" class="text-nature-400 hover:text-nature-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
        <h2 class="text-4xl font-serif text-nature-900 leading-tight">Secure Checkout</h2>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
        
        <!-- Left Column: Forms -->
        <div class="lg:col-span-7 space-y-12">
            
            <!-- 1. Delivery -->
            <div class="group">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-10 h-10 rounded-full bg-nature-900 text-nature-50 flex items-center justify-center font-serif text-xl shadow-lg ring-4 ring-nature-50">1</div>
                    <h3 class="text-2xl font-serif text-nature-900">Delivery Schedule</h3>
                </div>
                
                <div id="checkout-windows" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-14">
                    <div class="col-span-2 py-12 text-center">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-nature-200 border-t-nature-900"></div>
                        <p class="mt-4 text-nature-400 font-sans text-sm tracking-widest uppercase">Finding local routes...</p>
                    </div>
                </div>
            </div>

            <!-- 2. Address -->
            <div class="group opacity-50 hover:opacity-100 transition-opacity duration-300 focus-within:opacity-100">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-10 h-10 rounded-full bg-white border-2 border-nature-200 text-nature-300 flex items-center justify-center font-serif text-xl group-focus-within:bg-nature-900 group-focus-within:text-white group-focus-within:border-nature-900 transition-colors">2</div>
                    <h3 class="text-2xl font-serif text-nature-900">Shipping Address</h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pl-14">
                    <div class="relative">
                        <input type="text" id="checkout-first-name" placeholder=" " 
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none" 
                            value="${user.firstName || ''}">
                        <label for="checkout-first-name" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">First Name</label>
                    </div>

                    <div class="relative">
                        <input type="text" id="checkout-last-name" placeholder=" " 
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none" 
                            value="${user.lastName || ''}">
                        <label for="checkout-last-name" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">Last Name</label>
                    </div>

                    <div class="md:col-span-2 relative">
                         <input type="email" id="checkout-email" placeholder=" " 
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none" 
                            value="${user.email || ''}" ${user.email ? 'readonly' : ''}>
                        <label for="checkout-email" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">Email Address</label>
                    </div>

                    <div class="md:col-span-2 relative">
                        <input type="text" id="checkout-address" placeholder=" " 
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none" 
                            value="${address.street || ''}">
                        <label for="checkout-address" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">Street Address</label>
                    </div>

                    <div class="relative">
                        <input type="text" id="checkout-city" placeholder=" " 
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none" 
                            value="${address.city || ''}">
                        <label for="checkout-city" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">City</label>
                    </div>

                    <div class="relative">
                       <input type="text" id="checkout-state" placeholder=" " list="us-states" maxlength="2"
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none uppercase" 
                            value="${address.state || ''}">
                        <label for="checkout-state" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">State</label>
                    </div>
                    
                    <div class="relative md:col-span-2">
                         <input type="text" id="checkout-zip" placeholder=" " 
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none" 
                            value="${address.zip || ''}">
                        <label for="checkout-zip" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">ZIP Code</label>
                    </div>
                     <div class="relative md:col-span-2">
                        <input type="tel" id="checkout-phone" placeholder=" " 
                            class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none" 
                            value="${user.phone || ''}">
                        <label for="checkout-phone" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">Phone Number</label>
                    </div>
                </div>
            </div>

            <!-- 3. Billing Address -->
            <div class="group opacity-50 hover:opacity-100 transition-opacity duration-300 focus-within:opacity-100">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-10 h-10 rounded-full bg-white border-2 border-nature-200 text-nature-300 flex items-center justify-center font-serif text-xl group-focus-within:bg-nature-900 group-focus-within:text-white group-focus-within:border-nature-900 transition-colors">3</div>
                    <h3 class="text-2xl font-serif text-nature-900">Billing Address</h3>
                </div>

                <div class="pl-14 space-y-6">
                     <label class="flex items-center gap-3 cursor-pointer group/check">
                        <input type="checkbox" id="billing-same-as-shipping" checked class="w-5 h-5 accent-nature-900 rounded border-gray-300 focus:ring-harvest-gold transition-all"
                               onchange="document.getElementById('billing-form-container').classList.toggle('hidden', this.checked)">
                        <span class="font-sans text-nature-700 group-hover/check:text-nature-900 transition-colors">Billing address same as shipping</span>
                    </label>

                    <div id="billing-form-container" class="hidden grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-nature-100">
                        <!-- Billing Fields (Mirrors Shipping) -->
                         <div class="relative">
                            <input type="text" id="billing-first-name" placeholder=" " class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none">
                            <label for="billing-first-name" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">First Name</label>
                        </div>
                        <div class="relative">
                            <input type="text" id="billing-last-name" placeholder=" " class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none">
                            <label for="billing-last-name" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">Last Name</label>
                        </div>
                        <div class="md:col-span-2 relative">
                            <input type="text" id="billing-address" placeholder=" " class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none">
                            <label for="billing-address" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">Street Address</label>
                        </div>
                        <div class="relative">
                            <input type="text" id="billing-city" placeholder=" " class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none">
                            <label for="billing-city" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">City</label>
                        </div>
                        <div class="relative">
                           <input type="text" id="billing-state" placeholder=" " list="us-states" maxlength="2" class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none uppercase">
                            <label for="billing-state" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">State</label>
                        </div>
                        <div class="relative md:col-span-2">
                             <input type="text" id="billing-zip" placeholder=" " class="peer block w-full px-4 py-4 bg-nature-50 border-0 rounded-lg ring-1 ring-nature-200 focus:ring-2 focus:ring-harvest-gold focus:bg-white placeholder-transparent transition-all outline-none">
                            <label for="billing-zip" class="absolute left-4 -top-2 text-xs text-nature-500 bg-white px-1 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-nature-400 peer-placeholder-shown:top-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-nature-500 peer-focus:bg-white">ZIP Code</label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. Payment -->
            <div class="group opacity-50 hover:opacity-100 transition-opacity duration-300">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-10 h-10 rounded-full bg-white border-2 border-nature-200 text-nature-300 flex items-center justify-center font-serif text-xl">4</div>
                     <h3 class="text-2xl font-serif text-nature-900">Payment Method</h3>
                </div>
                <div class="pl-14">
                    <div id="payment-element" class="min-h-[150px]">
                         <!-- Stripe Elements will be injected here -->
                         <div class="flex items-center gap-3 p-4 bg-gray-50 rounded text-gray-500 text-sm animate-pulse">
                            <div class="w-4 h-4 rounded-full bg-gray-200"></div>
                            Loading secure payment options...
                         </div>
                    </div>
                    <div id="payment-message" class="hidden mt-4 text-red-600 text-sm"></div>
                </div>
            </div>

            <button onclick="placeOrder()" class="w-full bg-nature-900 text-white py-6 rounded-full font-serif font-bold text-2xl hover:bg-harvest-gold hover:text-nature-900 shadow-xl transition-all transform hover:-translate-y-1 mt-8">
                Confirm Harvest Order
            </button>
        </div>

        <!-- Right Column: Sticky Summary -->
        <div class="lg:col-span-5 relative hidden lg:block">
            <div class="sticky top-32 bg-white p-8 rounded-2xl shadow-2xl border border-nature-100/50">
                 ${renderReceipt(state.cart, state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0))}
                 
                 <!-- Trust Badges -->
                 <div class="mt-8 pt-8 border-t border-nature-100 flex justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                     <span class="text-xs font-sans text-nature-300 flex flex-col items-center gap-1">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Secure
                     </span>
                      <span class="text-xs font-sans text-nature-300 flex flex-col items-center gap-1">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        Guaranteed
                     </span>
                 </div>
            </div>
        </div>
      </div>
    </section>

    <!-- State Suggestions -->
    <datalist id="us-states">
      <option value="AL"><option value="AK"><option value="AZ"><option value="AR"><option value="CA">
      <option value="CO"><option value="CT"><option value="DE"><option value="FL"><option value="GA">
      <option value="HI"><option value="ID"><option value="IL"><option value="IN"><option value="IA">
      <option value="KS"><option value="KY"><option value="LA"><option value="ME"><option value="MD">
      <option value="MA"><option value="MI"><option value="MN"><option value="MS"><option value="MO">
      <option value="MT"><option value="NE"><option value="NV"><option value="NH"><option value="NJ">
      <option value="NM"><option value="NY"><option value="NC"><option value="ND"><option value="OH">
      <option value="OK"><option value="OR"><option value="PA"><option value="RI"><option value="SC">
      <option value="SD"><option value="TN"><option value="TX"><option value="UT"><option value="VT">
      <option value="VA"><option value="WA"><option value="WV"><option value="WI"><option value="WY">
    </datalist>
  `;
}

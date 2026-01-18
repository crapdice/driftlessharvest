import { store } from '../store/index.js';
import { setView, navigateTo } from '../modules/router.js';

let dashboardTab = new URLSearchParams(window.location.search).get('tab') || 'orders';

const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New_Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

export function setDashboardTab(tab) {
  dashboardTab = tab;
  navigateTo(`/dashboard?tab=${tab}`);
}

window.toggleShippingAddress = function () {
  const isSame = document.getElementById('same-as-billing').checked;
  const shippingFields = document.getElementById('shipping-fields');
  if (isSame) {
    shippingFields.classList.add('hidden');
    // Smart Default: Copy Billing to Shipping if unchecking later
  } else {
    shippingFields.classList.remove('hidden');
    // If empty, auto-fill from billing
    const sStreet = document.getElementById('shipping-street');
    if (!sStreet.value) {
      document.getElementById('shipping-street').value = document.getElementById('billing-street').value;
      document.getElementById('shipping-city').value = document.getElementById('billing-city').value;
      document.getElementById('shipping-state').value = document.getElementById('billing-state').value;
      document.getElementById('shipping-zip').value = document.getElementById('billing-zip').value;
      document.getElementById('shipping-phone').value = document.getElementById('billing-phone').value;
    }
  }
};

export function renderDashboard() {
  const user = store.getUser();
  if (!user) {
    setTimeout(() => setView('login'), 0);
    return '';
  }

  const activeClass = 'bg-kale/10 text-kale font-bold';
  const inactiveClass = 'text-charcoal/70 hover:bg-stone hover:text-loam font-medium';

  // Load data immediately
  setTimeout(() => {
    console.log('[Dashboard] Tab:', dashboardTab);
    console.log('[Dashboard] loadUserOrders exists:', typeof window.loadUserOrders);
    console.log('[Dashboard] loadUserProfile exists:', typeof window.loadUserProfile);

    if (dashboardTab === 'orders' && typeof window.loadUserOrders === 'function') {
      console.log('[Dashboard] Calling loadUserOrders...');
      window.loadUserOrders();
    }
    if (dashboardTab === 'profile' && typeof window.loadUserProfile === 'function') {
      console.log('[Dashboard] Calling loadUserProfile...');
      window.loadUserProfile();
    }
  }, 0);

  return `
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="flex flex-col md:flex-row gap-12">

          <!-- Sidebar -->
          <aside class="w-full md:w-72 space-y-8">
            <div class="bg-paper border border-stone-200 p-8 text-center rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
              <div class="w-24 h-24 bg-stone rounded-full flex items-center justify-center text-4xl mb-4 mx-auto text-charcoal/50">👤</div>
              <div class="font-serif font-bold text-loam text-xl truncate px-2">${user.email}</div>
              <div class="text-[10px] uppercase tracking-widest text-kale font-bold mt-2">Community Member</div>
            </div>

            <nav class="space-y-1">
              <button onclick="setDashboardTab('orders')" class="w-full text-left px-6 py-4 transition-all border-l-4 group ${dashboardTab === 'orders' ? 'border-root bg-white text-loam font-bold shadow-sm' : 'border-transparent text-stone-500 hover:text-loam hover:bg-stone/30 font-medium'}">
                  <span class="flex items-center gap-3">
                    <svg class="w-5 h-5 ${dashboardTab === 'orders' ? 'text-root' : 'text-stone-400 group-hover:text-loam'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    Order History
                  </span>
              </button>
              <button onclick="setDashboardTab('profile')" class="w-full text-left px-6 py-4 transition-all border-l-4 group ${dashboardTab === 'profile' ? 'border-root bg-white text-loam font-bold shadow-sm' : 'border-transparent text-stone-500 hover:text-loam hover:bg-stone/30 font-medium'}">
                  <span class="flex items-center gap-3">
                    <svg class="w-5 h-5 ${dashboardTab === 'profile' ? 'text-root' : 'text-stone-400 group-hover:text-loam'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    My Profile
                  </span>
              </button>
              <div class="h-px bg-stone-200 my-2 mx-4"></div>
              <button onclick="logout()" class="w-full text-left px-6 py-4 text-charcoal/70 hover:text-root font-medium transition-colors group">
                  <span class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-stone-400 group-hover:text-root" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                  </span>
              </button>
            </nav>
          </aside>

          <!-- Main Content -->
          <main class="flex-1 min-h-[500px]">
            <div class="mb-10">
              <h1 class="text-4xl font-serif text-loam mb-2">${dashboardTab === 'orders' ? 'Order History' : 'My Profile'}</h1>
              <p class="text-stone-500 font-sans tracking-wide text-sm uppercase">${dashboardTab === 'orders' ? 'Track your past harvests' : 'Manage your account details'}</p>
            </div>

            <div id="dashboard-content" class="fade-in">
              ${dashboardTab === 'orders' ?
      `<div id="dashboard-orders-list" class="space-y-6">
                   <div class="flex justify-center py-20"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-kale"></div></div>
                 </div>` :
      `<form onsubmit="updateProfile(event)" class="space-y-8 max-w-3xl">

        <!-- 1. Contact Info -->
        <div class="bg-white p-8 border border-stone-200 shadow-sm relative group overflow-hidden rounded-sm">
          <div class="absolute top-0 left-0 w-1 h-full bg-kale"></div>
          <h3 class="font-serif text-xl text-loam mb-6 flex items-center gap-2">
            <span class="text-kale">●</span> Contact Information
          </h3>

          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">First Name</label>
                <input type="text" id="prof-first-name" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="e.g. Jane">
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Last Name</label>
                <input type="text" id="prof-last-name" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="e.g. Doe">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Email Address</label>
                <input type="email" id="prof-email" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" required>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Phone Number</label>
                <input type="tel" id="prof-phone" oninput="handlePhoneInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="(555) 123-4567">
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Billing Address -->
        <div class="bg-white p-8 border border-stone-200 shadow-sm relative group overflow-hidden rounded-sm">
          <div class="absolute top-0 left-0 w-1 h-full bg-root"></div>
          <h3 class="font-serif text-xl text-loam mb-6 flex items-center gap-2">
            <span class="text-root">●</span> Billing Address
          </h3>

          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Street Address</label>
              <input type="text" id="billing-street" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors">
            </div>

            <div class="grid grid-cols-6 gap-4">
              <div class="col-span-3 space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">City</label>
                <input type="text" id="billing-city" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors">
              </div>
              <div class="col-span-1 space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">State</label>
                <select id="billing-state" onblur="validateInput(this)" onchange="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors text-sm">
                  <option value="">--</option>
                  ${Object.keys(US_STATES).map(code => `<option value="${code}">${code}</option>`).join('')}
                </select>
              </div>
              <div class="col-span-2 space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Zip Code</label>
                <input type="text" id="billing-zip" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Billing Phone (Optional)</label>
              <input type="tel" id="billing-phone" oninput="handlePhoneInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors" placeholder="Same as Contact if blank">
            </div>
          </div>
        </div>

        <!-- 3. Shipping Address -->
        <div class="bg-white p-8 border border-stone-200 shadow-sm relative group overflow-hidden rounded-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-serif text-xl text-loam flex items-center gap-2">
              <span class="text-harvest-black">●</span> Shipping Address
            </h3>
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" id="same-as-billing" onchange="toggleShippingAddress()" class="w-5 h-5 text-kale border-stone-300 rounded focus:ring-kale" checked>
                <span class="text-stone-600 text-sm font-medium">Same as Billing</span>
            </label>
          </div>

          <div id="shipping-fields" class="space-y-6 hidden">
            <div class="space-y-2">
              <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Street Address</label>
              <input type="text" id="shipping-street" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-harvest-gold focus:ring-0 transition-colors">
            </div>

            <div class="grid grid-cols-6 gap-4">
              <div class="col-span-3 space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">City</label>
                <input type="text" id="shipping-city" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-harvest-gold focus:ring-0 transition-colors">
              </div>
              <div class="col-span-1 space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">State</label>
                <select id="shipping-state" onblur="validateInput(this)" onchange="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-harvest-gold focus:ring-0 transition-colors text-sm">
                  <option value="">--</option>
                  ${Object.keys(US_STATES).map(code => `<option value="${code}">${code}</option>`).join('')}
                </select>
              </div>
              <div class="col-span-2 space-y-2">
                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Zip Code</label>
                <input type="text" id="shipping-zip" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-harvest-gold focus:ring-0 transition-colors">
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Delivery Phone (Optional)</label>
              <input type="tel" id="shipping-phone" oninput="handlePhoneInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-harvest-gold focus:ring-0 transition-colors" placeholder="For delivery updates">
            </div>
          </div>
        </div>

        <!-- Security -->
        <div class="bg-white p-8 border border-stone-200 shadow-sm relative group overflow-hidden rounded-sm">
          <h3 class="font-serif text-xl text-loam mb-6"><span class="text-harvest-black">●</span> Account Security
          </h3>
          
          <div class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                     <label class="text-xs font-bold text-stone-500 uppercase tracking-wider block">Password</label>
                     <p class="text-sm text-stone-400 mt-1">**************</p>
                </div>
                <button type="button" id="change-password-btn" onclick="document.getElementById('password-fields-container').classList.toggle('hidden');" class="text-sm font-bold text-kale hover:text-harvest-gold transition-colors underline decoration-2 underline-offset-4">
                    Change Password
                </button>
            </div>

            <div id="password-fields-container" class="hidden space-y-4 pt-4 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">New Password</label>
                        <input type="password" id="prof-password" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="Min 8 characters">
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Confirm Password</label>
                        <input type="password" id="prof-password-confirm" onblur="validateInput(this)" oninput="validateInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="Re-type password">
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4">
          <button type="submit" id="save-profile-btn" class="bg-harvest-gold text-nature-900 px-8 py-3 rounded-full font-serif text-lg hover:bg-yellow-400 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
            Save Changes
          </button>
        </div>
      </form>`
    }
            </div>
          </main>
        </div>
    </div>
      `;
}

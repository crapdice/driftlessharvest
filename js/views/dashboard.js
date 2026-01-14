
import { state } from '../modules/state.js';
import { setView } from '../modules/router.js';

let dashboardTab = 'orders';

export function setDashboardTab(tab) {
  dashboardTab = tab;
  // We assume setView will re-render
  setView('dashboard');
}

export function renderDashboard() {
  if (!state.user) {
    setTimeout(() => setView('login'), 0);
    return '';
  }

  const activeClass = 'bg-kale/10 text-kale font-bold';
  const inactiveClass = 'text-charcoal/70 hover:bg-stone hover:text-loam font-medium';

  // Load data immediately
  setTimeout(() => {
    if (dashboardTab === 'orders' && typeof window.loadUserOrders === 'function') window.loadUserOrders();
    if (dashboardTab === 'profile' && typeof window.loadUserProfile === 'function') window.loadUserProfile();
  }, 0);

  return `
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="flex flex-col md:flex-row gap-12">

          <!-- Sidebar -->
          <aside class="w-full md:w-72 space-y-8">
            <div class="bg-paper border border-stone-200 p-8 text-center rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
              <div class="w-24 h-24 bg-stone rounded-full flex items-center justify-center text-4xl mb-4 mx-auto text-charcoal/50">👤</div>
              <div class="font-serif font-bold text-loam text-xl truncate px-2">${state.user.email}</div>
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
      `<form onsubmit="updateProfile(event)" class="space-y-8 max-w-2xl">
                    
                    <!-- Contact Info -->
                    <div class="bg-white p-8 border border-stone-200 shadow-sm relative group overflow-hidden">
                        <div class="absolute top-0 left-0 w-1 h-full bg-kale"></div>
                        <h3 class="font-serif text-xl text-loam mb-6">Contact Information</h3>
                        
                        <div class="space-y-6">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">First Name</label>
                                    <input type="text" id="prof-first-name" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="e.g. Jane">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Last Name</label>
                                    <input type="text" id="prof-last-name" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="e.g. Doe">
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Email Address</label>
                                    <input type="email" id="prof-email" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" required>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Phone Number</label>
                                    <input type="tel" id="prof-phone" oninput="handlePhoneInput(this)" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-kale focus:ring-0 transition-colors" placeholder="(555) 123-4567">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Shipping Address -->
                    <div class="bg-white p-8 border border-stone-200 shadow-sm relative group overflow-hidden">
                        <div class="absolute top-0 left-0 w-1 h-full bg-root"></div>
                        <h3 class="font-serif text-xl text-loam mb-6">Delivery Address</h3>
                        
                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Street Address</label>
                                <input type="text" id="prof-address" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors">
                            </div>

                            <div class="grid grid-cols-6 gap-4">
                                <div class="col-span-3 space-y-2">
                                    <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">City</label>
                                    <input type="text" id="prof-city" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors">
                                </div>
                                <div class="col-span-1 space-y-2">
                                    <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">State</label>
                                    <input type="text" id="prof-state" maxlength="2" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors text-center uppercase" placeholder="WI">
                                </div>
                                <div class="col-span-2 space-y-2">
                                    <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">Zip Code</label>
                                    <input type="text" id="prof-zip" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-root focus:ring-0 transition-colors">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Security -->
                    <div class="bg-white p-8 border border-stone-200 shadow-sm relative group overflow-hidden">
                         <div class="absolute top-0 left-0 w-1 h-full bg-stone-400"></div>
                        <h3 class="font-serif text-xl text-loam mb-6">Security</h3>
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-stone-500 uppercase tracking-wider">New Password (Optional)</label>
                            <input type="password" id="prof-password" class="w-full bg-paper border border-stone-200 p-3 text-loam focus:border-stone-400 focus:ring-0 transition-colors" placeholder="Leave blank to keep current">
                        </div>
                    </div>

                    <div class="flex justify-end pt-4">
                        <button type="submit" class="bg-kale text-paper px-8 py-3 rounded-full font-serif text-lg hover:bg-loam transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
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

import { store } from '../store/index.js';
import { setView } from '../modules/router.js';

export function renderHeader() {
  const CONFIG = window.CONFIG || { business: {}, navigation: [] };

  // Hide header on Auth pages for distraction-free conversion
  const path = window.location.pathname;
  if (path === '/login' || path === '/signup') return '';

  // Safety check if CONFIG is not loaded yet

  const user = store.getUser();
  const authLink = user
    ? `<div class="flex items-center gap-4">
         ${user.role === 'admin' || user.role === 'super_admin'
      ? `<button onclick="window.location.href='/admin'" class="text-stone-500 font-medium hover:text-kale font-serif text-sm uppercase tracking-wide">Admin</button>`
      : ''}
         <button onclick="setView('dashboard')" class="text-gray-700 font-medium hover:text-green-600 flex items-center gap-1">
           <span>👤</span> Account
         </button>
       </div>`
    : `<button onclick="setView('login')" class="hover:underline text-leaf font-semibold">Login</button>`;

  const cartCount = store.getCart().items.length;

  // Check if cart view is active
  const isCartActive = window.location.pathname === '/cart';

  // Enhanced Cart: Icon + Gold Badge
  const cartLink = `
    <button id="nav-cart-btn" onclick="${isCartActive ? '' : 'setView(\'cart\')'}" class="group relative p-2 ml-2 ${isCartActive ? 'bg-harvest-gold/20 cursor-default' : 'hover:bg-nature-50'} rounded-full transition-colors" title="${isCartActive ? 'Current Page' : 'View Cart'}" ${isCartActive ? 'disabled' : ''}>
        <!-- SVG Shopping Bag -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${isCartActive ? 'text-harvest-gold' : 'text-nature-800 group-hover:text-harvest-gold'} transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        
        <!-- Badge -->
        ${cartCount > 0
      ? `<span class="absolute -top-1 -right-1 bg-harvest-gold text-nature-900 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm ${isCartActive ? '' : 'animate-bounce-short'}">${cartCount}</span>`
      : ''}
    </button>`;

  return `
    <div class="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <!-- Brand -->
        <div class="text-center md:text-left group cursor-pointer" onclick="setView('home')">
          <div class="font-serif text-2xl md:text-3xl font-bold text-nature-900 leading-tight tracking-tight group-hover:text-harvest-gold transition-colors">
            ${CONFIG.business.name || 'Driftless Harvest'}
          </div>
          <div class="text-[10px] font-sans text-nature-500 uppercase tracking-[0.2em] mt-0.5">${CONFIG.business.location || 'VIROQUA, WISCONSIN'}</div>
        </div>

        <!-- Nav -->
        <nav class="flex items-center gap-6 md:gap-10 text-sm font-sans font-medium text-nature-800 tracking-wide">
          <button onclick="setView('home')" class="hover:text-harvest-gold transition-colors relative group">
            Home
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-harvest-gold transition-all group-hover:w-full"></span>
          </button>
          <button onclick="setView('boxes')" class="hover:text-harvest-gold transition-colors relative group">
            Food Boxes
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-harvest-gold transition-all group-hover:w-full"></span>
          </button>
          <button onclick="window.navigateToSection('how-it-works')" class="hover:text-harvest-gold transition-colors hidden md:block relative group">
            How It Works
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-harvest-gold transition-all group-hover:w-full"></span>
          </button>
          <button onclick="window.navigateToSection('our-farms')" class="hover:text-harvest-gold transition-colors hidden md:block relative group">
            Featured Farms
            <span class="absolute -bottom-1 left-0 w-0 h-0.5 bg-harvest-gold transition-all group-hover:w-full"></span>
          </button>
          
          <div class="w-px h-6 bg-nature-200 mx-2 hidden md:block"></div>

          <!-- Actions -->
          <div class="flex items-center gap-5">
             ${cartLink}
             ${authLink}
          </div>
        </nav>
      </div>
    </div>
  `;
}

export function renderHeaderCount() {
  const el = document.getElementById("app-header");
  if (el) el.innerHTML = renderHeader();
}

export function renderFooter() {
  const CONFIG = window.CONFIG || { business: {} };
  return `
    <div class="bg-nature-900 text-nature-100 mt-0 border-t border-nature-800">
      
      <!-- Secondary CTA Section -->
      <div class="border-b border-nature-800 bg-nature-950/50">
        <div class="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
            <h2 class="font-serif text-3xl md:text-5xl text-nature-50 mb-6 italic">
              ${CONFIG.marketing?.secondaryCTA?.headline || 'Join the Harvest.'}
            </h2>
            <p class="text-nature-400 font-sans text-lg max-w-xl mx-auto mb-10 font-light">
              ${CONFIG.marketing?.secondaryCTA?.subhead || 'Get weekly farm updates, recipes, and first access to seasonal boxes.'}
            </p>
            
            <div class="max-w-md mx-auto flex gap-2">
               <input type="email" placeholder="Your email address" class="flex-1 bg-nature-800 border-none rounded-full px-6 py-4 text-white placeholder-nature-500 focus:ring-2 focus:ring-harvest-gold transition-all outline-none">
               <button class="bg-harvest-gold text-nature-900 px-8 py-4 rounded-full font-serif font-bold shadow-lg hover:bg-white hover:scale-105 transition-all">
                 Join
               </button>
            </div>
        </div>
      </div>

      <!-- Main Footer Content -->
      <div class="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        <!-- Brand Column -->
        <div class="md:col-span-1">
          <div class="font-serif text-2xl font-bold mb-4 text-white">${CONFIG.business.name || 'Driftless Harvest'}</div>
          <div class="text-sm text-nature-400 font-sans tracking-wide leading-relaxed mb-6">
            Firmly rooted in the hills of Viroqua, Wisconsin. Connecting conscious eaters with ethical farmers since 2010.
          </div>
          <div class="flex gap-4">
             <!-- Social Placeholders -->
             <a href="#" class="w-8 h-8 rounded-full bg-nature-800 flex items-center justify-center text-nature-400 hover:bg-harvest-gold hover:text-nature-900 transition-colors">📷</a>
             <a href="#" class="w-8 h-8 rounded-full bg-nature-800 flex items-center justify-center text-nature-400 hover:bg-harvest-gold hover:text-nature-900 transition-colors">📘</a>
          </div>
        </div>
        
        <!-- Links -->
        <div>
           <h4 class="font-bold text-white mb-6 uppercase tracking-widest text-xs">Shop</h4>
           <ul class="space-y-3 text-sm text-nature-400">
             <li><a href="#" onclick="setView('boxes')" class="hover:text-harvest-gold transition-colors">Seasonal Boxes</a></li>
             <li><a href="#" onclick="setView('boxes')" class="hover:text-harvest-gold transition-colors">A la Carte</a></li>
             <li><a href="#" onclick="setView('boxes')" class="hover:text-harvest-gold transition-colors">Gift Cards</a></li>
           </ul>
        </div>

        <div>
           <h4 class="font-bold text-white mb-6 uppercase tracking-widest text-xs">Farm</h4>
           <ul class="space-y-3 text-sm text-nature-400">
             <li><a href="#" onclick="window.navigateToSection('our-farms')" class="hover:text-harvest-gold transition-colors">Our Growers</a></li>
             <li><a href="#" onclick="window.navigateToSection('how-it-works')" class="hover:text-harvest-gold transition-colors">How it Works</a></li>
             <li><a href="#" class="hover:text-harvest-gold transition-colors">Sustainability</a></li>
           </ul>
        </div>
        
         <div>
           <h4 class="font-bold text-white mb-6 uppercase tracking-widest text-xs">Support</h4>
           <ul class="space-y-3 text-sm text-nature-400">
             <li><a href="#" class="hover:text-harvest-gold transition-colors">Help Center</a></li>
             <li><a href="#" class="hover:text-harvest-gold transition-colors">Contact Us</a></li>
             <li><a href="#" class="hover:text-harvest-gold transition-colors">Privacy Policy</a></li>
           </ul>
        </div>

      </div>

      <!-- Copyright -->
      <div class="max-w-7xl mx-auto px-6 py-8 border-t border-nature-800 flex flex-col md:flex-row justify-between items-center text-[10px] text-nature-500 font-mono uppercase tracking-widest">
         <div>© ${new Date().getFullYear()} Driftless Harvest. All rights reserved.</div>
         <div class="mt-2 md:mt-0">Designed for the future of food.</div>
      </div>
    </div>
  `;
}

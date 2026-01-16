
import { setView } from '../modules/router.js';


export function renderLogin() {
  const CONFIG = window.CONFIG || {};
  const { headline, subhead, image, logo } = CONFIG.auth?.login || {
    headline: "Fresh from the farm to your table.",
    subhead: "Join thousands of happy customers eating cleaner, greener, and better.",
    image: "assets/hero_harvest.png",
    logo: "assets/logo.png",
  };

  return `
    <div class="min-h-screen relative">
      <!-- MOBILE LAYOUT (Card Based) -->
      <div class="lg:hidden min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
          
          <!-- Hero Section: Compact (Mobile) -->
          <div class="text-center mb-6">
            <img src="${logo || 'assets/logo.png'}" class="h-10 mx-auto mb-4 object-contain" alt="Driftless Harvest">
            <h1 class="text-2xl font-sans font-bold text-nature-900 mb-1 leading-tight tracking-tight">Welcome Back</h1>
            <p class="text-sm text-gray-500">Start your local food journey today</p>
          </div>

          <!-- Form Card (Mobile) -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" id="login-email-mobile" class="w-full px-4 py-3 bg-white border border-gray-300 focus:border-nature-900 focus:ring-2 focus:ring-nature-900/10 transition-all font-sans text-base text-gray-900 placeholder:text-gray-400 rounded-lg outline-none" placeholder="farmer@example.com" />
              </div>
              
              <div>
                <div class="flex justify-between items-baseline mb-2">
                  <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <button class="text-xs text-gray-500 hover:text-nature-900 transition-colors font-medium">Forgot?</button>
                </div>
                <div class="relative">
                  <input type="password" id="login-password-mobile" class="w-full px-4 py-3 pr-11 bg-white border border-gray-300 focus:border-nature-900 focus:ring-2 focus:ring-nature-900/10 transition-all font-sans text-base text-gray-900 placeholder:text-gray-400 rounded-lg outline-none" placeholder="••••••••" />
                  <button type="button" onclick="togglePasswordVisibility('login-password-mobile', 'login-eye-mobile')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                    <svg id="login-eye-mobile" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <button onclick="login(
                  document.getElementById('login-email-mobile').value,
                  document.getElementById('login-password-mobile').value
                )" class="w-full bg-nature-900 text-white py-3.5 text-center text-base font-medium tracking-wide hover:bg-nature-800 transition-all shadow-sm hover:shadow-md rounded-lg active:scale-[0.99] mt-2 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                <span>Sign In to Harvest</span>
              </button>
              <div class="mt-3 text-center">
                   <div class="inline-flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      <span class="text-xs text-gray-500 font-medium">Trusted by 2,000+ farmers</span>
                   </div>
              </div>
            </div>
          </div>

          <!-- Footer Link -->
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-2">New to our community?</p>
            <button onclick="setView('signup')" class="text-nature-900 hover:text-nature-700 font-medium text-sm underline decoration-1 underline-offset-4 transition-colors">
              Create an Account →
            </button>
          </div>
        </div>
      </div>

      <!-- DESKTOP LAYOUT (Split Screen with Hero Image) -->
      <div class="hidden lg:flex min-h-[calc(100vh-80px)] bg-nature-50 relative">
        <!--Image Side-->
        <div class="w-1/2 relative overflow-hidden group">
          <!-- Hero Background with Slow Zoom Effect -->
          <div class="absolute inset-0 bg-nature-900/10 bg-cover bg-center transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
            style="background-image: url('${image || 'assets/hero_harvest.png'}');"></div>

          <!-- Dark Overlay -->
          <div class="absolute inset-0 bg-nature-900/40 backdrop-blur-[1px]"></div>

          <!-- Edge Fades -->
          <div class="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
          <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-nature-50 to-transparent pointer-events-none z-10"></div>

          <!-- Content Overlay -->
          <div class="relative h-full w-full flex items-center justify-center p-16 text-white">
            <div class="max-w-xl">
              <h2 class="text-5xl font-serif font-medium mb-6 leading-tight drop-shadow-lg">${headline}</h2>
              <p class="text-xl font-sans font-light opacity-90 leading-relaxed drop-shadow">${subhead}</p>

               <div class="mt-8 flex gap-4 items-center">
                <div class="flex -space-x-3">
                  <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=1" class="w-full h-full object-cover">
                  </div>
                  <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=5" class="w-full h-full object-cover">
                  </div>
                </div>
                 <div class="text-sm font-sans flex flex-col">
                  <div class="flex text-harvest-gold text-xs">★★★★★</div>
                  <span class="opacity-90 font-medium tracking-wide">Trusted by 2,000+ farmers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!--Form Side-->
        <div class="w-1/2 flex items-center justify-center p-16 bg-white">
          <div class="max-w-md w-full animate-slide-up">
            <div class="mb-10 text-left">
               <h2 class="text-4xl font-serif text-nature-900 mb-3">Welcome Back</h2>
               <p class="text-nature-500 text-lg font-sans">The harvest is waiting for you.</p>
            </div>

            <div class="space-y-6">
              <div>
                <label class="block text-xs font-bold text-nature-400 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" id="login-email" class="w-full p-4 bg-nature-50 border border-nature-200 focus:border-harvest-green focus:ring-1 focus:ring-harvest-green transition-all font-sans text-lg text-nature-900 placeholder:text-nature-300 rounded-lg outline-none" placeholder="farmer@example.com" />
              </div>
              <div>
                 <div class="flex justify-between items-baseline mb-2">
                  <label class="block text-xs font-bold text-nature-400 uppercase tracking-wider">Password</label>
                  <button class="text-xs text-nature-400 hover:text-harvest-green transition-colors font-medium">Forgot?</button>
                </div>
                <div class="relative">
                  <input type="password" id="login-password" class="w-full p-4 pr-12 bg-nature-50 border border-nature-200 focus:border-harvest-green focus:ring-1 focus:ring-harvest-green transition-all font-sans text-lg text-nature-900 placeholder:text-nature-300 rounded-lg outline-none" placeholder="••••••••" />
                  <button type="button" onclick="togglePasswordVisibility('login-password', 'login-eye')" class="absolute right-3 top-1/2 -translate-y-1/2 text-nature-400 hover:text-nature-600 transition-colors p-1">
                    <svg id="login-eye" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              <button onclick="login(
                    document.getElementById('login-email').value,
                    document.getElementById('login-password').value
                  )" class="w-full bg-nature-900 text-white py-4 text-center text-lg font-serif hover:bg-harvest-green transition-colors shadow-lg hover:shadow-xl rounded-lg active:scale-[0.99]">
                Sign In to Harvest
              </button>
            </div>

            <div class="mt-12 pt-8 border-t border-nature-100 text-center">
              <p class="text-nature-400 font-sans mb-4">New to our community?</p>
              <button onclick="setView('signup')" class="group inline-flex items-center gap-2 px-6 py-2 rounded-full border border-nature-200 text-nature-600 font-medium hover:bg-nature-50 transition-all">
                Create an Account
                <span class="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderSignup() {
  const CONFIG = window.CONFIG || {};
  const { headline, subhead, image, logo } = CONFIG.auth?.signup || {
    headline: "Real food from the Driftless hills.",
    subhead: "Join our community in Viroqua for weekly organic boxes.",
    image: "assets/auth_farm.png",
    logo: "assets/logo.png",
  };

  return `
    <div class="min-h-screen relative">
      <!-- MOBILE LAYOUT (Card Based) -->
      <div class="lg:hidden min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-start justify-center p-6 pt-10">
        <div class="w-full max-w-md">
          
          <!-- Hero Section: Compact -->
          <div class="text-center mb-6">
            <img src="${logo || 'assets/logo.png'}" class="h-10 mx-auto mb-4 object-contain" alt="Driftless Harvest">
            <h1 class="text-2xl font-sans font-bold text-nature-900 mb-1 leading-tight tracking-tight">Create Account</h1>
            <p class="text-sm text-gray-500">Real food from the Driftless hills</p>
          </div>

          <!-- Form Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
            <div class="space-y-5">
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" id="signup-email-mobile" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-nature-900 focus:ring-2 focus:ring-nature-900/10 transition-all font-sans text-base text-gray-900 placeholder:text-gray-400 rounded-lg outline-none" placeholder="you@example.com" />
              </div>
              
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                <div class="relative">
                  <input type="password" id="signup-password-mobile" class="w-full px-4 py-3 pr-11 bg-gray-50 border border-gray-200 focus:border-nature-900 focus:ring-2 focus:ring-nature-900/10 transition-all font-sans text-base text-gray-900 placeholder:text-gray-400 rounded-lg outline-none" placeholder="••••••••" />
                  <button type="button" onclick="togglePasswordVisibility('signup-password-mobile', 'signup-eye-mobile')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                    <svg id="signup-eye-mobile" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <button onclick="signup(
                  document.getElementById('signup-email-mobile').value,
                  document.getElementById('signup-password-mobile').value
                )" class="w-full bg-harvest-green text-white py-3.5 text-center text-base font-medium tracking-wide hover:bg-nature-900 transition-all shadow-sm hover:shadow-md rounded-lg active:scale-[0.99] mt-6 flex items-center justify-center gap-2">
                <span>Join the Harvest</span>
              </button>
              
              <!-- Reassurance / Social Proof -->
              <div class="mt-4 text-center flex flex-col items-center animate-fade-in">
                 <div class="flex items-center gap-1.5 mb-1">
                    <span class="text-harvest-gold text-xs">★★★★★</span>
                    <span class="text-xs text-gray-600 font-medium">Trusted by 2,000+ local families</span>
                 </div>
                 <div class="flex items-center gap-1 opacity-60">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Secure & Private</span>
                 </div>
              </div>
            </div>
          </div>

          <!-- Footer Link -->
          <div class="text-center">
            <p class="text-sm text-gray-500 mb-2">Already have an account?</p>
            <button onclick="setView('login')" class="text-nature-900 hover:text-nature-700 font-medium text-sm underline decoration-1 underline-offset-4 transition-colors">
              Log In →
            </button>
          </div>
        </div>
      </div>

      <!-- DESKTOP LAYOUT (Original Split Screen) -->
      <div class="hidden lg:flex min-h-[calc(100vh-80px)] bg-nature-50 relative">
        <!--Image Side-->
        <div class="w-1/2 relative overflow-hidden group">
           <!-- Hero Background with Slow Zoom Effect -->
          <div class="absolute inset-0 bg-nature-900/10 bg-cover bg-center transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
               style="background-image: url('${image || 'assets/auth_farm.png'}');"></div>
          
          <!-- Dark Overlay -->
          <div class="absolute inset-0 bg-nature-900/40 backdrop-blur-[1px]"></div>

          <!-- Edge Fades -->
          <div class="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
          <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-nature-50 to-transparent pointer-events-none z-10"></div>
          
          <div class="relative h-full w-full flex items-center justify-center p-16 text-white">
            <div class="max-w-xl">
              <h2 class="text-5xl font-serif font-medium mb-6 leading-tight drop-shadow-lg">${headline}</h2>
              <p class="text-xl font-sans font-light opacity-90 leading-relaxed drop-shadow">${subhead}</p>
              
              <div class="mt-8 flex gap-4 items-center">
                  <div class="flex -space-x-3">
                       <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                          <img src="https://i.pravatar.cc/100?img=12" class="w-full h-full object-cover">
                      </div>
                      <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                          <img src="https://i.pravatar.cc/100?img=15" class="w-full h-full object-cover">
                      </div>
                       <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                          <img src="https://i.pravatar.cc/100?img=20" class="w-full h-full object-cover">
                      </div>
                  </div>
                  <div class="text-sm font-sans flex flex-col">
                      <div class="flex text-harvest-gold text-xs">★★★★★</div>
                      <span class="opacity-90 font-medium tracking-wide">Join 2,000+ local families</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
        
        <!--Form Side-->
        <div class="w-1/2 flex items-center justify-center p-16 bg-white">
          <div class="max-w-md w-full animate-slide-up">
            <div class="mb-10 text-left">
                <h2 class="text-4xl font-serif text-nature-900 mb-3">Create Account</h2>
                <p class="text-nature-500 text-lg font-sans">Start your local food journey today.</p>
            </div>

            <div class="space-y-6">
              <div>
                <label class="block text-xs font-bold text-nature-400 uppercase tracking-wider mb-2">Email Address</label>
                <input type="email" id="signup-email" class="w-full p-4 bg-nature-50 border border-nature-200 focus:border-harvest-green focus:ring-1 focus:ring-harvest-green transition-all font-sans text-lg text-nature-900 placeholder:text-nature-300 rounded-lg outline-none" placeholder="you@example.com" />
              </div>
              <div>
                <label class="block text-xs font-bold text-nature-400 uppercase tracking-wider mb-2">Password</label>
                <div class="relative">
                  <input type="password" id="signup-password" class="w-full p-4 pr-12 bg-nature-50 border border-nature-200 focus:border-harvest-green focus:ring-1 focus:ring-harvest-green transition-all font-sans text-lg text-nature-900 placeholder:text-nature-300 rounded-lg outline-none" placeholder="••••••••" />
                  <button type="button" onclick="togglePasswordVisibility('signup-password', 'signup-eye')" class="absolute right-3 top-1/2 -translate-y-1/2 text-nature-400 hover:text-nature-600 transition-colors p-1">
                    <svg id="signup-eye" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <button onclick="signup(
                  document.getElementById('signup-email').value,
                  document.getElementById('signup-password').value
                )" class="w-full bg-harvest-green text-white py-4 text-center text-lg font-serif hover:bg-nature-900 transition-colors shadow-lg hover:shadow-xl rounded-lg active:scale-[0.99]">
                Join Our Harvest
              </button>
            </div>

            <div class="mt-12 pt-8 border-t border-nature-100 text-center">
              <p class="text-nature-400 font-sans mb-4">Already have an account?</p>
              <button onclick="setView('login')" class="group inline-flex items-center gap-2 px-6 py-2 rounded-full border border-nature-200 text-nature-600 font-medium hover:bg-nature-50 transition-all">
                  Log In
                  <span class="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


import { setView } from '../modules/router.js';


export function renderLogin() {
  const CONFIG = window.CONFIG || {};
  const { headline, subhead } = CONFIG.auth?.login || {
    headline: "Fresh from the farm to your table.",
    subhead: "Join thousands of happy customers eating cleaner, greener, and better.",
  };

  return `
    <div class="flex min-h-[calc(100vh-80px)] bg-nature-50 relative">
      <!--Image Side-->
      <div class="hidden lg:block w-1/2 relative overflow-hidden group">
        <!-- Hero Background with Slow Zoom Effect -->
        <div class="absolute inset-0 bg-auth-farm bg-cover bg-center transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
             style="background-image: url('assets/hero_harvest.png');"></div>
        
        <!-- Dark Overlay -->
        <div class="absolute inset-0 bg-nature-900/40 backdrop-blur-[1px]"></div>
        
        <!-- Content Overlay -->
        <div class="relative h-full w-full flex items-center justify-center p-16 text-white">
          <div class="max-w-xl">
            <h2 class="text-5xl font-serif font-medium mb-6 leading-tight drop-shadow-lg">${headline}</h2>
            <p class="text-xl font-sans font-light opacity-90 leading-relaxed drop-shadow">${subhead}</p>
            
            <!-- Social Proof Stack -->
            <div class="mt-8 flex gap-4 items-center">
                <div class="flex -space-x-3">
                    <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                        <img src="https://i.pravatar.cc/100?img=1" class="w-full h-full object-cover">
                    </div>
                    <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                        <img src="https://i.pravatar.cc/100?img=5" class="w-full h-full object-cover">
                    </div>
                     <div class="w-10 h-10 rounded-full border-2 border-nature-800 bg-stone-300 flex items-center justify-center text-xs font-bold text-nature-800 overflow-hidden">
                        <img src="https://i.pravatar.cc/100?img=8" class="w-full h-full object-cover">
                    </div>
                </div>
                <div class="text-sm font-sans flex flex-col">
                    <div class="flex text-harvest-gold text-xs">★★★★★</div>
                    <span class="opacity-90 font-medium tracking-wide">Trusted by 2,000+ locals</span>
                </div>
            </div>
          </div>
        </div>
      </div>
      
      <!--Form Side-->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div class="max-w-md w-full animate-slide-up">
          <div class="mb-10 text-center lg:text-left">
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
              <input type="password" id="login-password" class="w-full p-4 bg-nature-50 border border-nature-200 focus:border-harvest-green focus:ring-1 focus:ring-harvest-green transition-all font-sans text-lg text-nature-900 placeholder:text-nature-300 rounded-lg outline-none" placeholder="••••••••" />
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
  `;
}

export function renderSignup() {
  const CONFIG = window.CONFIG || {};
  const { headline, subhead } = CONFIG.auth?.signup || {
    headline: "Real food from the Driftless hills.",
    subhead: "Join our community in Viroqua for weekly organic boxes.",
  };

  return `
    <div class="flex min-h-[calc(100vh-80px)] bg-nature-50 relative">
      <!--Image Side-->
      <div class="hidden lg:block w-1/2 relative overflow-hidden group">
         <!-- Hero Background with Slow Zoom Effect -->
        <div class="absolute inset-0 bg-auth-farm bg-cover bg-center transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110"
             style="background-image: url('assets/hero_rustic.png');"></div>
        
        <!-- Dark Overlay -->
        <div class="absolute inset-0 bg-nature-900/40 backdrop-blur-[1px]"></div>
        
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
      <div class="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div class="max-w-md w-full animate-slide-up">
          <div class="mb-10 text-center lg:text-left">
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
              <input type="password" id="signup-password" class="w-full p-4 bg-nature-50 border border-nature-200 focus:border-harvest-green focus:ring-1 focus:ring-harvest-green transition-all font-sans text-lg text-nature-900 placeholder:text-nature-300 rounded-lg outline-none" placeholder="••••••••" />
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
  `;
}



import { setView } from '../../modules/router.js';

/**
 * Hero Component
 * Renders the main hero section with parallax background.
 * 
 * @param {Object} CONFIG - App configuration object
 * @returns {string} HTML string
 */
export function Hero(CONFIG) {
    // Use config image or fallback to active theme default
    const heroImage = CONFIG.pages?.home?.hero?.image || "url('./assets/images/hero_rustic.png')";
    const bgStyle = heroImage.startsWith('url') ? heroImage : `url('${heroImage}')`;

    return `
    <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-nature-900 text-white">
      
      <!-- Parallax Background (Image) -->
      <div class="absolute inset-0 bg-cover bg-center bg-fixed opacity-90 scale-105 animate-fade-in"
           style="background-image: ${bgStyle};"></div>
      
      <!-- Gradient Overlay for Text Readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-nature-950/80 via-nature-900/20 to-transparent"></div>

      <!-- Content -->
      <div class="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8 animate-slide-up">
        
        <!-- Glass Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium tracking-widest uppercase text-nature-100 shadow-xl">
          <span class="w-2 h-2 rounded-full bg-harvest-gold animate-pulse"></span> 
          Now Harvesting: High Winter
        </div>

        <h1 class="text-6xl md:text-8xl font-serif text-nature-50 leading-tight drop-shadow-2xl [text-shadow:1px_1px_3px_black]">
          Taste the <br/> <span class="italic text-harvest-gold [text-shadow:1px_1px_3px_black]">Season</span>.
        </h1>

        <p class="text-xl md:text-2xl text-nature-200 font-sans max-w-2xl mx-auto leading-relaxed font-light tracking-wide shadow-black drop-shadow-md [text-shadow:1px_1px_3px_black]">
          Curated harvest boxes from family farms in the Driftless hills. <br class="hidden md:block"/>Honest, sustainable, and delivered to your door.
        </p>

        <div class="pt-8 flex flex-col md:flex-row gap-4 justify-center">
          <button onclick="setView('boxes')"
            class="bg-harvest-gold text-nature-950 px-10 py-5 rounded-full font-serif text-xl tracking-wide hover:bg-white hover:scale-105 transition-all shadow-xl hover:shadow-2xl duration-300">
            Explore the Harvest
          </button>
          <button onclick="document.getElementById('how-it-works').scrollIntoView({behavior: 'smooth'})"
            class="px-10 py-5 rounded-full font-sans text-sm font-bold tracking-widest uppercase text-white border border-white/30 hover:bg-white/10 transition-all">
            How it Works
          </button>
        </div>
      </div>
    </section>`;
}

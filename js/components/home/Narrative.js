
/**
 * Narrative Component
 * Renders the parallax quote section.
 * 
 * @param {Object} CONFIG - App configuration object
 * @returns {string} HTML string
 */
export function Narrative(CONFIG) {
  return `
    <section class="relative py-40 bg-nature-900 border-y border-nature-800 overflow-hidden flex items-center justify-center">
      <!-- Fixed Background (Parallax) -->
      <div class="absolute inset-0 bg-auth-farm bg-cover bg-center bg-fixed opacity-60 mix-blend-overlay"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-nature-950/80 via-transparent to-nature-950/80"></div>

      <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <span class="block text-harvest-gold text-5xl mb-6 opacity-80">“</span>
        <p class="font-serif text-3xl md:text-5xl text-nature-100 leading-tight drop-shadow-lg">
          We farm the hills and valleys around Viroqua. What we grow changes with the season, the soil, and the weather.
        </p>
        <div class="mt-12 inline-block border-t border-harvest-gold/50 pt-6">
          <span class="font-sans font-bold text-harvest-gold tracking-[0.2em] text-sm uppercase">
            The Driftless Harvest Promise
          </span>
        </div>
      </div>
    </section>`;
}

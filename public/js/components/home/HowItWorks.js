
/**
 * HowItWorks Component
 * Renders the 3-step process section.
 * 
 * @param {Object} CONFIG - App configuration object
 * @returns {string} HTML string
 */
export function HowItWorks(CONFIG) {
    const steps = [
        { title: "You Choose", desc: "Select a curated box or build your own from what's fresh this week.", icon: "1" },
        { title: "We Harvest", desc: "Our farmers pick your order on Monday morning, straight from the soil.", icon: "2" },
        { title: "You Receive", desc: "We deliver to your door or a neighborhood pickup spot on Wednesday.", icon: "3" }
    ];

    return `
    <section class="bg-white py-24 border-t border-nature-200" id="how-it-works">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid md:grid-cols-3 gap-16 text-center">
          ${steps.map(s => `
            <div class="space-y-6 group cursor-default">
              <div class="w-16 h-16 mx-auto bg-nature-100 rounded-full flex items-center justify-center font-serif text-2xl text-nature-900 font-bold group-hover:bg-harvest-gold group-hover:text-white transition-colors duration-300">
                ${s.icon}
              </div>
              <h3 class="font-serif text-3xl text-nature-900">${s.title}</h3>
              <p class="text-nature-500 font-sans leading-relaxed max-w-xs mx-auto text-lg font-light">${s.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>`;
}

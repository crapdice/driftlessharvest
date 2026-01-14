
import { setView } from '../modules/router.js';

export function renderHow() {
    const CONFIG = window.CONFIG;
    const { title, paragraphs } = CONFIG.pages.howItWorks;

    return `
      <section class="max-w-4xl mx-auto px-6 py-20">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-serif text-loam mb-6">${title}</h2>
        <div class="w-16 h-1 bg-kale/30 mx-auto rounded-full"></div>
      </div>
      
      <div class="space-y-8">
        ${paragraphs.map((p, idx) => `
          <div class="flex gap-6 items-start group">
            <div class="flex-shrink-0 w-12 h-12 rounded-full border border-clay bg-paper flex items-center justify-center font-serif text-xl text-kale font-bold group-hover:border-kale transition-colors">
              ${idx + 1}
            </div>
            <p class="text-lg md:text-xl text-charcoal/80 leading-relaxed font-sans pt-2">${p}</p>
          </div>
        `).join("")}
      </div>
      
      <div class="mt-16 text-center">
        <button onclick="setView('boxes')" class="bg-root text-paper px-8 py-3 rounded-full font-serif text-lg hover:bg-loam transition-colors shadow-sm">
          Start Your Box
        </button>
      </div>
    </section>
      `;
}

export function renderFarms() {
    const CONFIG = window.CONFIG;
    const { title, paragraphs, farmBoxes } = CONFIG.pages.farms;

    return `
      <section class="bg-stone/30 py-20 border-t border-clay/30">
        <div class="max-w-7xl mx-auto px-6">
          <div class="max-w-3xl mx-auto text-center mb-16 space-y-6">
            <h2 class="text-4xl md:text-5xl font-serif text-loam">${title}</h2>
            ${paragraphs.map(p => `<p class="text-lg text-charcoal/70 leading-relaxed">${p}</p>`).join("")}
          </div>

          ${Array.isArray(farmBoxes) && farmBoxes.length ? `
          <div class="grid md:grid-cols-2 gap-8">
            ${farmBoxes.map(farm => `
              <div class="bg-white p-8 rounded-xl border border-clay hover:border-root/40 transition-all shadow-sm hover:shadow-md group">
                <div class="flex justify-between items-start mb-4">
                  <h3 class="font-serif text-2xl text-loam font-medium group-hover:text-root transition-colors">${farm.name}</h3>
                  <span class="text-xs font-bold tracking-widest uppercase text-kale bg-kale/10 px-2 py-1 rounded-sm">Partner</span>
                </div>
                
                <div class="flex items-center gap-2 mb-4 text-stone-500 font-medium text-sm">
                  <span class="text-lg">📍</span> ${farm.location}
                </div>
                
                <p class="text-charcoal/80 leading-relaxed border-t border-stone-100 pt-4">
                  ${farm.notes}
                </p>
              </div>
            `).join("")}
          </div>
        ` : ""}
        </div>
    </section>
      `;
}


/**
 * FeaturedFarms Component
 * Renders the list of partner farms.
 * 
 * @param {Object} CONFIG - App configuration object
 * @returns {string} HTML string
 */
export function FeaturedFarms(CONFIG) {
    const farms = [
        { name: "Ridge & Valley", location: "Viroqua, WI", type: "Vegetables & Herbs", img: "/images/ridge_valley_farm.png" },
        { name: "Deep Root Organics", location: "Westby, WI", type: "Heirloom Tomatoes", img: "/images/deep_root_tomatoes.png" },
        { name: "Coulee Creek", location: "Coon Valley, WI", type: "Pastured Meats", img: "/images/coulee_creek_pasture.png" }
    ];

    return `
    <section class="bg-nature-50 py-32" id="our-farms">
      <div class="max-w-6xl mx-auto px-6 text-center mb-16">
        <h2 class="font-serif text-4xl md:text-5xl text-nature-900 mb-4">Featured Farms</h2>
        <p class="text-nature-500 uppercase tracking-[0.2em] text-sm font-medium">Grown within 40 miles of Viroqua</p>
      </div>

      <div class="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        ${farms.map(f => `
          <div class="bg-white p-8 rounded-xl border border-nature-200 text-center hover:border-harvest-green/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg">
            <div class="h-24 w-24 bg-nature-100 rounded-full mx-auto mb-6 bg-cover bg-center shadow-inner group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0" style="background-image: url('${f.img}')"></div>
            <h3 class="font-serif text-xl text-nature-900 mb-1">${f.name}</h3>
            <div class="text-xs font-bold text-harvest-green uppercase tracking-wider mb-2">${f.location}</div>
            <p class="text-nature-400 text-sm font-light">${f.type}</p>
          </div>
        `).join('')}
      </div>
    </section>`;
}

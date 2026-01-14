
import { AB } from '../modules/ab_test.js';
import { Hero } from '../components/home/Hero.js';
import { HowItWorks } from '../components/home/HowItWorks.js';
import { FeaturedFarms } from '../components/home/FeaturedFarms.js';
import { Narrative } from '../components/home/Narrative.js';

// 2. FEATURED PRODUCTS CONTAINER (Content loaded by actions.js)
// Keeping this inline as it's just a container, but could be separate.
function renderFeaturedProducts(CONFIG, style = {}) {
  // We keep the ID because 'actions.js' targets it.
  return `
    <section id="featured-products-container" class="max-w-7xl mx-auto px-6 py-20 bg-nature-50"></section>
  `;
}

// --- REGISTRY ---
const COMPONENT_REGISTRY = {
  'hero': Hero,
  'featured_products': renderFeaturedProducts,
  'how_it_works': HowItWorks,
  'our_farms': FeaturedFarms,
  'narrative': Narrative
};

// --- MAIN RENDERER ---
export function renderHome() {
  const CONFIG = window.CONFIG || { business: { name: "Harvest App" }, meta: {} };

  // New Driftless Layout
  const DEFAULT_LAYOUT = [
    { id: "hero", enabled: true },
    { id: "featured_products", enabled: true }, // Populates via actions.js
    { id: "how_it_works", enabled: true },
    { id: "our_farms", enabled: true },
    { id: "narrative", enabled: true }
  ];

  return DEFAULT_LAYOUT.map(component => {
    if (!component.enabled) return '';
    const renderer = COMPONENT_REGISTRY[component.id];
    return renderer ? renderer(CONFIG) : '';
  }).join('');
}

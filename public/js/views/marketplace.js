import { store } from '../store/index.js';
import { ProductCard } from '../components/product/ProductCard.js';
import { BoxDetailsModal } from '../components/marketplace/BoxDetailsModal.js';

// We need these to be global or exported from a store eventually.
// For now, we assume they are available or we fetch them. 
// Refactoring note: loadMarketplace should populates these
let availableProducts = [];
let availableTemplates = [];

export function setMarketplaceData(products, templates) {
  availableProducts = products;
  availableTemplates = templates;
}

export function getMarketplaceData() {
  return { availableProducts, availableTemplates };
}

const isEditorialLayout = () => window.CONFIG?.theme?.layout === 'editorial';

export function renderBoxes() {
  // Initial Load
  if (availableProducts.length === 0 && typeof window.loadMarketplace === 'function') {
    window.loadMarketplace();
    return `
      <div class="min-h-screen bg-nature-50 flex flex-col items-center justify-center">
             <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-nature-900 mb-4"></div>
             <p class="text-nature-900/60 font-medium font-sans animate-pulse">Opening the journal...</p>
          </div>
      `;
  }

  const cart = store.getCart().items;
  const cartTotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const isEditorial = isEditorialLayout(); // Local var for readability, but safe now

  // --- TEMPLATES RENDER ---
  let templatesHtml = '';
  if (availableTemplates.length > 0) {
    if (isEditorial) {
      // EDITORIAL LAYOUT (List)
      templatesHtml = `
            <div class="mb-32">
                <div class="text-center mb-24 relative">
                    <span class="block w-px h-16 bg-nature-300 mx-auto mb-6"></span>
                    <h3 class="text-4xl font-serif text-nature-900 italic mb-2">Seasonal Collections</h3>
                    <p class="text-nature-600 font-serif text-sm italic">Curated by our growers for the week of ${new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                </div>

                <div class="space-y-32 max-w-4xl mx-auto">
                    ${availableTemplates.map((t, idx) => `
                        <div class="flex flex-col ${idx % 2 === 0 ? '' : ''} gap-8 group">
                             <!-- Image as full width editorial shot -->
                             <div class="w-full aspect-[16/9] overflow-hidden bg-nature-200 relative cursor-pointer" onclick="showBoxModal('${t.id}')">
                                <img src="${t.image_url || ''}" class="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105 ${t.out_of_stock ? 'grayscale opacity-80' : ''}">
                                ${t.out_of_stock ? `<div class="absolute inset-0 flex items-center justify-center bg-white/40"><span class="bg-nature-900 text-white px-4 py-2 font-serif italic text-xl">Sold Out</span></div>` : ''}
                             </div>
                             
                             <!-- Text Content -->
                             <div class="text-center px-8">
                                <h4 class="font-serif text-3xl text-nature-900 mb-4">${t.name}</h4>
                                <p class="font-serif text-lg leading-relaxed text-nature-600 mb-6 max-w-xl mx-auto">${t.description}</p>
                                
                                <div class="flex items-center justify-center gap-6">
                                    <span class="font-sans text-xs font-bold uppercase tracking-widest text-nature-400">Vol. ${idx + 1}</span>
                                    <span class="w-1 h-1 bg-nature-300 rounded-full"></span>
                                    <span class="font-serif text-xl text-nature-900 italic">$${t.base_price.toFixed(2)}</span>
                                </div>

                                ${!t.out_of_stock ? `
                                    <button onclick="addTemplateToCart('${t.id}')" 
                                        class="mt-8 text-nature-900 border-b border-nature-900 pb-1 hover:text-harvest-gold hover:border-harvest-gold transition-colors font-serif italic text-lg">
                                        Add to Journal
                                    </button>
                                ` : ''}
                             </div>
                        </div>
                    `).join('<div class="w-full h-px bg-nature-200 my-20"></div>')}
                </div>
            </div>
          `;
    } else {
      // STANDARD GRID LAYOUT
      templatesHtml = `
            <div class="mb-24">
                <div class="text-center mb-16">
                    <h3 class="text-4xl md:text-5xl font-serif text-nature-900 mb-4" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Curated Harvests</h3>
                    <p class="text-nature-500 text-sm uppercase tracking-[0.2em] font-sans">Seasonal Box Selections</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-12 px-6 md:px-0 max-w-7xl mx-auto">
                    ${availableTemplates.map(t => {
        const isOutOfStock = t.out_of_stock;
        return `
                        <div class="group cursor-pointer flex flex-col items-center relative" onclick="showBoxModal('${t.id}')">
                            <div class="relative w-full aspect-[4/5] overflow-hidden bg-nature-100 mb-6 rounded-sm">
                                <div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}" 
                                     style="background-image: url('${t.image_url || ''}');"></div>
                                ${isOutOfStock ? `<div class="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]"><span class="bg-nature-900 text-white px-4 py-2 text-sm font-bold uppercase tracking-widest">Sold Out</span></div>` : ''}
                                ${!isOutOfStock ? `<button onclick="addTemplateToCart('${t.id}'); event.stopPropagation();" class="absolute bottom-6 right-6 bg-white text-nature-900 px-6 py-3 rounded-full shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 font-serif italic text-lg hover:bg-harvest-gold hover:text-white flex items-center gap-2 z-20"><span>Add Box</span><span class="not-italic font-sans text-sm font-bold opacity-100 ml-1">$${t.base_price.toFixed(2)}</span></button>` : ''}
                            </div>
                            <h4 class="font-serif text-2xl text-nature-900 mb-2 group-hover:text-harvest-gold transition-colors">${t.name}</h4>
                            <p class="text-nature-500 font-sans font-light text-sm line-clamp-2 max-w-xs text-center">${t.description}</p>
                            <button onclick="showBoxModal('${t.id}'); event.stopPropagation();" class="mt-4 text-xs font-bold uppercase tracking-widest text-nature-400 group-hover:text-harvest-gold group-hover:underline decoration-harvest-gold/50 underline-offset-4 group-hover:animate-shake transition-all duration-300">View Contents</button>
                        </div>`;
      }).join('')}
                </div>
            </div>`;
    }
  }

  // --- PRODUCTS RENDER ---
  let productsHtml = '';
  if (isEditorial) {
    // EDITORIAL LIST
    productsHtml = `
        <div class="mb-12 max-w-4xl mx-auto">
            <div class="text-center mb-24 relative">
                 <span class="block w-px h-16 bg-nature-300 mx-auto mb-6"></span>
                <h3 class="text-3xl font-serif text-nature-900 italic mb-2">Field Notes &amp; Provisions</h3>
                <p class="text-nature-600 font-serif text-sm italic">Available for immediate harvest</p>
            </div>
            
            <div class="divide-y divide-nature-200">
            ${availableProducts.map(item => ProductCard(item, 'editorial')).join('')}
            </div>
        </div>
       `;
  } else {
    // GRID LAYOUT
    productsHtml = `
        <div class="mb-12">
            <div class="text-center mb-16">
                <h3 class="text-4xl md:text-5xl font-serif text-nature-900 mb-4" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Individual Produce</h3>
                <p class="text-nature-500 text-sm uppercase tracking-[0.2em] font-sans">A la Carte</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 px-6 md:px-0">
            ${availableProducts.map(item => ProductCard(item, 'grid')).join('')}
            </div>
        </div>
      `;
  }


  return `
      <div class="min-h-screen bg-nature-50 pb-20 transition-colors duration-500">
      <div class="max-w-7xl mx-auto px-6 py-10">
        <!-- Header -->
        <div class="flex justify-between items-end mb-12 border-b border-nature-200 pb-8">
          <div>
            <h2 class="text-4xl md:text-6xl font-serif font-bold text-nature-900 leading-tight">${isEditorial ? 'The Field Journal' : 'Fresh Harvest Market'}</h2>
            <p class="text-nature-500 font-sans mt-2 tracking-wide text-lg">${isEditorial ? 'Notes from the soil, available for your table.' : 'Live inventory, straight from Viroqua soil.'}</p>
          </div>
          <div class="hidden md:block text-right">
             <button onclick="setView('cart')" class="group">
                <span class="text-xs font-sans text-nature-400 uppercase tracking-widest group-hover:text-nature-900 transition-colors">Cart Total</span>
                <div id="marketplace-cart-total" class="text-[2rem] tracking-[0.2rem] font-serif text-nature-900 font-bold group-hover:text-nature-900 transition-colors">$${cartTotal.toFixed(2)}</div>
            </button>
          </div>
        </div>

        ${templatesHtml}
        ${productsHtml}

      </div>
     </div>
  `;
}

export function showBoxModal(id) {
  const { availableTemplates } = getMarketplaceData();
  const box = availableTemplates.find(b => String(b.id) === String(id));
  if (!box) return;

  BoxDetailsModal.open(box);
}

export function closeBoxModal() {
  BoxDetailsModal.close();
}


export const BoxDetailsModal = {
    // Static Template (Pixel-Perfect Copy from index.html)
    // Included Tooltip inside the initialize function if needed, or appended globally.
    // I will append it to body on init.

    init() {
        if (document.getElementById('box-details-modal')) return;

        const modalHtml = `
      <div id="box-details-modal" class="hidden fixed inset-0 z-[100] items-center justify-center p-4 bg-nature-900/80 backdrop-blur-sm transition-all">
        <div class="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none shadow-2xl flex flex-col md:flex-row animate-scale-up">
          
          <!-- Image Side -->
          <div id="modal-box-img" class="w-full md:w-1/2 min-h-[300px] bg-cover bg-center relative group">
            <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
          </div>

          <!-- Content Side -->
          <div id="modal-content-container" class="w-full md:w-1/2 p-10 md:p-12 flex flex-col relative w-full md:w-1/2 flex flex-col relative transition-all duration-300">
            <button id="modal-close-btn" class="absolute top-6 right-6 text-stone-400 hover:text-nature-900 transition-colors p-2 hover:bg-stone-100 rounded-full">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <div class="mb-6">
              <span class="text-xs font-bold text-harvest-gold uppercase tracking-widest mb-2 block">Weekly Selection</span>
              <h3 id="modal-box-name" class="font-serif text-nature-900 mb-2 leading-tight"></h3>
              <p id="modal-box-desc" class="font-serif text-nature-600 italic leading-relaxed"></p>
            </div>

            <div class="flex-1 overflow-y-auto pr-2 mb-8 custom-scrollbar">
              <h4 id="modal-contents-header" class="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-100 pb-2">
                This Week's Harvest</h4>
              <ul id="modal-box-items" class="space-y-0 text-sm font-medium text-nature-800 divide-y divide-stone-100">
                <!-- Items injected here -->
              </ul>
            </div>

            <div class="mt-auto pt-6 border-t border-stone-100 flex items-center justify-between gap-6">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-stone-400 uppercase tracking-widest">Price</span>
                <span id="modal-box-price" class="font-serif text-3xl text-nature-900">$0.00</span>
              </div>
              <button id="modal-add-btn" class="flex-1 bg-nature-900 text-white px-8 py-4 text-lg font-serif italic hover:bg-harvest-gold hover:text-nature-900 transition-all shadow-lg active:scale-95">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Global Tooltip for Boxes -->
      <div id="box-tooltip" class="hidden fixed z-[200] bg-white border border-nature-900 shadow-2xl p-6 rounded-sm max-w-lg pointer-events-none transition-opacity duration-200 opacity-0">
         <h5 class="text-[10px] font-bold text-harvest-gold uppercase tracking-widest mb-4 border-b border-nature-100 pb-2">Full Box Contents</h5>
         <div id="box-tooltip-content"></div>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Bind Close Listener
        document.getElementById('modal-close-btn').onclick = () => this.close();
    },

    open(box) {
        this.init(); // Ensure it exists
        const modal = document.getElementById('box-details-modal');
        if (!modal) return;

        // --- POPULATE DATA ---
        document.getElementById('modal-box-name').innerText = box.name;
        document.getElementById('modal-box-desc').innerText = box.description;

        const imgEl = document.getElementById('modal-box-img');
        imgEl.style.backgroundImage = `url('${box.image_url || ''}')`;

        document.getElementById('modal-box-price').innerText = `$${box.base_price.toFixed(2)}`;

        // --- ITEM LIST RENDERING ---
        const list = document.getElementById('modal-box-items');
        const itemCount = box.items.length;
        let columns = 1;

        if (itemCount > 3) {
            columns = Math.ceil(itemCount / 3);
        }

        let listClasses = 'text-sm font-medium text-nature-800';
        if (columns > 1) {
            listClasses += ` grid gap-x-8 gap-y-2 grid-cols-${columns}`;
        } else {
            listClasses += ' space-y-0 divide-y divide-stone-100';
        }
        list.className = listClasses;

        list.innerHTML = box.items.map(i => `
          <li class="py-2 flex justify-between ${columns > 1 ? 'border-b border-stone-100/50' : ''}">
              <span class="truncate mr-2">${i.name}</span>
              <span class="font-mono text-stone-500 text-xs">x${i.qty}</span>
          </li>
      `).join('');


        // --- ACTION BUTTON ---
        const btn = document.getElementById('modal-add-btn');
        btn.onclick = () => {
            if (window.addTemplateToCart) {
                window.addTemplateToCart(box.id);
                this.close();
            }
        };

        if (box.out_of_stock) {
            btn.disabled = true;
            btn.innerText = 'Out of Stock';
            btn.className = 'flex-1 bg-stone-300 text-white px-8 py-4 text-lg font-serif italic cursor-not-allowed';
        } else {
            btn.disabled = false;
            btn.innerText = 'Add to Cart';
            btn.className = 'flex-1 bg-nature-900 text-white px-8 py-4 text-lg font-serif italic hover:bg-harvest-gold hover:text-nature-900 transition-all shadow-lg active:scale-95';
        }

        // --- DYNAMIC LAYOUT LOGIC ---
        // 1. Text Sizing
        const nameEl = document.getElementById('modal-box-name');
        const descEl = document.getElementById('modal-box-desc');
        const descLength = box.description.length;

        nameEl.className = 'font-serif text-nature-900 mb-4 leading-tight';
        descEl.className = 'font-serif text-nature-600 italic leading-relaxed';

        if (descLength > 300) {
            nameEl.classList.add('text-2xl');
            descEl.classList.add('text-sm');
        } else if (descLength > 150) {
            nameEl.classList.add('text-3xl');
            descEl.classList.add('text-base');
        } else {
            nameEl.classList.add('text-4xl');
            descEl.classList.add('text-lg');
        }

        // 2. Margins & Padding
        const contentsHeader = document.getElementById('modal-contents-header');
        const contentContainer = document.getElementById('modal-content-container');

        if (contentsHeader) {
            contentsHeader.classList.remove('mb-6', 'mb-4', 'mb-2');
            if (box.items.length > 8) {
                contentsHeader.classList.add('mb-2');
            } else if (box.items.length > 5) {
                contentsHeader.classList.add('mb-4');
            } else {
                contentsHeader.classList.add('mb-6');
            }
        }

        if (contentContainer) {
            const baseClasses = 'w-full md:w-1/2 flex flex-col relative transition-all duration-300';
            if (box.items.length > 8) {
                contentContainer.className = `${baseClasses} p-6 md:p-8`;
            } else if (box.items.length > 5) {
                contentContainer.className = `${baseClasses} p-8 md:p-10`;
            } else {
                contentContainer.className = `${baseClasses} p-10 md:p-12`;
            }
        }


        // --- TOOLTIP LOGIC ---
        const tooltip = document.getElementById('box-tooltip');
        const tooltipContent = document.getElementById('box-tooltip-content');
        const listEl = document.getElementById('modal-box-items');

        if (tooltip && listEl) {
            listEl.onmouseenter = null;
            listEl.onmousemove = null;
            listEl.onmouseleave = null;

            if (box.items.length > 6) {
                listEl.onmouseenter = () => {
                    tooltip.classList.remove('hidden');
                    requestAnimationFrame(() => tooltip.classList.remove('opacity-0'));

                    tooltipContent.className = 'grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-nature-800 font-medium';
                    tooltipContent.innerHTML = box.items.map(i => `
              <div class="flex justify-between border-b border-nature-100/50 pb-1">
                  <span class="truncate pr-4">${i.name}</span>
                  <span class="font-mono text-nature-400">x${i.qty}</span>
              </div>
          `).join('');
                };

                listEl.onmousemove = (e) => {
                    const x = e.clientX - 10;
                    const y = e.clientY - 10;
                    tooltip.style.transform = 'translate(-100%, -100%)';
                    tooltip.style.left = `${x}px`;
                    tooltip.style.top = `${y}px`;
                };

                listEl.onmouseleave = () => {
                    tooltip.classList.add('opacity-0');
                    setTimeout(() => tooltip.classList.add('hidden'), 200);
                };
            }
        }


        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    close() {
        const modal = document.getElementById('box-details-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }
};

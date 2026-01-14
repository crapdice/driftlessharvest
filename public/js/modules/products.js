import { router as render } from './router.js';
import { getMarketplaceData, setMarketplaceData } from '../views/marketplace.js';
import { FeaturedProducts } from '../components/FeaturedProducts.js';
import { BentoGrid } from '../components/BentoGrid.js';

import { store } from '../store/index.js';
import * as api from './api.js';

export async function loadMarketplace() {
    try {
        const [products, templates] = await Promise.all([
            api.fetchProducts(),
            api.fetchBoxTemplates()
        ]);

        // Update Store
        store.setProducts(products);
        store.setTemplates(templates || []);

        setMarketplaceData(products, templates || []);
        render();
    } catch (e) {
        console.error("Failed to load marketplace data", e);
    }
}

export async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products-container');
    const CONFIG = window.CONFIG;
    if (!container || !CONFIG || !CONFIG.featuredProducts || CONFIG.featuredProducts.length === 0) return;

    try {
        const ids = CONFIG.featuredProducts;
        let items = [];

        // Fetch data via API
        const [products, boxes] = await Promise.all([
            api.fetchProducts(),
            api.fetchBoxTemplates().then(list => list.map(b => ({ ...b, type: 'box' })))
        ]);

        const allItems = [...products, ...boxes];
        items = ids.map(id => allItems.find(i => String(i.id) === String(id))).filter(Boolean);

        if (items.length === 0) return;

        // update store
        store.setFeatured(items);

        const title = CONFIG.meta?.featuredTitle;
        const subtitle = CONFIG.meta?.featuredSubtitle;
        const showTooltips = CONFIG.meta?.showBoxTooltips ?? true;

        if (CONFIG.meta?.useBentoGrid) {
            container.innerHTML = BentoGrid(items, { title, subtitle, showTooltips });
        } else {
            container.innerHTML = FeaturedProducts(items, { title, subtitle });
        }

    } catch (e) { console.error("Featured load failed", e); }
}

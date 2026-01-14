import { router as render } from './router.js';
import { getMarketplaceData, setMarketplaceData } from '../views/marketplace.js';
import { FeaturedProducts } from '../components/FeaturedProducts.js';
import { BentoGrid } from '../components/BentoGrid.js';

export async function loadMarketplace() {
    try {
        const [pRes, tRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/box-templates')
        ]);
        if (!pRes.ok) throw new Error('Failed to load products');
        const products = await pRes.json();
        const templates = tRes.ok ? await tRes.json() : [];

        setMarketplaceData(products, templates);
        render(); // Re-render to show data
    } catch (e) {
        console.error(e);
    }
}

export async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products-container');
    if (!container || !CONFIG.featuredProducts || CONFIG.featuredProducts.length === 0) return;

    try {
        const ids = CONFIG.featuredProducts;
        let items = [];

        const [products, boxes] = await Promise.all([
            fetch('/api/products').then(r => r.json()),
            // Shim boxes to look like products for the card
            fetch('/api/box-templates').then(r => r.json().then(data => data.map(b => ({ ...b, type: 'box' }))))
        ]);

        const allItems = [...products, ...boxes];
        items = ids.map(id => allItems.find(i => i.id === id)).filter(Boolean);

        if (items.length === 0) return;

        // Cache for addToCart logic helper
        window.FEATURED_ITEMS = items;

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

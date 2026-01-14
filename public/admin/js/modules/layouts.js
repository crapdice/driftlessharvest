import { request } from './api.js';
import { showToast } from './utils.js';

let currentLayout = [];
let editingCompIndex = null;
let currentCompId = null;

export async function loadLayouts() {
    try {
        // Fetch fresh config
        const data = await request('GET', '/api/config');

        // Fallback default layout
        const defaultLayout = [
            { id: "hero", enabled: true },
            { id: "featured_products", enabled: true },
            { id: "trust_signals", enabled: true },
            { id: "narrative", enabled: true }
        ];

        currentLayout = data.meta?.layouts?.home || defaultLayout;
        renderLayoutEditor();

    } catch (e) { console.error("Failed to load layout", e); }
}

export function renderLayoutEditor() {
    const list = document.getElementById('layout-list');
    if (!list) return;

    // Component Name Map
    const names = {
        'hero': 'Hero Banner',
        'featured_products': 'Featured Products',
        'trust_signals': 'Trust Signals',
        'narrative': 'Farmer Narrative'
    };

    list.innerHTML = currentLayout.map((item, index) => `
        <li draggable="true" 
            data-index="${index}"
            class="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-4 cursor-move hover:border-blue-400 hover:shadow-sm transition-all select-none"
            ondragstart="handleDragStart(event)"
            ondragover="handleDragOver(event)"
            ondrop="handleDrop(event)"
        >
            <div class="text-gray-400 cursor-move">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
            </div>
            <div class="flex-1 font-medium text-gray-800">
                ${names[item.id] || item.id}
                <div class="text-xs text-gray-400 font-mono">${item.id}</div>
            </div>

            <div class="flex items-center gap-2">
                <!-- Edit Button -->
                <button onclick="openComponentModal(${index})" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Content & Style">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>

                <label class="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded hover:bg-gray-100">
                    <input type="checkbox" 
                        ${item.enabled ? 'checked' : ''} 
                        onchange="toggleLayoutItem(${index})"
                        class="accent-blue-600 w-4 h-4">
                    <span class="text-xs font-medium text-gray-600">Enabled</span>
                </label>
            </div>
        </li>
    `).join('');
}

// ------------------------------------------------------------------
// COMPONENT MODAL LOGIC
// ------------------------------------------------------------------

export async function openComponentModal(index) {
    editingCompIndex = index;
    const item = currentLayout[index];
    currentCompId = item.id;
    const data = await request('GET', '/api/config');

    // 1. Setup Title
    document.getElementById('cm-title').innerText = `Edit ${item.id.replace('_', ' ')}`;

    // 2. Load Styles
    const styles = item.styles || {};
    document.getElementById('cm-style-padding').value = styles.paddingY || 'py-20';
    document.getElementById('cm-style-bg').value = styles.background || 'bg-paper';

    // 3. Render Content Inputs
    renderComponentContentInputs(item.id, data);

    // 4. Setup Featured Tab (if applicable)
    const featTab = document.getElementById('tab-comp-featured');
    if (item.id === 'featured_products') {
        featTab.classList.remove('hidden');
        loadFeaturedPicker(data.featuredProducts || []);
    } else {
        featTab.classList.add('hidden');
    }

    // 5. Show Modal
    setCompTab('content');
    document.getElementById('comp-modal').classList.remove('hidden');
    document.getElementById('comp-modal').classList.add('flex');
}

export function closeComponentModal() {
    document.getElementById('comp-modal').classList.add('hidden');
    document.getElementById('comp-modal').classList.remove('flex');
}

export function setCompTab(tab) {
    ['content', 'style', 'featured'].forEach(t => {
        const btn = document.getElementById(`tab-comp-${t}`);
        const view = document.getElementById(`view-comp-${t}`);
        if (t === tab) {
            btn.classList.add('border-blue-600', 'text-blue-600');
            btn.classList.remove('text-gray-500');
            view.classList.remove('hidden');
        } else {
            btn.classList.remove('border-blue-600', 'text-blue-600');
            btn.classList.add('text-gray-500');
            view.classList.add('hidden');
        }
    });
}

function renderComponentContentInputs(id, fullConfig) {
    const container = document.getElementById('view-comp-content');
    container.innerHTML = '';

    if (id === 'hero') {
        // Fallback to A/B Testing Defaults if not migrated
        const abHero = fullConfig.experiments?.heroMessaging?.variants?.A || {};
        const abCTA = fullConfig.experiments?.primaryCTA?.variants?.A || {};

        const hero = fullConfig.pages?.home?.hero || {
            headline: abHero.headline || "Welcome to Harvest App",
            subhead: abHero.subhead || "Fresh from the farm.",
            cta: abCTA.label || "Get Started"
        };
        const msg = fullConfig.announcement?.text || '';

        container.innerHTML = `
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Headline</label>
                <input type="text" id="inp-hero-head" value="${hero.headline || ''}" class="w-full border p-2 rounded">
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Subhead</label>
                <textarea id="inp-hero-sub" rows="2" class="w-full border p-2 rounded">${hero.subhead || ''}</textarea>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">CTA Label</label>
                <input type="text" id="inp-hero-cta" value="${hero.cta || ''}" class="w-full border p-2 rounded">
            </div>
            <div class="pt-4 border-t">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Announcement Tag</label>
                <input type="text" id="inp-anno-text" value="${msg}" class="w-full border p-2 rounded">
            </div>
        `;
    } else if (id === 'narrative') {
        const voice = fullConfig.business?.farmerVoice || '';
        container.innerHTML = `
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Farmer Voice Quote</label>
                <textarea id="inp-farmer-voice" rows="4" class="w-full border p-2 rounded shadow-sm">${voice}</textarea>
                <p class="text-xs text-gray-400 mt-1">Displayed in large italic serif font.</p>
            </div>
        `;
    } else if (id === 'trust_signals') {
        const signals = fullConfig.business?.trustSignals || [];
        container.innerHTML = `
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Signals (One per line)</label>
                <textarea id="inp-trust-signals" rows="6" class="w-full border p-2 rounded shadow-sm font-mono text-sm">${signals.join('\n')}</textarea>
            </div>
        `;
    } else if (id === 'featured_products') {
        container.innerHTML = `<div class="p-4 bg-blue-50 text-blue-800 rounded text-sm mb-2">Use the "Products" tab to select items.</div>`;
    } else {
        container.innerHTML = `<div class="text-gray-400 italic">No specific content fields for this component.</div>`;
    }
}

async function loadFeaturedPicker(curSelected) {
    // Fetch Products & Boxes
    const [prods, boxes] = await Promise.all([
        request('GET', '/api/products'),
        request('GET', '/api/box-templates')
    ]);

    const options = [
        `<option value="">-- None --</option>`,
        ...prods.map(p => `<option value="${p.id}">Product: ${p.name}</option>`),
        ...boxes.map(b => `<option value="${b.id}">Box: ${b.name}</option>`)
    ].join('');

    [1, 2, 3].forEach((num, i) => {
        const el = document.getElementById(`cm-feat-${num}`);
        if (el) {
            el.innerHTML = options;
            el.value = curSelected[i] || '';
        }
    });
}

export async function saveComponentContent() {
    try {
        // 1. Get current full config
        const fullConfig = await request('GET', '/api/config');

        // 2. Update Content based on ID
        if (!fullConfig.pages) fullConfig.pages = {};
        if (!fullConfig.pages.home) fullConfig.pages.home = {};

        if (currentCompId === 'hero') {
            if (!fullConfig.pages.home.hero) fullConfig.pages.home.hero = {};
            fullConfig.pages.home.hero.headline = document.getElementById('inp-hero-head').value;
            fullConfig.pages.home.hero.subhead = document.getElementById('inp-hero-sub').value;
            fullConfig.pages.home.hero.cta = document.getElementById('inp-hero-cta').value;

            if (!fullConfig.announcement) fullConfig.announcement = {};
            fullConfig.announcement.text = document.getElementById('inp-anno-text').value;
        }
        else if (currentCompId === 'narrative') {
            fullConfig.business.farmerVoice = document.getElementById('inp-farmer-voice').value;
        }
        else if (currentCompId === 'trust_signals') {
            fullConfig.business.trustSignals = document.getElementById('inp-trust-signals').value
                .split('\n').filter(s => s.trim().length > 0);
        }
        else if (currentCompId === 'featured_products') {
            fullConfig.featuredProducts = [
                document.getElementById('cm-feat-1').value,
                document.getElementById('cm-feat-2').value,
                document.getElementById('cm-feat-3').value
            ].filter(Boolean);
        }

        // 3. Update Styles in Layout Array
        const styleObj = {
            paddingY: document.getElementById('cm-style-padding').value,
            background: document.getElementById('cm-style-bg').value
        };

        // We need to update the entry in fullConfig.meta.layouts.home AND our local currentLayout
        // Ensuring consistency
        if (!fullConfig.meta.layouts) fullConfig.meta.layouts = {};
        if (!fullConfig.meta.layouts.home) fullConfig.meta.layouts.home = currentLayout;

        // Find and update in the fresh config layout array
        const layoutItem = fullConfig.meta.layouts.home[editingCompIndex];
        if (layoutItem) {
            layoutItem.styles = styleObj;
        }
        // Also update local state
        currentLayout[editingCompIndex].styles = styleObj;

        // 4. Save to Server
        await request('POST', '/api/config', fullConfig);
        showToast('Component updated!');
        closeComponentModal();

    } catch (e) {
        console.error(e);
        showToast('Error saving component', 'error');
    }
}

// DnD State
let dragSrcIndex = null;

export function handleDragStart(e) {
    dragSrcIndex = Number(e.currentTarget.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
}

export function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

export function handleDrop(e) {
    e.stopPropagation();
    const li = e.currentTarget.closest('li');
    if (dragSrcIndex === null || !li) return;

    const dropIndex = Number(li.dataset.index);

    if (dragSrcIndex !== dropIndex) {
        // Swap
        const item = currentLayout.splice(dragSrcIndex, 1)[0];
        currentLayout.splice(dropIndex, 0, item);
        renderLayoutEditor();
    }

    // Restore opacity
    document.querySelectorAll('#layout-list li').forEach(el => el.classList.remove('opacity-50'));
    return false;
}

export function toggleLayoutItem(index) {
    currentLayout[index].enabled = !currentLayout[index].enabled;
}

export async function saveLayout() {
    try {
        // Get full config first to preserve other settings
        const fullConfig = await request('GET', '/api/config');

        // Patch layouts
        fullConfig.meta = fullConfig.meta || {};
        fullConfig.meta.layouts = fullConfig.meta.layouts || {};
        fullConfig.meta.layouts.home = currentLayout;

        await request('POST', '/api/config', fullConfig);
        showToast("Layout saved! Check the Home page.");

    } catch (e) {
        console.error(e);
        showToast("Error saving layout", "error");
    }
}

import { request } from './api.js';
import { showToast } from './utils.js';

let currentLayout = [];
let editingCompIndex = null;
let currentCompId = null;

// History System for Undo/Redo
let layoutHistory = [];
let historyPosition = -1;

const MODAL_PATH = 'views/layout-modals.html';
const VIEW_PATH = 'views/layouts.html';

export async function initLayouts() {
    const container = document.getElementById('view-layouts');
    if (!container) return;

    // 1. Load Modals if needed
    const modalContainer = document.getElementById('layout-modals-container');
    if (modalContainer && modalContainer.innerHTML.trim() === '') {
        try {
            const res = await fetch(MODAL_PATH);
            modalContainer.innerHTML = await res.text();
        } catch (e) { console.error("Failed to load layout modals", e); }
    }

    // 2. Load View if needed
    if (container.children.length <= 1 || container.querySelector('.animate-spin')) {
        try {
            const response = await fetch(VIEW_PATH);
            if (!response.ok) throw new Error('Failed to load layouts view');
            const html = await response.text();
            container.innerHTML = html;
        } catch (error) {
            console.error('Error initializing layouts:', error);
            showToast('Failed to load Layout Editor', 'error');
        }
    }

    // 3. Load actual layout data
    await loadLayouts();
}

function saveToHistory(action) {
    // Remove any future states if we're not at the end
    layoutHistory = layoutHistory.slice(0, historyPosition + 1);

    // Add new state
    layoutHistory.push({
        action,
        layout: JSON.parse(JSON.stringify(currentLayout)),
        timestamp: Date.now()
    });

    historyPosition = layoutHistory.length - 1;
    updateHistoryUI();
}

function updateHistoryUI() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    const posEl = document.getElementById('history-position');
    const totalEl = document.getElementById('history-total');

    if (undoBtn) undoBtn.disabled = historyPosition <= 0;
    if (redoBtn) redoBtn.disabled = historyPosition >= layoutHistory.length - 1;
    if (posEl) posEl.textContent = historyPosition + 1;
    if (totalEl) totalEl.textContent = layoutHistory.length;
}

export function undoLayout() {
    if (historyPosition > 0) {
        historyPosition--;
        currentLayout = JSON.parse(JSON.stringify(layoutHistory[historyPosition].layout));
        renderLayoutEditor();
        updateHistoryUI();
        showToast('Undid: ' + layoutHistory[historyPosition + 1].action, 'info');
    }
}

export function redoLayout() {
    if (historyPosition < layoutHistory.length - 1) {
        historyPosition++;
        currentLayout = JSON.parse(JSON.stringify(layoutHistory[historyPosition].layout));
        renderLayoutEditor();
        updateHistoryUI();
        showToast('Redid: ' + layoutHistory[historyPosition].action, 'info');
    }
}

// Keyboard shortcuts
if (typeof window !== 'undefined') {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoLayout();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redoLayout();
        }
    });
}

export async function loadLayouts() {
    try {
        // Fetch fresh config - use direct fetch since /api/config is not under /api/admin
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Failed to load config');
        const data = await res.json();

        // Fallback default layout
        const defaultLayout = [
            { id: "hero", enabled: true },
            { id: "featured_products", enabled: true },
            { id: "trust_signals", enabled: true },
            { id: "narrative", enabled: true }
        ];

        currentLayout = data.meta?.layouts?.home || defaultLayout;
        saveToHistory('Loaded layout');
        renderLayoutEditor();

    } catch (e) { console.error("Failed to load layout", e); }
}

export function renderLayoutEditor() {
    const list = document.getElementById('layout-list');
    if (!list) return;

    // Enhanced Component Metadata
    const componentMeta = {
        'hero': { name: 'Hero Banner', icon: '🎨', desc: 'Main welcome section' },
        'featured_products': { name: 'Featured Products', icon: '⭐', desc: 'Highlighted items showcase' },
        'trust_signals': { name: 'Trust Signals', icon: '✓', desc: 'Key selling points' },
        'narrative': { name: 'Farmer Narrative', icon: '💬', desc: 'Personal story quote' },
        'blog_feed': { name: 'Blog Feed', icon: '📰', desc: 'Latest articles' },
        'testimonials': { name: 'Testimonials', icon: '⭐', desc: 'Customer reviews' },
        'newsletter': { name: 'Newsletter Signup', icon: '📧', desc: 'Email capture form' },
        'cta_banner': { name: 'CTA Banner', icon: '🎯', desc: 'Call to action' },
        'image_gallery': { name: 'Image Gallery', icon: '🖼️', desc: 'Photo showcase' },
        'video_embed': { name: 'Video Embed', icon: '🎥', desc: 'YouTube/Vimeo player' }
    };

    list.innerHTML = currentLayout.map((item, index) => {
        const meta = componentMeta[item.id] || { name: item.id, icon: '📦', desc: 'Component' };
        const styles = item.styles || {};

        return `
        <li draggable="true" 
            data-index="${index}"
            class="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all select-none"
            ondragstart="handleDragStart(event)"
            ondragover="handleDragOver(event)"
            ondrop="handleDrop(event)"
        >
            <div class="flex items-start gap-4">
                <!-- Drag Handle -->
                <div class="text-gray-400 cursor-move mt-1">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                    </svg>
                </div>
                
                <!-- Icon Thumbnail -->
                <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex-shrink-0 flex items-center justify-center text-3xl border border-gray-200">
                    ${meta.icon}
                </div>
                
                <!-- Content Preview -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-bold text-gray-900 text-base">${meta.name}</h4>
                        ${item.enabled ?
                '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>' :
                '<span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">Disabled</span>'
            }
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${meta.desc}</p>
                    <div class="flex items-center gap-3 text-xs text-gray-400">
                        ${styles.paddingY ? `
                            <span class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                                ${styles.paddingY}
                            </span>
                        ` : ''}
                        ${styles.background ? `
                            <span class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                                </svg>
                                ${styles.background}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex flex-col gap-2">
                    <button onclick="openComponentModal(${index})" 
                            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                            title="Edit Content & Style">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <label class="flex items-center justify-center">
                        <input type="checkbox" 
                            ${item.enabled ? 'checked' : ''} 
                            onchange="toggleLayoutItem(${index})"
                            class="toggle-switch w-10 h-6 appearance-none bg-gray-300 rounded-full relative cursor-pointer transition-colors checked:bg-blue-600
                                   before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform
                                   checked:before:translate-x-4">
                    </label>
                </div>
            </div>
        </li>
    `;
    }).join('');
}

// ------------------------------------------------------------------
// COMPONENT MODAL LOGIC
// ------------------------------------------------------------------

export async function openComponentModal(index) {
    editingCompIndex = index;
    const item = currentLayout[index];
    currentCompId = item.id;
    const res = await fetch('/api/config');
    const data = await res.json();

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
        request('/products', 'GET'),
        request('/box-templates', 'GET')
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
        const res = await fetch('/api/config');
        const fullConfig = await res.json();

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

        // 4. Save to Server (cookie-based auth)
        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(fullConfig)
        });
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
    saveToHistory('Started dragging component');
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
        saveToHistory(`Moved component to position ${dropIndex + 1}`);
        renderLayoutEditor();
    }

    // Restore opacity
    document.querySelectorAll('#layout-list li').forEach(el => el.classList.remove('opacity-50'));
    return false;
}

export function toggleLayoutItem(index) {
    const wasEnabled = currentLayout[index].enabled;
    currentLayout[index].enabled = !wasEnabled;
    saveToHistory(`${wasEnabled ? 'Disabled' : 'Enabled'} component`);
    renderLayoutEditor();
}

export async function saveLayout() {
    try {
        // Get full config first to preserve other settings
        const res = await fetch('/api/config');
        const fullConfig = await res.json();

        // Patch layouts
        fullConfig.meta = fullConfig.meta || {};
        fullConfig.meta.layouts = fullConfig.meta.layouts || {};
        fullConfig.meta.layouts.home = currentLayout;

        await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(fullConfig)
        });
        showToast("Layout saved! Check the Home page.");

    } catch (e) {
        console.error(e);
        showToast("Error saving layout", "error");
    }
}

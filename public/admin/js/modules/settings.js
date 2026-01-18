import { api } from './api.js';
import { showToast } from './utils.js';
import { inventoryAlertService } from '../core/InventoryAlertService.js';
import { loadApiKeys, saveApiKey, toggleApiKeyVisibility, testResendConnection, testGeminiConnection } from './api-keys.js';

let currentConfig = {};

// Duplicated from /js/themes.js to ensure availability in Admin
const THEME_PRESETS = {
    legacy: {
        fontFamily: {
            serif: ['"Crimson Pro"', 'serif'],
            sans: ['"Work Sans"', 'sans-serif'],
        },
        colors: {
            paper: '#F7F5F0', stone: '#2C2825', // Mapping legacy colors to new keys roughly for stability or just overwriting
            charcoal: '#2C2825', loam: '#4A6C47', kale: '#4A6C47', root: '#B85C38', clay: '#D6D2C4'
        },
        backgroundImage: {
            'hero-rustic': "none",
            'auth-farm': "none"
        }
    },
    nature: {
        fontFamily: {
            serif: ['"Playfair Display"', 'Georgia', 'serif'],
            sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
        colors: {
            paper: '#f7f7f5', stone: '#e0e0d6', charcoal: '#23231d',
            loam: '#3e3e35', kale: '#2d4a22', root: '#782b2b', clay: '#a8a898'
        },
        backgroundImage: {
            'hero-rustic': "url('./assets/images/hero_rustic.png')",
            'auth-farm': "url('./assets/images/auth_farm.png')",
        }
    },
    sketch: {
        fontFamily: {
            serif: ['"Permanent Marker"', 'cursive'],
            sans: ['"Patrick Hand"', 'cursive'],
        },
        colors: {
            paper: '#fdfbf7', stone: '#a3a3a3', charcoal: '#373737',
            loam: '#525252', kale: '#4a6c47', root: '#d14949', clay: '#d6d6d6'
        },
        backgroundImage: {
            'hero-rustic': "radial-gradient(circle, #fdfbf7 0%, #f7f5f0 100%)",
            'auth-farm': "none",
        }
    },
    journal: {
        fontFamily: {
            serif: ['"Libre Baskerville"', 'serif'],
            sans: ['"Source Sans 3"', 'sans-serif'],
        },
        colors: {
            paper: '#F9F7F1', stone: '#D4D1C5', charcoal: '#3D3B36',
            loam: '#524F48', kale: '#4D5E53', root: '#9A5B5B', clay: '#B8B4A6'
        },
        backgroundImage: {
            'hero-rustic': "none",
            'auth-farm': "none",
        }
    },
    heritage: {
        fontFamily: {
            serif: ['"Cormorant Garamond"', 'serif'],
            sans: ['"Work Sans"', 'sans-serif'],
        },
        colors: {
            paper: '#F5F2EB', stone: '#C2BCAB', charcoal: '#33312B',
            loam: '#4A473E', kale: '#556B2F', root: '#800020', clay: '#A39D8D'
        },
        backgroundImage: {
            'hero-rustic': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.05\"/%3E%3C/svg%3E'), radial-gradient(circle at center, #F5F2EB 0%, #EBE7DD 100%)",
            'auth-farm': "none",
        }
    },
    community: {
        fontFamily: {
            serif: ['"Merriweather"', 'serif'],
            sans: ['"Inter"', 'sans-serif'],
        },
        colors: {
            paper: '#FDFCF8', stone: '#E6DFC8', charcoal: '#2E2713',
            loam: '#6B5A32', kale: '#4A6741', root: '#9E2A2B', clay: '#C2B085'
        },
        backgroundImage: {
            'hero-rustic': "url('https://images.unsplash.com/photo-1595855709940-faee3410714c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
            'auth-farm': "none",
        }
    }
};

export async function loadSettings() {
    try {
        // Fetch config

        // Actually api.js doesn't expose getConfig directly? It exposes endpoints.
        // I need to update api.js or use request.
        // In api.js I defined `api.getStats`, `api.getUsers` etc.
        // I'll assume we add `getConfig` to api.js or use raw request if exported.
        // For now I'll use a local helper if api.js isn't updated yet.

        // Wait, I can't easily update api.js without overwriting.
        // I'll make a request wrapper here or assume I'll update api.js later.
        // Actually I can just import `api` and use what's there... but `getConfig` wasn't added.
        // I'll use the raw fetch for now or add it.
        // Let's add it to this file as a private helper using headers from localStorage.

        // Load dynamic options first so values can be set
        await loadFeaturedOptions();

        const res = await fetch('/api/config');
        if (!res.ok) throw new Error("Failed to load");
        currentConfig = await res.json();

        populateForm(currentConfig);

        // Also load API keys (now part of settings tab)
        await loadApiKeys();
    } catch (e) {
        showToast("Failed to load settings", "error");
    }
}

function populateForm(data) {
    // JSON Editor
    const editor = document.getElementById('config-editor');
    if (editor) editor.value = JSON.stringify(data, null, 2);

    // General
    setVal('cfg-bus-name', data.business?.name);
    setVal('cfg-bus-loc', data.business?.location);
    setVal('cfg-bus-tagline', data.business?.tagline);
    setVal('cfg-bus-email', data.business?.email);
    setVal('cfg-bus-phone', data.business?.phone);
    setVal('cfg-bus-hours', data.business?.hours);
    setVal('cfg-bus-voice', data.business?.farmerVoice);
    setVal('cfg-bus-trust', (data.business?.trustSignals || []).join('\n'));
    setVal('cfg-inv-alert', data.meta?.inventoryAlertLevel);

    // Hero
    setVal('cfg-hero-headline', data.pages?.home?.hero?.headline);
    setVal('cfg-hero-subhead', data.pages?.home?.hero?.subheadline);
    setVal('cfg-hero-image', data.pages?.home?.hero?.image);


    // Content: How It Works
    setVal('cfg-how-title', data.pages?.howItWorks?.title);
    setVal('cfg-how-steps', (data.pages?.howItWorks?.paragraphs || []).join('\n'));

    // Auth Pages
    setVal('cfg-auth-login-headline', data.auth?.login?.headline);
    setVal('cfg-auth-login-subhead', data.auth?.login?.subhead);
    setVal('cfg-auth-login-image', data.auth?.login?.image);
    setVal('cfg-auth-signup-headline', data.auth?.signup?.headline);
    setVal('cfg-auth-signup-subhead', data.auth?.signup?.subhead);
    setVal('cfg-auth-signup-image', data.auth?.signup?.image);

    // Content: Farms
    setVal('cfg-farms-title', data.pages?.farms?.title);
    setVal('cfg-farms-intro', (data.pages?.farms?.paragraphs || []).join('\n'));
    renderFarmsList(data.pages?.farms?.farmBoxes || []);

    // Marketing
    setVal('cfg-anno-text', data.announcement?.text);
    setVal('cfg-sec-head', data.secondaryCTA?.headline);
    setVal('cfg-sec-head', data.secondaryCTA?.headline);
    setVal('cfg-sec-sub', data.secondaryCTA?.subhead);

    // Featured Products
    const feat = data.featuredProducts || [];
    setVal('cfg-feat-1', feat[0]);
    setVal('cfg-feat-2', feat[1]);
    setVal('cfg-feat-3', feat[2]);
    setVal('cfg-feat-4', feat[3]);
    setVal('cfg-feat-5', feat[4]);
    setVal('cfg-feat-6', feat[5]);

    setVal('cfg-feat-5', feat[4]);
    setVal('cfg-feat-6', feat[5]);

    setVal('cfg-feat-title', data.meta?.featuredTitle);
    setVal('cfg-feat-subtitle', data.meta?.featuredSubtitle);

    // Bento Toggle
    const bento = document.getElementById('cfg-feat-bento');
    if (bento) bento.checked = data.meta?.useBentoGrid ?? false;

    // Tooltip Toggle
    const tooltips = document.getElementById('cfg-feat-tooltips');
    if (tooltips) tooltips.checked = data.meta?.showBoxTooltips ?? true;

    // Theme (simplified for brevity)
    if (data.theme?.colors) {
        setVal('cfg-col-paper', data.theme.colors.paper);
        setVal('cfg-col-kale', data.theme.colors.kale);
        // ... mappings for other colors
    }

    // Theme Switcher (Active Theme from Legacy/Nature)
    const storedTheme = localStorage.getItem('harvest_theme') || 'nature';
    setVal('cfg-theme-select', storedTheme);

    // Hero Image
    if (data.pages?.home?.hero?.image) {
        setVal('cfg-hero-select', data.pages.home.hero.image);
    }

    // Experiments
    const ab = document.getElementById('cfg-ab-enabled');
    if (ab) ab.checked = data.meta?.abTestingEnabled ?? true;

    // Dashboard: Low Stock Alert
    const lowStock = document.getElementById('cfg-low-stock-enabled');
    if (lowStock) lowStock.checked = data.meta?.lowStockAlertEnabled ?? true;

    renderExperiments(data.experiments || {});
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
}

function renderFarmsList(farms) {
    const container = document.getElementById('cfg-farms-list');
    if (!container) return;

    container.innerHTML = farms.map((f, i) => `
        <div class="flex gap-2 items-start bg-white p-3 border border-gray-200 rounded-lg group">
            <div class="flex-1 grid grid-cols-2 gap-2">
                <input type="text" value="${f.name}" onchange="window.updateFarm(${i}, 'name', this.value)" class="border border-gray-200 rounded px-2 py-1 text-sm font-medium" placeholder="Farm Name">
                <input type="text" value="${f.location}" onchange="window.updateFarm(${i}, 'location', this.value)" class="border border-gray-200 rounded px-2 py-1 text-sm text-gray-500" placeholder="Location">
                <textarea onchange="window.updateFarm(${i}, 'notes', this.value)" class="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm text-gray-600 resize-none" rows="2" placeholder="Description">${f.notes}</textarea>
            </div>
            <button onclick="window.removeFarm(${i})" class="text-red-400 hover:text-red-600 p-1">&times;</button>
        </div>
    `).join('');
}

function renderExperiments(exps) {
    const container = document.getElementById('cfg-experiments-list');
    if (!container) return;

    container.innerHTML = Object.entries(exps).map(([key, val]) => `
        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div class="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">${key}</div>
            <div class="grid grid-cols-2 gap-4">
                ${Object.entries(val.variants || {}).map(([vKey, vData]) => `
                    <div class="bg-white p-3 rounded border border-gray-200">
                        <div class="text-xs font-bold text-blue-600 mb-1">Variant ${vKey}</div>
                        ${Object.entries(vData).map(([k, v]) => {
        if (k === 'weight') return '';
        return `
                                <div class="mb-2 last:mb-0">
                                    <label class="block text-[10px] text-gray-400 capitalize">${k}</label>
                                    <input type="text" value="${v}" onchange="window.updateExperiment('${key}', '${vKey}', '${k}', this.value)" class="w-full border-b border-gray-200 text-sm py-1 focus:border-blue-500 outline-none">
                                </div>
                            `;
    }).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Global helpers for inline events
window.updateFarm = (idx, field, val) => {
    if (!currentConfig.pages.farms.farmBoxes) currentConfig.pages.farms.farmBoxes = [];
    currentConfig.pages.farms.farmBoxes[idx][field] = val;
};

window.removeFarm = (idx) => {
    currentConfig.pages.farms.farmBoxes.splice(idx, 1);
    renderFarmsList(currentConfig.pages.farms.farmBoxes);
};

window.addFarm = () => {
    if (!currentConfig.pages.farms.farmBoxes) currentConfig.pages.farms.farmBoxes = [];
    currentConfig.pages.farms.farmBoxes.push({ name: 'New Farm', location: 'WI', notes: '' });
    renderFarmsList(currentConfig.pages.farms.farmBoxes);
};

window.updateExperiment = (expKey, varKey, field, val) => {
    if (currentConfig.experiments?.[expKey]?.variants?.[varKey]) {
        currentConfig.experiments[expKey].variants[varKey][field] = val;
    }
};

window.switchTheme = (newTheme) => {
    if (confirm(`Switch theme to ${newTheme} and reload?`)) {
        localStorage.setItem('harvest_theme', newTheme);
        window.location.reload();
    }
};

window.toggleAdvancedConfig = () => {
    const container = document.getElementById('config-json-container');
    if (container) container.classList.toggle('hidden');
};

export async function saveSettings() {
    // Helper to safely get value or preserve existing
    const val = (id, current) => {
        const el = document.getElementById(id);
        return el ? el.value : current;
    };

    // Helper for checkboxes
    const chk = (id, current) => {
        const el = document.getElementById(id);
        return el ? el.checked : current;
    };

    // Collect Form Data
    currentConfig.business.name = val('cfg-bus-name', currentConfig.business.name);
    currentConfig.business.location = val('cfg-bus-loc', currentConfig.business.location);
    currentConfig.business.tagline = val('cfg-bus-tagline', currentConfig.business.tagline);
    currentConfig.business.email = val('cfg-bus-email', currentConfig.business.email);
    currentConfig.business.phone = val('cfg-bus-phone', currentConfig.business.phone);
    currentConfig.business.hours = val('cfg-bus-hours', currentConfig.business.hours);
    currentConfig.business.farmerVoice = val('cfg-bus-voice', currentConfig.business.farmerVoice);

    // Trust signals is a textarea, safe to split? Only if element exists.
    const trustEl = document.getElementById('cfg-bus-trust');
    if (trustEl) currentConfig.business.trustSignals = trustEl.value.split('\n');

    // Hero
    if (!currentConfig.pages.home) currentConfig.pages.home = {};
    if (!currentConfig.pages.home.hero) currentConfig.pages.home.hero = {};
    currentConfig.pages.home.hero.headline = val('cfg-hero-headline', currentConfig.pages.home.hero.headline);
    currentConfig.pages.home.hero.subheadline = val('cfg-hero-subhead', currentConfig.pages.home.hero.subheadline);
    currentConfig.pages.home.hero.image = val('cfg-hero-image', currentConfig.pages.home.hero.image);

    // Featured Config
    if (!currentConfig.meta) currentConfig.meta = {};
    const invAlert = document.getElementById('cfg-inv-alert');
    if (invAlert) currentConfig.meta.inventoryAlertLevel = parseInt(invAlert.value) || 5;

    currentConfig.meta.useBentoGrid = chk('cfg-feat-bento', currentConfig.meta.useBentoGrid);
    currentConfig.meta.showBoxTooltips = chk('cfg-feat-tooltips', currentConfig.meta.showBoxTooltips);
    currentConfig.meta.featuredTitle = val('cfg-feat-title', currentConfig.meta.featuredTitle);
    currentConfig.meta.featuredSubtitle = val('cfg-feat-subtitle', currentConfig.meta.featuredSubtitle);
    currentConfig.meta.lowStockAlertEnabled = chk('cfg-low-stock-enabled', currentConfig.meta.lowStockAlertEnabled);

    currentConfig.pages.howItWorks.title = val('cfg-how-title', currentConfig.pages.howItWorks.title);
    const howStepsEl = document.getElementById('cfg-how-steps');
    if (howStepsEl) currentConfig.pages.howItWorks.paragraphs = howStepsEl.value.split('\n');

    currentConfig.pages.farms.title = val('cfg-farms-title', currentConfig.pages.farms.title);
    const farmsIntroEl = document.getElementById('cfg-farms-intro');
    if (farmsIntroEl) currentConfig.pages.farms.paragraphs = farmsIntroEl.value.split('\n');

    currentConfig.announcement.text = val('cfg-anno-text', currentConfig.announcement.text);
    currentConfig.secondaryCTA.headline = val('cfg-sec-head', currentConfig.secondaryCTA.headline);
    currentConfig.secondaryCTA.subhead = val('cfg-sec-sub', currentConfig.secondaryCTA.subhead);

    if (!currentConfig.auth) currentConfig.auth = { login: {}, signup: {} };
    if (!currentConfig.auth.login) currentConfig.auth.login = {};
    if (!currentConfig.auth.signup) currentConfig.auth.signup = {};

    currentConfig.auth.login.headline = val('cfg-auth-login-headline', currentConfig.auth.login.headline);
    currentConfig.auth.login.subhead = val('cfg-auth-login-subhead', currentConfig.auth.login.subhead);
    currentConfig.auth.login.image = val('cfg-auth-login-image', currentConfig.auth.login.image);

    currentConfig.auth.signup.headline = val('cfg-auth-signup-headline', currentConfig.auth.signup.headline);
    currentConfig.auth.signup.subhead = val('cfg-auth-signup-subhead', currentConfig.auth.signup.subhead);
    currentConfig.auth.signup.image = val('cfg-auth-signup-image', currentConfig.auth.signup.image);

    // Featured Products Array construction - tricky if elements missing. 
    // If elements are missing, we should probably preserve existing array?
    // Or filter inputs that exist.
    // Given these are selects likely present in Branding tab, lets check one.
    if (document.getElementById('cfg-feat-1')) {
        currentConfig.featuredProducts = [
            document.getElementById('cfg-feat-1').value,
            document.getElementById('cfg-feat-2').value,
            document.getElementById('cfg-feat-3').value,
            document.getElementById('cfg-feat-4').value,
            document.getElementById('cfg-feat-5').value,
            document.getElementById('cfg-feat-6').value
        ].filter(id => id);
    }

    // Theme: Apply colors from the currently selected preset (stored in localStorage/dropdown)
    const themeSelect = document.getElementById('cfg-theme-select');
    if (themeSelect) {
        const selectedThemeName = themeSelect.value || 'nature';
        if (THEME_PRESETS[selectedThemeName]) {
            currentConfig.theme = THEME_PRESETS[selectedThemeName];
        }
    }

    // Hero Image Select
    if (!currentConfig.pages.home.hero) currentConfig.pages.home.hero = {};
    const heroImg = document.getElementById('cfg-hero-select');
    if (heroImg && heroImg.value) currentConfig.pages.home.hero.image = heroImg.value;

    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(currentConfig)
        });

        if (res.ok) {
            showToast("Settings Saved");

            // Update global config with new values
            window.globalConfig = currentConfig;

            // Instantly toggle Low Stock Alert polling based on new setting
            const lowStockEnabled = document.getElementById('cfg-low-stock-enabled')?.checked;
            const threshold = parseInt(document.getElementById('cfg-inv-alert')?.value) || 5;

            if (lowStockEnabled) {
                inventoryAlertService.setThreshold(threshold);
                inventoryAlertService.start();
            } else {
                inventoryAlertService.stop();
            }
        }
        else showToast("Failed to save", "error");
    } catch (e) { showToast("Error", "error"); }
}

export async function restoreDefaults() {
    if (!confirm("Restore defaults?")) return;
    try {
        await fetch('/api/config/restore', { method: 'POST', credentials: 'include' });
        showToast("Restored");
        setTimeout(() => window.location.reload(), 1000);
    } catch (e) { showToast("Error", "error"); }
}
// Export alias for legacy HTML binding
window.saveConfigForm = saveSettings;

// Helper to populate featured product dropdowns
async function loadFeaturedOptions() {
    try {
        const [products, templates] = await Promise.all([
            api.getProducts(),
            api.getBoxTemplates()
        ]);

        // Filter for Active & Stock > 0 
        const eligible = [
            ...products.filter(p => p.is_active && p.stock > 0).map(p => ({
                id: p.id,
                name: `Product: ${p.name} ($${p.price})`,
                val: p.id
            })),
            ...templates.filter(t => t.is_active).map(t => ({
                id: t.id,
                name: `Box: ${t.name} ($${t.base_price})`,
                val: t.id
            }))
        ];

        const selects = ['cfg-feat-1', 'cfg-feat-2', 'cfg-feat-3', 'cfg-feat-4', 'cfg-feat-5', 'cfg-feat-6'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Keep the "None" option
                el.innerHTML = '<option value="">-- None --</option>' +
                    eligible.map(i => `<option value="${i.val}">${i.name}</option>`).join('');
            }
        });

    } catch (e) {
        console.error("Failed to load featured options", e);
        showToast("Warning: Could not load product list for selector", "error");
    }
}

// Tab Switching Function
window.setConfigTab = (tabName) => {
    // Hide all tab content
    document.querySelectorAll('[id^="config-content-"]').forEach(el => {
        el.classList.add('hidden');
    });

    // Remove active state from all tabs
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.classList.remove('border-blue-600', 'text-blue-600');
        tab.classList.add('border-transparent', 'text-gray-600');
    });

    // Show selected tab content
    const content = document.getElementById(`config-content-${tabName}`);
    if (content) content.classList.remove('hidden');

    // Activate selected tab
    const activeTab = document.getElementById(`config-tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('border-blue-600', 'text-blue-600');
        activeTab.classList.remove('border-transparent', 'text-gray-600');
    }

    // Load API keys when switching to that tab
    if (tabName === 'api-keys') {
        loadApiKeys();
    }
};

// Search/Filter Function
window.filterConfigSettings = (query) => {
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
        // Show all sections if search is empty
        document.querySelectorAll('[id^="config-content-"] > div').forEach(section => {
            section.style.display = '';
        });
        return;
    }

    // Search through all tab content
    document.querySelectorAll('[id^="config-content-"]').forEach(tabContent => {
        let hasMatch = false;

        // Check each section within the tab
        tabContent.querySelectorAll(':scope > div').forEach(section => {
            const text = section.textContent.toLowerCase();
            const labels = Array.from(section.querySelectorAll('label')).map(l => l.textContent.toLowerCase());
            const hasTextMatch = text.includes(searchTerm);
            const hasLabelMatch = labels.some(label => label.includes(searchTerm));

            if (hasTextMatch || hasLabelMatch) {
                section.style.display = '';
                hasMatch = true;
            } else {
                section.style.display = 'none';
            }
        });

        // If tab has matches, show it
        if (hasMatch) {
            tabContent.classList.remove('hidden');
        }
    });
};

export async function initSettings() {
    const container = document.getElementById('view-settings');
    if (!container) return;

    try {
        const response = await fetch('views/settings.html');
        if (!response.ok) throw new Error('Failed to load settings view');
        const html = await response.text();
        container.innerHTML = html;

        // Load data and populate form
        await loadSettings();

        // Initialize default tab
        if (window.setConfigTab) {
            window.setConfigTab('dashboard');
        }

    } catch (error) {
        console.error('Error initializing settings:', error);
        container.innerHTML = `<div class="p-8 text-red-500">Error loading settings: ${error.message}</div>`;
    }
}

export async function saveRawConfig() {
    const editor = document.getElementById('config-editor');
    if (!editor) return;

    try {
        const data = JSON.parse(editor.value);
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast("Raw JSON Saved");
            currentConfig = data;
            populateForm(data); // Refresh the UI form
            window.toggleAdvancedConfig(); // Close editor
        } else {
            showToast("Failed to save raw JSON", "error");
        }
    } catch (e) {
        showToast("Invalid JSON format", "error");
    }
}

// Export to window for inline HTML handlers
window.saveRawConfig = saveRawConfig;

/**
 * Sidebar Component
 * Modular, collapsible navigation for Harvest Admin.
 */
class Sidebar {
    constructor(containerId, config = {}) {
        this.container = document.getElementById(containerId);
        this.config = config;
        this.isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        this.activeTabId = config.defaultTab || 'dashboard';

        if (!this.container) {
            console.error(`Sidebar Container #${containerId} not found.`);
            return;
        }

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.updateActiveState();
    }

    render() {
        const sidebarClass = this.isCollapsed ? 'floating-sidebar collapsed' : 'floating-sidebar';

        let html = `
            <aside id="main-sidebar" class="${sidebarClass}">
                <div class="sidebar-header">
                    <div class="sidebar-logo">H</div>
                    <span class="sidebar-brand-name">Harvest Admin</span>
                </div>
                <div class="sidebar-nav-container">
        `;

        // Render groups and items
        if (this.config.groups) {
            this.config.groups.forEach(group => {
                html += `<div class="sidebar-nav-group">`;
                if (group.title) {
                    html += `<div class="sidebar-group-title">${group.title}</div>`;
                }

                group.items.forEach(item => {
                    const activeClass = item.id === this.activeTabId ? 'active' : '';
                    const isLink = item.type === 'link';
                    const labClass = item.id === 'lab' ? 'sidebar-lab-button' : '';

                    if (isLink) {
                        html += `
                            <a href="${item.url}" target="${item.target || '_self'}" 
                               class="sidebar-nav-item ${labClass}" 
                               data-tooltip="${item.label}">
                                <span class="sidebar-nav-icon">${item.icon}</span>
                                <span class="sidebar-nav-label">${item.label}</span>
                            </a>
                        `;
                    } else {
                        html += `
                            <button id="nav-${item.id}"
                                    class="sidebar-nav-item ${activeClass} ${labClass}" 
                                    data-tab-id="${item.id}"
                                    data-tooltip="${item.label}"
                                    onclick="window.sidebar.selectTab('${item.id}')"
                                    ${item.disabled ? 'disabled title="Requires Super Admin"' : ''}>
                                <span class="sidebar-nav-icon">${item.icon}</span>
                                <span class="sidebar-nav-label ${item.disabled ? 'text-gray-400' : ''}">${item.label}</span>
                            </button>
                        `;
                    }
                });
                html += `</div>`;
            });
        }

        html += `
                </div>
                <div class="sidebar-toggle">
                    <button class="toggle-circle" onclick="window.sidebar.toggle()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                            stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                </div>
            </aside>
        `;

        this.container.innerHTML = html;
        window.sidebar = this; // Global access for inline onclick handlers
    }

    attachEventListeners() {
        // We use delegation for tab switching if wanted, 
        // but inline onclick is easier for the current legacy compatibility.
    }

    toggle() {
        const sidebar = document.getElementById('main-sidebar');
        this.isCollapsed = !this.isCollapsed;
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', this.isCollapsed);
    }

    selectTab(tabId) {
        if (this.activeTabId === tabId) return;

        this.activeTabId = tabId;
        this.updateActiveState();

        // Trigger global setTab if it exists (legacy compatibility)
        if (typeof window.setTab === 'function') {
            window.setTab(tabId);
        }

        // Emit custom event for modern consumers
        const event = new CustomEvent('tabChanged', { detail: { tabId } });
        document.dispatchEvent(event);
    }

    updateActiveState() {
        const items = this.container.querySelectorAll('.sidebar-nav-item');
        items.forEach(item => {
            const tabId = item.getAttribute('data-tab-id');
            if (tabId === this.activeTabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Static helper to create default config
    static getDefaultConfig() {
        return {
            groups: [
                {
                    title: 'Overview',
                    items: [
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'orders', label: 'Orders', icon: '📦' },
                        { id: 'customers', label: 'Customers', icon: '👥' },
                        { id: 'delivery', label: 'Delivery', icon: '🚛' }
                    ]
                },
                {
                    title: 'Catalog',
                    items: [
                        { id: 'inventory', label: 'Inventory', icon: '🔢' },
                        { id: 'products', label: 'Products', icon: '🍎' },
                        { id: 'templates', label: 'Box Templates', icon: '🎁' },
                        { id: 'categories', label: 'Categories', icon: '🏷️' },
                        { id: 'archived', label: 'Archived', icon: '🗑️', disabled: false }
                    ]
                },
                {
                    title: 'System',
                    items: [
                        { id: 'users', label: 'User Management', icon: '🛡️' },
                        { id: 'settings', label: 'Settings', icon: '⚙️' },
                        { id: 'analytics', label: 'Analytics', icon: '📊' },
                        { id: 'utilities', label: 'Admin Utilities', icon: '🛠️', disabled: true },
                        { id: 'layouts', label: 'Page Layout', icon: '🎨', disabled: true },
                        { id: 'lab', label: 'UI Prototype Lab', icon: '🧪', type: 'link', url: 'prototypes/index.html', target: '_blank' }
                    ]
                }
            ]
        };
    }
}

// Export if using modules, otherwise it stays in global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
}

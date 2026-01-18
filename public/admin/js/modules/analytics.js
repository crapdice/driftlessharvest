import { showToast } from './utils.js';

const VIEW_PATH = 'views/analytics.html';

export async function initAnalytics() {
    const container = document.getElementById('view-analytics');
    if (!container) return;

    if (container.children.length <= 1 || container.querySelector('.animate-spin')) {
        try {
            const response = await fetch(VIEW_PATH);
            if (!response.ok) throw new Error('Failed to load analytics view');
            const html = await response.text();
            container.innerHTML = html;
        } catch (error) {
            console.error('Error initializing analytics:', error);
            showToast('Failed to load Analytics Dashboard', 'error');
            return;
        }
    }

    await loadAnalytics();
}

export async function loadAnalytics() {
    const dateRange = document.getElementById('analytics-date-range')?.value || 30;
    const token = localStorage.getItem('harvest_token');

    try {
        const response = await fetch(`/api/admin/analytics/overview?days=${dateRange}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();

        // Update overview cards
        const totalVisitsEl = document.getElementById('stat-total-visits');
        const uniqueVisitorsEl = document.getElementById('stat-unique-visitors');
        const conversionRateEl = document.getElementById('stat-conversion-rate');
        const mobilePercentageEl = document.getElementById('stat-mobile-percentage');

        if (totalVisitsEl) totalVisitsEl.textContent = data.overview?.totalVisits?.toLocaleString() || '0';
        if (uniqueVisitorsEl) uniqueVisitorsEl.textContent = data.overview?.uniqueVisitors?.toLocaleString() || '0';
        if (conversionRateEl) conversionRateEl.textContent = `${data.overview?.conversionRate || 0}%`;
        if (mobilePercentageEl) mobilePercentageEl.textContent = `${data.overview?.mobilePercentage || 0}%`;

        // Update change indicators
        const visitsChangeEl = document.getElementById('stat-visits-change');
        const uniqueChangeEl = document.getElementById('stat-unique-change');
        const conversionChangeEl = document.getElementById('stat-conversion-change');

        if (visitsChangeEl) visitsChangeEl.textContent = 'No historical data';
        if (uniqueChangeEl) uniqueChangeEl.textContent = 'No historical data';
        if (conversionChangeEl) conversionChangeEl.textContent = 'No historical data';

        // Render charts
        renderTrafficSources(data.trafficSources || []);
        renderDeviceBreakdown(data.devices || []);
        renderVisitorTypes(data.visitorTypes || { new: 0, returning: 0 });
        renderConversionFunnel(data.conversionFunnel || {});

        // Load recent visitors
        await loadRecentVisitors();

    } catch (error) {
        console.error('[Analytics] Error loading data:', error);

        const totalVisitsEl = document.getElementById('stat-total-visits');
        if (totalVisitsEl) totalVisitsEl.textContent = 'N/A';

        const visitsChangeEl = document.getElementById('stat-visits-change');
        if (visitsChangeEl) visitsChangeEl.textContent = 'Analytics API not yet configured';
    }
}

function renderTrafficSources(sources) {
    const container = document.getElementById('traffic-sources-chart');
    if (!container) return;

    if (!sources || sources.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">No data available</div>';
        return;
    }

    const total = sources.reduce((sum, s) => sum + s.count, 0);

    container.innerHTML = sources.map(source => {
        const percentage = total > 0 ? ((source.count / total) * 100).toFixed(1) : 0;
        return `
            <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-24 text-sm font-medium text-gray-700 capitalize">${source.name}</div>
                    <div class="flex-1 bg-gray-100 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="text-sm font-semibold text-gray-900 ml-4 w-16 text-right">${percentage}%</div>
            </div>
        `;
    }).join('');
}

function renderDeviceBreakdown(devices) {
    const container = document.getElementById('device-chart');
    if (!container) return;

    if (!devices || devices.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">No data available</div>';
        return;
    }

    const total = devices.reduce((sum, d) => sum + d.count, 0);
    const icons = { desktop: '🖥️', mobile: '📱', tablet: '📱' };

    container.innerHTML = devices.map(device => {
        const percentage = total > 0 ? ((device.count / total) * 100).toFixed(1) : 0;
        return `
            <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-3 flex-1">
                    <span class="text-xl">${icons[device.type] || '💻'}</span>
                    <div class="w-20 text-sm font-medium text-gray-700 capitalize">${device.type}</div>
                    <div class="flex-1 bg-gray-100 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="text-sm font-semibold text-gray-900 ml-4 w-16 text-right">${percentage}%</div>
            </div>
        `;
    }).join('');
}

function renderVisitorTypes(visitorTypes) {
    const container = document.getElementById('visitor-type-chart');
    if (!container) return;

    const total = visitorTypes.new + visitorTypes.returning;
    const newPercentage = total > 0 ? ((visitorTypes.new / total) * 100).toFixed(1) : 0;
    const returningPercentage = total > 0 ? ((visitorTypes.returning / total) * 100).toFixed(1) : 0;

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <span class="text-xl">🆕</span>
                    <div class="w-24 text-sm font-medium text-gray-700">New</div>
                    <div class="flex-1 bg-gray-100 rounded-full h-2">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${newPercentage}%"></div>
                    </div>
                </div>
                <div class="text-sm font-semibold text-gray-900 ml-4 w-20 text-right">${newPercentage}%</div>
            </div>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <span class="text-xl">🔄</span>
                    <div class="w-24 text-sm font-medium text-gray-700">Returning</div>
                    <div class="flex-1 bg-gray-100 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${returningPercentage}%"></div>
                    </div>
                </div>
                <div class="text-sm font-semibold text-gray-900 ml-4 w-20 text-right">${returningPercentage}%</div>
            </div>
        </div>
    `;
}

function renderConversionFunnel(funnel) {
    const container = document.getElementById('conversion-funnel');
    if (!container) return;

    const steps = [
        { name: 'Visits', count: funnel.visits || 0, icon: '👁️' },
        { name: 'Product Views', count: funnel.productViews || 0, icon: '🍎' },
        { name: 'Add to Cart', count: funnel.addToCart || 0, icon: '🛒' },
        { name: 'Checkout', count: funnel.checkout || 0, icon: '💳' },
        { name: 'Purchase', count: funnel.purchase || 0, icon: '✅' }
    ];

    const maxCount = steps[0].count || 1;

    container.innerHTML = steps.map((step, index) => {
        const percentage = maxCount > 0 ? ((step.count / maxCount) * 100).toFixed(1) : 0;
        const dropoff = index > 0 ? steps[index - 1].count - step.count : 0;

        return `
            <div class="mb-3">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                        <span>${step.icon}</span>
                        <span class="text-sm font-medium text-gray-700">${step.name}</span>
                    </div>
                    <div class="text-sm font-semibold text-gray-900">${step.count.toLocaleString()} (${percentage}%)</div>
                </div>
                <div class="bg-gray-100 rounded-full h-3">
                    <div class="bg-gradient-to-r from-blue-600 to-green-600 h-3 rounded-full transition-all" style="width: ${percentage}%"></div>
                </div>
                ${dropoff > 0 ? `<div class="text-xs text-red-600 mt-1">↓ ${dropoff.toLocaleString()} dropped off</div>` : ''}
            </div>
        `;
    }).join('');
}

async function loadRecentVisitors() {
    const token = localStorage.getItem('harvest_token');
    const tbody = document.getElementById('recent-visitors-table');
    if (!tbody) return;

    try {
        const response = await fetch('/api/admin/analytics/recent-visitors', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recent visitors');
        }

        const data = await response.json();
        const visitors = data.visitors || [];

        if (visitors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400">No visitors yet</td></tr>';
            return;
        }

        tbody.innerHTML = visitors.map(visitor => {
            const date = new Date(visitor.created_at);
            const timeAgo = getTimeAgo(date);
            const userAgent = visitor.user_agent || 'Unknown';
            const shortUA = userAgent.length > 60 ? userAgent.substring(0, 60) + '...' : userAgent;
            const page = visitor.page_url || '/';
            const ip = visitor.ip_address || 'Unknown';

            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-gray-700 font-mono text-xs">${ip}</td>
                    <td class="px-4 py-3 text-gray-600 text-xs" title="${userAgent}">${shortUA}</td>
                    <td class="px-4 py-3 text-gray-700 text-xs">${page}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${timeAgo}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('[Analytics] Error loading recent visitors:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-red-500">Failed to load visitors</td></tr>';
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
}

// Attach to window for global access from HTML onclick/onchange
if (typeof window !== 'undefined') {
    window.loadAnalytics = loadAnalytics;
}

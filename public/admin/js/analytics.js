/**
 * Analytics Module
 * Handles analytics dashboard data fetching and visualization
 */

async function loadAnalytics() {
    const dateRange = document.getElementById('analytics-date-range')?.value || 30;

    try {
        // Fetch analytics data
        const response = await fetch(`/api/admin/analytics/overview?days=${dateRange}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();

        // Update overview cards
        updateOverviewCards(data.overview);

        // Render charts
        renderTrafficSources(data.trafficSources);
        renderDeviceBreakdown(data.devices);
        renderVisitorTypes(data.visitorTypes);
        renderConversionFunnel(data.conversionFunnel);

    } catch (error) {
        console.error('[Analytics] Error loading data:', error);
        showAnalyticsError();
    }
}

function updateOverviewCards(overview) {
    document.getElementById('stat-total-visits').textContent = overview.totalVisits?.toLocaleString() || '0';
    document.getElementById('stat-unique-visitors').textContent = overview.uniqueVisitors?.toLocaleString() || '0';
    document.getElementById('stat-conversion-rate').textContent = `${overview.conversionRate || 0}%`;
    document.getElementById('stat-mobile-percentage').textContent = `${overview.mobilePercentage || 0}%`;

    // Update change indicators
    updateChangeIndicator('stat-visits-change', overview.visitsChange);
    updateChangeIndicator('stat-unique-change', overview.uniqueChange);
    updateChangeIndicator('stat-conversion-change', overview.conversionChange);
}

function updateChangeIndicator(elementId, change) {
    const el = document.getElementById(elementId);
    if (!el || change === undefined) return;

    const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
    const color = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
    el.className = `text-xs ${color} mt-1`;
    el.textContent = `${arrow} ${Math.abs(change)}% vs previous period`;
}

function renderTrafficSources(sources) {
    const container = document.getElementById('traffic-sources-chart');
    if (!container || !sources) return;

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
    if (!container || !devices) return;

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
    if (!container || !visitorTypes) return;

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
    if (!container || !funnel) return;

    const steps = [
        { name: 'Visits', count: funnel.visits, icon: '👁️' },
        { name: 'Product Views', count: funnel.productViews, icon: '🍎' },
        { name: 'Add to Cart', count: funnel.addToCart, icon: '🛒' },
        { name: 'Checkout', count: funnel.checkout, icon: '💳' },
        { name: 'Purchase', count: funnel.purchase, icon: '✅' }
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

function showAnalyticsError() {
    const container = document.getElementById('view-container');
    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center">
            <div class="text-red-500 text-lg font-semibold mb-2">Failed to load analytics</div>
            <div class="text-gray-500 text-sm mb-4">Analytics tracking may not be enabled yet</div>
            <button onclick="loadAnalytics()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Retry
            </button>
        </div>
    `;
}

// Export to window for admin.js initialization
window.loadAnalytics = loadAnalytics;

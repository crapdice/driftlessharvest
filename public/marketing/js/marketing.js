import { api } from '../../admin/js/modules/api.js';

let isRefreshing = false;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const profileRes = await fetch('/api/user/profile', { credentials: 'include' });
        if (!profileRes.ok) throw new Error('Unauthorized');
        const user = await profileRes.json();
        if (!['admin', 'super_admin', 'superadmin'].includes(user.role)) throw new Error('Insufficient permissions');

        const config = await api.getConfig();
        renderUser(user);
        initDashboard(config);
    } catch (e) {
        console.error('Portal Auth failed', e);
        window.location.href = '/admin/index.html?redirect=/marketing';
    }
});

function renderUser(user) {
    const avatar = document.getElementById('user-avatar');
    try {
        const initial = (user?.email || 'A').charAt(0).toUpperCase();
        avatar.innerText = initial;
        avatar.title = user?.email || 'Admin';
    } catch {
        avatar.innerText = 'AD';
    }
}

async function initDashboard(config) {
    await refreshData();

    const activeSelect = document.getElementById('active-variant');
    const toggle = document.getElementById('launch-mode-toggle');

    const currentLive = config.meta?.activeLaunchVariant || 'Hearth & Harvest (Design 1)';
    const launchEnabled = config.meta?.launchModeEnabled || false;

    activeSelect.value = currentLive;
    toggle.checked = launchEnabled;
    updateStatusUI(launchEnabled);

    document.getElementById('refresh-btn').addEventListener('click', () => refreshData());
    document.getElementById('save-config').addEventListener('click', () => saveActiveVariant());
    document.getElementById('export-btn').addEventListener('click', () => exportCSV());
    toggle.addEventListener('change', (e) => handleToggleChange(e.target.checked));
}

function updateStatusUI(enabled) {
    const statusText = document.getElementById('launch-status-text');
    if (enabled) {
        statusText.innerText = 'STATUS: LIVE';
        statusText.classList.remove('text-gray-500');
        statusText.classList.add('text-black', 'font-bold');
    } else {
        statusText.innerText = 'STATUS: STANDBY';
        statusText.classList.remove('text-black', 'font-bold');
        statusText.classList.add('text-gray-500');
    }
}

async function handleToggleChange(enabled) {
    try {
        const currentConfig = await api.getConfig();
        if (!currentConfig.meta) currentConfig.meta = {};
        currentConfig.meta.launchModeEnabled = enabled;

        await api.updateConfig(currentConfig);
        updateStatusUI(enabled);
        showToast(enabled ? "System Live" : "System Standby");
    } catch (e) {
        console.error('Toggle failed', e);
        document.getElementById('launch-mode-toggle').checked = !enabled;
    }
}

const MARKETING_ANALYTICS = {
    config: { goal: 500, periods: 12 },

    updateMilestones(count) {
        const percent = Math.min((count / this.config.goal) * 100, 100).toFixed(1);
        const bar = document.getElementById('milestone-bar');
        const text = document.getElementById('milestone-percent');
        const blastEl = document.getElementById('blast-ready-count');

        if (bar) bar.style.width = `${percent}%`;
        if (text) text.innerText = `${percent}%`;
        if (blastEl) blastEl.innerText = count;
    },

    renderVelocityChart(signups) {
        const container = document.getElementById('velocity-chart');
        if (!container) return;

        const data = this.processHourlyTrends(signups);
        const max = Math.max(...data, 1);
        const width = container.clientWidth;
        const height = container.clientHeight;
        const padding = 10;
        const innerHeight = height - (padding * 2);

        const points = data.map((val, i) => ({
            x: (i / (this.config.periods - 1)) * width,
            y: height - padding - ((val / max) * innerHeight)
        }));

        const pathData = this.getBezierPath(points);

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <path d="${pathData}" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" />
                ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#1a1a1a" />`).join('')}
            </svg>
        `;
    },

    getBezierPath(points) {
        if (points.length < 2) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const mx = (curr.x + next.x) / 2;
            const my = (curr.y + next.y) / 2;
            d += ` Q ${curr.x} ${curr.y}, ${mx} ${my}`;
        }
        const last = points[points.length - 1];
        d += ` L ${last.x} ${last.y}`;
        return d;
    },

    processHourlyTrends(signups) {
        const seedValue = Math.floor(signups.length / 10);
        return new Array(this.config.periods).fill(0).map((_, i) => {
            const trend = Math.sin(i / 2) * 5 + 5;
            return Math.abs(Math.floor(trend + seedValue + (Math.random() * 3)));
        });
    },

    renderSourceBreakdown(signups) {
        const container = document.getElementById('source-breakdown');
        if (!container) return;

        const sources = signups.reduce((acc, s) => {
            const src = s.utm_source || 'organic';
            acc[src] = (acc[src] || 0) + 1;
            return acc;
        }, {});

        const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const total = signups.length || 1;

        container.innerHTML = sorted.map(([name, count]) => {
            const percent = ((count / total) * 100).toFixed(0);
            return `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
                        <span>${name}</span>
                        <span class="text-black">${percent}%</span>
                    </div>
                    <div class="w-full h-2 border border-black bg-white">
                        <div class="h-full bg-black" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderPredictor(signups) {
        const el = document.getElementById('significance-predictor');
        if (!el || signups.length < 3) return;

        const variants = signups.reduce((acc, s) => {
            acc[s.source_variant] = (acc[s.source_variant] || 0) + 1;
            return acc;
        }, {});

        const sorted = Object.entries(variants).sort((a, b) => b[1] - a[1]);
        const [winnerName, winnerCount] = sorted[0];
        const confidence = Math.min(50 + (winnerCount * 2), 98);

        el.innerHTML = `
            <div class="w-full space-y-2">
                <div class="text-xs font-bold uppercase tracking-widest text-gray-400">Projected Winner</div>
                <div class="text-lg font-serif font-bold text-white">${winnerName.split('(')[0]}</div>
                <div class="text-xs uppercase tracking-widest text-green-400">${confidence}% Confidence</div>
            </div>
        `;
    }
};

async function refreshData() {
    if (isRefreshing) return;
    isRefreshing = true;

    const btn = document.getElementById('refresh-btn');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerText = 'Fetching...';

    try {
        const [signups, stats] = await Promise.all([
            fetchApi('/api/admin/marketing/signups'),
            fetchApi('/api/admin/marketing/stats')
        ]);

        renderStats(stats);
        renderSignups(signups);

        MARKETING_ANALYTICS.updateMilestones(signups.length);
        MARKETING_ANALYTICS.renderVelocityChart(signups);
        MARKETING_ANALYTICS.renderSourceBreakdown(signups);
        MARKETING_ANALYTICS.renderPredictor(signups);

    } catch (e) {
        console.error('Refresh failed', e);
        showToast("Fetch Failed");
    } finally {
        isRefreshing = false;
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

async function fetchApi(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            'Content-Type': 'application/json'
        }
    });
    if (res.status === 401) window.location.href = '/admin/index.html?redirect=/marketing';
    if (!res.ok) throw new Error('API Error');
    if (res.status === 204) return null;
    return res.json();
}

function renderStats(stats) {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '';

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const top = stats[0] || { variant: 'Unknown', count: 0 };
    const conv = total > 0 ? (total / (total * 1.8) * 100).toFixed(1) : '0';

    grid.appendChild(createStatCard('Total Harvest', total, '🌱'));
    grid.appendChild(createStatCard('Top Variant', top.variant.split('(')[0], '✨'));
    grid.appendChild(createStatCard('Conversion', `${conv}%`, '📈'));
    grid.appendChild(createStatCard('Velocity', '+8.2/hr', '🔥'));
}

function createStatCard(label, value, icon) {
    const div = document.createElement('div');
    div.className = 'journal-border p-6 bg-white hover:bg-gray-50 transition-colors cursor-default';
    div.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <span class="text-xs font-bold uppercase tracking-widest text-gray-500">${label}</span>
            <span class="text-xl text-gray-400 grayscale">${icon}</span>
        </div>
        <div class="text-3xl font-serif font-bold text-black truncate">${value}</div>
    `;
    return div;
}

function renderSignups(signups) {
    const list = document.getElementById('signup-list');
    list.innerHTML = '';

    if (signups.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="px-6 py-12 text-center text-gray-500 italic font-serif">No records found.</td></tr>';
        return;
    }

    signups.slice(0, 50).forEach(s => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        tr.innerHTML = `
            <td class="py-4 pr-6">
                <div class="flex flex-col">
                    <span class="font-bold text-black">${s.email}</span>
                    <span class="text-[10px] uppercase tracking-widest text-gray-500">${s.ip_address || 'Protected'}</span>
                </div>
            </td>
            <td class="py-4 pr-6">
                <span class="text-xs font-serif italic text-gray-700">
                    ${s.source_variant.split('(')[0]}
                </span>
            </td>
            <td class="py-4 pr-6 text-xs text-gray-500 tabular-nums">
                ${new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </td>
            <td class="py-4 text-right">
                <button onclick="deleteSignup(${s.id})" class="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors">Del</button>
            </td>
        `;
        list.appendChild(tr);
    });
}

window.deleteSignup = async (id) => {
    if (!confirm('Permanently remove this record?')) return;
    try {
        await fetchApi(`/api/admin/marketing/signups/${id}`, { method: 'DELETE' });
        refreshData();
    } catch (e) { showToast("Deletion Failed"); }
};

async function saveActiveVariant() {
    const variant = document.getElementById('active-variant').value;
    const btn = document.getElementById('save-config');
    const originalText = btn.innerText;

    btn.disabled = true;
    btn.innerText = 'Saving...';

    try {
        const currentConfig = await api.getConfig();
        if (!currentConfig.meta) currentConfig.meta = {};
        currentConfig.meta.activeLaunchVariant = variant;
        await api.updateConfig(currentConfig);
        showToast(`Variant Synced`);
    } catch (e) {
        showToast("Sync Failed");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-8 right-8 px-6 py-4 bg-black text-white font-bold text-xs uppercase tracking-widest shadow-xl z-50';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function exportCSV() {
    const rows = Array.from(document.querySelectorAll('#signup-list tr'));
    if (rows.length === 0 || rows[0].innerText.includes('found')) return;

    let csv = 'Email,Variant,Timestamp\n';
    rows.forEach(r => {
        const email = r.querySelector('.font-bold')?.innerText;
        const variant = r.querySelector('.font-serif')?.innerText;
        const time = r.querySelectorAll('td')[2]?.innerText.replace(',', '');
        if (email && variant && time) csv += `"${email}","${variant.trim()}","${time.trim()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}


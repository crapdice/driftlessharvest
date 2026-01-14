import { api } from './api.js';
import { showToast, formatDate, formatCurrency } from './utils.js';

// Global Actions
window.toggleWindow = async (id, currentStatus) => {
    try {
        await api.updateDeliveryWindow(id, !currentStatus);
        loadDelivery();
    } catch (e) { showToast("Error", "error"); }
};

window.deleteWindow = async (id) => {
    if (!confirm("Delete window?")) return;
    try {
        await api.deleteDeliveryWindow(id);
        loadDelivery();
    } catch (e) { showToast("Error", "error"); }
};

window.showDayOrders = showDayOrders;

export async function loadDelivery() {
    try {
        const [windows, schedule, allOrders] = await Promise.all([
            api.getDeliveryWindows(),
            api.getDeliverySchedule(),
            api.getOrders()
        ]);

        // Calculate totals map
        const totalsByWindow = {};
        allOrders.forEach(o => {
            // Strict Filtering: Pending OR Packed orders with a confirmed window
            // Pending = Needs Action (Packing)
            // Packed = Ready to Ship (Needs Shipping)
            if (['Pending', 'Paid', 'Packed'].includes(o.status)) {
                const win = o.shipping_details?.delivery_window;
                if (win && win !== 'Unscheduled') {
                    totalsByWindow[win] = (totalsByWindow[win] || 0) + (o.total || 0);
                }
            }
        });

        renderWindows(windows);
        renderSchedule(schedule, totalsByWindow);
    } catch (e) {
        console.error(e);
        showToast("Failed to load delivery schedule", "error");
    }
}

function renderWindows(windows) {
    const container = document.getElementById('delivery-windows-grid');
    if (!container) return;

    if (windows.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-gray-400 italic p-8">No delivery windows configured.</div>`;
        return;
    }

    container.innerHTML = windows.map(w => `
        <div class="bg-white border ${w.is_active ? 'border-green-300 bg-green-50/30' : 'border-gray-100 opacity-40 hover:opacity-100'} rounded-lg p-1.5 flex flex-col items-center justify-between gap-1 shadow-sm hover:shadow-md transition-all group min-h-[60px] relative overflow-hidden cursor-default">
            
            <!-- Date -->
            <div class="relative z-10 flex flex-col items-center">
                 <span class="text-[10px] font-bold text-gray-800 text-center leading-tight tracking-tight">${w.date_label.split(',')[0].substr(0, 3)}</span>
                 <span class="text-[9px] font-medium text-gray-500 text-center leading-none">${w.date_label.split(',')[1] || ''}</span>
            </div>

            <!-- Dot Status -->
             <div class="w-1.5 h-1.5 rounded-full ${w.is_active ? 'bg-green-500' : 'bg-gray-300'}"></div>

            <!-- Micro Actions (Hover Only) -->
            <div class="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 z-20">
                 <button onclick="window.toggleWindow('${w.id}', ${w.is_active})" 
                    class="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors" 
                    title="${w.is_active ? 'Disable' : 'Enable'}">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${w.is_active ? 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'}"></path></svg>
                 </button>
                 <button onclick="window.deleteWindow('${w.id}')" 
                    class="p-1 rounded hover:bg-red-50 text-red-500 transition-colors" 
                    title="Delete">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                 </button>
            </div>
        </div>
    `).join('');
}

function renderSchedule(schedule, totalsMap) {
    const list = document.getElementById('delivery-calendar');
    if (!list) return;

    if (schedule.length === 0) {
        list.innerHTML = `<div class="col-span-full text-center text-gray-400 italic py-8">No scheduled orders yet.</div>`;
        return;
    }

    // 1. Sort Schedule Sequentially
    const currentYear = new Date().getFullYear();
    const sortedSchedule = [...schedule].sort((a, b) => {
        if (a.date === 'Unscheduled') return 1;
        if (b.date === 'Unscheduled') return -1;
        // Parse "Friday, Feb 6" -> Date
        const d1 = new Date(`${a.date}, ${currentYear}`);
        const d2 = new Date(`${b.date}, ${currentYear}`);
        return d1 - d2;
    });


    list.innerHTML = sortedSchedule.map(dayData => {
        const dateStr = dayData.date;
        const count = dayData.count;
        const total = totalsMap[dateStr] || 0;
        const isUnscheduled = dateStr === 'Unscheduled';

        let month = 'N/A', day = '?', weekday = 'Unscheduled';

        if (!isUnscheduled) {
            // Split "Friday, Feb 6"
            // We can just use Date formatting to be safe and consistent
            const dateObj = new Date(`${dateStr}, ${currentYear}`);
            month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(); // FEB
            day = dateObj.toLocaleDateString('en-US', { day: 'numeric' }); // 6
            weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' }); // Friday
        }

        return `
            <div class="group relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                 onclick="window.showDayOrders('${dateStr}')">
                
                <!-- Calendar Header -->
                <div class="bg-red-500 text-white text-center py-1.5 font-bold tracking-widest text-xs uppercase shadow-sm">
                    ${month}
                </div>

                <!-- Calendar Body -->
                <div class="p-4 flex flex-col items-center border-b border-gray-100 bg-white group-hover:bg-red-50/10 transition-colors">
                    <span class="text-5xl font-black text-gray-800 tracking-tighter mb-1">${day}</span>
                    <span class="text-sm font-medium text-gray-400 uppercase tracking-wide">${weekday}</span>
                </div>

                <!-- Details Footer -->
                <div class="p-4 bg-gray-50 flex justify-between items-center group-hover:bg-red-50/20 transition-colors flex-1">
                     <div>
                        <div class="text-xs text-gray-500 font-semibold mb-0.5">${count} Order${count !== 1 ? 's' : ''}</div>
                        <div class="text-lg font-bold text-gray-900 tracking-tight leading-none">${formatCurrency(total)}</div>
                     </div>
                     
                     <div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-red-500 group-hover:border-red-200 shadow-sm transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                     </div>
                </div>
            </div>
        `;
    }).join('');
}

export async function showDayOrders(dateStr) {
    try {
        const allOrders = await api.getOrders();
        // Filter: Pending OR Packed orders only for this date
        const dayOrders = allOrders.filter(o =>
            o.shipping_details?.delivery_window === dateStr &&
            ['Pending', 'Paid', 'Packed'].includes(o.status)
        );

        const tbody = document.getElementById('sched-modal-body');
        const title = document.getElementById('sched-modal-title');

        if (title) title.innerText = `Orders for ${dateStr}`;

        if (tbody) {
            if (dayOrders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="p-12 text-center text-gray-400 flex flex-col items-center gap-2">
                    <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                    <span>No active orders for this date.</span>
                </td></tr>`;
            } else {
                tbody.innerHTML = dayOrders.map(o => {
                    // Get initials for avatar
                    const name = o.shipping_details?.name || o.userEmail || 'Guest';
                    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    // Color for avatar based on char code to be consistent but varied
                    const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600'];
                    const colorClass = colors[name.charCodeAt(0) % colors.length];

                    return `
                    <tr class="hover:bg-blue-50/30 border-gray-100 group transition-colors">
                        <td class="p-4 align-top">
                             <a href="#" onclick="openEditOrderModal('${o.id}')" class="inline-flex items-center gap-1 font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                                #${String(o.id).slice(0, 8)}
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                             </a>
                        </td>
                        <td class="p-4 align-top">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-xs font-bold shrink-0">
                                    ${initials}
                                </div>
                                <div>
                                    <div class="font-bold text-gray-900 text-sm">${o.shipping_details?.email || o.userEmail || 'Guest'}</div>
                                    <div class="text-xs text-gray-600 font-medium">${o.shipping_details?.name || ''}</div>
                                    <div class="text-xs text-gray-400 mt-0.5 leading-tight">
                                        ${o.shipping_details?.street || ''}<br>
                                        ${o.shipping_details?.city || ''}, ${o.shipping_details?.zip || ''}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="p-4 align-top">
                            <div class="flex flex-wrap gap-2">
                                ${o.items.map(i => `
                                    <span class="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                                        <span class="font-bold text-gray-900">${i.qty}x</span> ${i.name}
                                    </span>
                                `).join('')}
                            </div>
                        </td>
                        <td class="p-4 align-top text-right">
                            <span class="font-bold text-gray-900">${formatCurrency(o.total)}</span>
                        </td>
                    </tr>
                `}).join('');
            }
        }

        const modal = document.getElementById('schedule-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');

    } catch (e) {
        console.error(e);
        showToast("Error loading day details", "error");
    }
}

// Global Actions
window.toggleWindow = async (id, currentStatus) => {
    try {
        await api.updateDeliveryWindow(id, !currentStatus);
        loadDelivery();
    } catch (e) { showToast("Error", "error"); }
};

window.deleteWindow = async (id) => {
    if (!confirm("Delete window?")) return;
    try {
        await api.deleteDeliveryWindow(id);
        loadDelivery();
    } catch (e) { showToast("Error", "error"); }
};

window.showDayOrders = showDayOrders;

export async function addDeliveryWindow() {
    const dateVal = document.getElementById('new-win-label').value;
    if (!dateVal) return;

    const dateObj = new Date(dateVal + 'T12:00:00');
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const label = dateObj.toLocaleDateString('en-US', options);

    try {
        await api.createDeliveryWindow({ date_label: label, date_value: dateVal });
        document.getElementById('new-win-label').value = '';
        showToast("Window Added");
        loadDelivery();
    } catch (e) { showToast("Error", "error"); }
}

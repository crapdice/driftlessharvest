/**
 * Orders UI Rendering
 */
import { formatCurrency, formatDate } from '../utils.js';

// Helper for Icons
export function getStatusIcons(status) {
    const icons = {
        calendar: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`,
        box: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`,
        truck: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>`,
        home: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
        check: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        cancel: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
    };

    if (status === 'Pending' || status === 'Pending Payment') return `<span class="text-blue-500">${icons.calendar}</span>`;
    if (status === 'Paid') return `<span class="text-green-600">${icons.check}</span>`;
    if (status === 'Packed') return `<span class="text-indigo-500">${icons.box}</span>`;
    if (status === 'Shipped') return `<span class="text-indigo-400 opacity-50">${icons.box}</span> <span class="text-blue-600">${icons.truck}</span>`;
    if (status === 'Delivered') return `<span class="text-indigo-300 opacity-30">${icons.box}</span> <span class="text-blue-300 opacity-30">${icons.truck}</span> <span class="text-green-600">${icons.check}</span>`;
    if (status === 'Cancelled' || status === 'Canceled' || status === 'Payment Failed') return `<span class="text-red-500">${icons.cancel}</span>`;
    return '';
}

function renderPickList(order, templatesCache, productsCache) {
    const rawList = {};

    order.items.forEach(item => {
        const template = templatesCache.find(t => t.name === item.name);

        if (template && template.items && template.items.length > 0) {
            template.items.forEach(subItem => {
                const product = productsCache.find(p => p.id === subItem.product_id);
                const pName = product ? product.name : (subItem.name || 'Unknown Product');
                const totalQty = (subItem.qty || 1) * item.qty;
                rawList[pName] = (rawList[pName] || 0) + totalQty;
            });
        } else {
            rawList[item.name] = (rawList[item.name] || 0) + item.qty;
        }
    });

    const sortedNames = Object.keys(rawList).sort();
    if (sortedNames.length === 0) return '';

    return `
        <div class="mt-8 pt-6 border-t border-gray-100">
            <h4 class="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2 mb-4">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Packing Pick List
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                ${sortedNames.map(name => `
                    <div class="flex items-center justify-between text-sm group">
                        <span class="text-gray-700 font-medium group-hover:text-emerald-700 transition-colors">${name}</span>
                        <span class="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-100 shadow-sm">${rawList[name]}x</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderOrderStepper(status) {
    const stages = ['Paid', 'Packed', 'Shipped', 'Delivered'];
    // Map status aliases
    let current = status;
    if (current === 'Pending' || current === 'Pending Payment') current = 'Pending';

    // Determine active index
    let activeIdx = stages.indexOf(current);
    if (activeIdx === -1) {
        if (current === 'Pending') activeIdx = -1; // Before start
    }

    // Special: if Canceled, show red style
    const isCanceled = (status === 'Canceled' || status === 'Cancelled');

    return `
        <div class="mb-6 px-2">
            <div class="flex items-center justify-between relative">
                <!-- Track -->
                <div class="absolute left-0 top-3 transform w-full h-0.5 bg-gray-100 -z-10"></div>
                
                ${stages.map((stage, idx) => {
        let circleClass = 'bg-white text-gray-300 border-gray-200';
        let textClass = 'text-gray-300';
        let completed = idx <= activeIdx;

        if (completed && !isCanceled) {
            circleClass = 'bg-emerald-500 text-white border-emerald-500 shadow-sm';
            textClass = 'text-emerald-600 font-bold';
        } else if (completed && isCanceled) {
            circleClass = 'bg-gray-300 text-white border-gray-300';
            textClass = 'text-gray-400 font-medium line-through';
        }


        return `
                        <div class="flex flex-col items-center group cursor-default">
                             <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${circleClass} mb-2 transition-all z-10">
                                ${completed ? `
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                ` : (idx + 1)}
                             </div>
                             <span class="text-[9px] uppercase tracking-wider font-semibold ${textClass}">${stage}</span>
                        </div>
                    `;
    }).join('')}
            </div>
            ${isCanceled ? `<div class="mt-3 text-center text-xs font-bold text-red-500 bg-red-50 py-1.5 rounded border border-red-100 shadow-sm w-full">⛔ ORDER HAS BEEN CANCELED</div>` : ''}
        </div>
    `;
}

function renderOrderDetails(o, street, city, zip, window, isTerminal, templatesCache, productsCache) {
    return `
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 relative overflow-hidden">
            <!-- Decorative BG -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>

            <!-- ITEMS COLUMN -->
            <div class="md:col-span-2 space-y-4">
                <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                    <h4 class="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        Items Ordered
                    </h4>
                    <span class="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">${o.items.length} Item${o.items.length !== 1 ? 's' : ''}</span>
                </div>
                
                <div class="space-y-3">
                    ${o.items.map(i => `
                        <div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                            <div class="flex items-center gap-3">
                                <span class="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">${i.qty}x</span>
                                <span class="font-medium text-gray-800 text-sm">${i.name}</span>
                            </div>
                            <span class="font-mono text-sm font-semibold text-gray-600">${formatCurrency(i.price * i.qty)}</span>
                        </div>
                    `).join('')}
                </div>
                
                 <div class="flex justify-end pt-2">
                    <div class="text-xs text-gray-500 uppercase font-semibold mr-3 mt-1">Total</div>
                    <div class="text-xl font-black text-gray-900">${formatCurrency(o.total)}</div>
                 </div>

                 <!-- PICK LIST -->
                 ${renderPickList(o, templatesCache, productsCache)}
            </div>

            <!-- ACTIONS / SHIPPING COLUMN -->
            <div class="space-y-6">
                
                ${renderOrderStepper(o.status)}

                <!-- Next Action -->
                ${(() => {
            const btnBase = "w-full flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-bold rounded-xl shadow-md transform transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2";
            if (o.status === 'Paid') {
                return `
                        <div class="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <h4 class="font-bold text-emerald-800 text-xs uppercase tracking-wider mb-3">Next Step</h4>
                            <button onclick="window.ordersController.quickUpdateStatus('${o.id}', 'Packed')" class="${btnBase} bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500 border-2 border-transparent">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                Mark as Packed
                            </button>
                        </div>`;
            } else if (o.status === 'Packed') {
                return `
                        <div class="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 shadow-sm">
                            <h4 class="font-bold text-blue-800 text-xs uppercase tracking-wider mb-3">Next Step</h4>
                            <button onclick="window.ordersController.quickUpdateStatus('${o.id}', 'Shipped')" class="${btnBase} bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 border-2 border-transparent">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                Mark as Shipped
                            </button>
                        </div>`;
            } else if (o.status === 'Shipped') {
                return `
                        <div class="bg-gradient-to-br from-teal-50 to-white p-4 rounded-xl border border-teal-100 shadow-sm">
                            <h4 class="font-bold text-teal-800 text-xs uppercase tracking-wider mb-3">Next Step</h4>
                            <button onclick="window.ordersController.quickUpdateStatus('${o.id}', 'Delivered')" class="${btnBase} bg-teal-500 hover:bg-teal-600 focus:ring-teal-500 border-2 border-transparent">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                Mark as Delivered
                            </button>
                        </div>`;
            }
            return '';
        })()}

                <!-- Management Tools -->
                <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Order Management</h4>
                    </div>
                    
                    <button onclick="window.ordersController.openEditOrderModal('${o.id}')" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-all mb-2">
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        Edit Details / Status
                    </button>

                    ${o.status === 'Pending Payment' ? `
                        <button id="sync-btn-${o.id}" onclick="window.ordersController.syncPayment('${o.id}')" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-sm font-medium rounded-lg transition-all mb-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Check Payment Status
                        </button>
                    ` : ''}

                    ${!isTerminal ? `
                        <button onclick="window.ordersController.openDateModal('${o.id}')" class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-all mb-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            Reschedule Delivery
                        </button>
                    ` : ''}

                    <!-- Danger Zone -->
                    ${!['Canceled', 'Cancelled', 'Delivered'].includes(o.status) ? `
                        <div class="border-t border-gray-100 mt-3 pt-3">
                             <button onclick="if(confirm('Are you sure you want to CANCEL this order? This cannot be undone.')) window.ordersController.quickUpdateStatus('${o.id}', 'Canceled')" class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold rounded transition-colors">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Cancel Order
                            </button>
                        </div>
                    ` : ''}
                </div>


                <!-- Info Grid: Delivery + Timeline -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
                    <!-- Delivery Info -->
                    <div class="bg-gray-50 rounded-xl p-3 border border-gray-100 h-full">
                        <h4 class="font-bold text-gray-500 text-[10px] uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">Delivery Info</h4>
                        <div class="text-xs text-gray-600">
                            <div class="font-bold text-gray-900 mb-1 text-sm">${o.shipping_details?.name || 'Guest'}</div>
                            <div class="leading-relaxed text-gray-500">
                                ${street}<br>
                                ${city}, ${zip}
                            </div>
                        </div>
                    </div>

                    <!-- Timeline -->
                    ${renderStatusLog(o)}
                </div>

            </div>
        </div>
    `;
}

function renderStatusLog(o) {
    const events = [];
    const stages = {
        'Order Placed': 1,
        'Payment Received': 2,
        'Order Packed': 3,
        'Order Shipped': 4,
        'Order Delivered': 5,
        'Order Canceled': 6,
        'Order Refunded': 7,
        'Payment Failed': 8
    };

    // 1. Placed (Always first)
    if (o.created_at || o.date) {
        events.push({
            status: 'Order Placed',
            date: new Date(o.created_at || o.date),
            color: 'text-gray-600',
            bg: 'bg-gray-400'
        });
    }

    // 2. Paid
    if (o.status !== 'Pending' && o.status !== 'Pending Payment') {
        events.push({
            status: 'Payment Received',
            date: new Date(o.created_at || o.date), // Technically same time usually
            color: 'text-blue-600',
            bg: 'bg-blue-500'
        });
    }

    if (o.packed_at) events.push({ status: 'Order Packed', date: new Date(o.packed_at), color: 'text-purple-600', bg: 'bg-purple-500' });
    if (o.shipped_at) events.push({ status: 'Order Shipped', date: new Date(o.shipped_at), color: 'text-indigo-600', bg: 'bg-indigo-500' });
    if (o.delivered_at) events.push({ status: 'Order Delivered', date: new Date(o.delivered_at), color: 'text-emerald-600', bg: 'bg-emerald-500' });

    if (o.cancelled_at) events.push({ status: 'Order Canceled', date: new Date(o.cancelled_at), color: 'text-red-600', bg: 'bg-red-500' });
    if (o.status === 'Refunded') events.push({ status: 'Order Refunded', date: new Date(o.date), color: 'text-orange-600', bg: 'bg-orange-500' });
    if (o.status === 'Payment Failed') events.push({ status: 'Payment Failed', date: new Date(o.date), color: 'text-red-600', bg: 'bg-red-500', isError: true });

    // SORT: Precedence First, then Chronological
    events.sort((a, b) => {
        const stageA = stages[a.status] || 99;
        const stageB = stages[b.status] || 99;
        if (stageA !== stageB) return stageA - stageB;
        return a.date - b.date;
    });

    const validEvents = events.filter(e => !isNaN(e.date));

    return `
       <div class="bg-white rounded-xl p-3 border border-gray-100 h-full shadow-sm">
           <h4 class="font-bold text-gray-500 text-[10px] uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Timeline</h4>
           <div class="space-y-3 relative pl-1.5 ml-1 border-l border-gray-100 mt-2">
               ${validEvents.map((e, idx) => `
                   <div class="relative pl-3">
                       <div class="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full ${e.bg} ring-2 ring-white"></div>
                       <p class="text-[10px] font-bold ${e.isError ? 'text-red-600' : 'text-gray-700'} leading-none">${e.status}</p>
                       <p class="text-[9px] text-gray-400 mt-0.5 font-mono">
                           ${e.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })} 
                           ${e.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                       </p>
                   </div>
               `).join('')}
           </div>
       </div>
   `;
}

export function renderOrdersTable(orders, templatesCache, productsCache, activeSearch) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">No orders found matching "${activeSearch}".</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const shipping = o.shipping_details || {};
        const isTerminal = ['Delivered', 'Shipped', 'Canceled', 'Cancelled'].includes(o.status);

        let street = shipping.street || (shipping.shipping ? shipping.shipping.street : 'N/A');
        let city = shipping.city || (shipping.shipping ? shipping.shipping.city : '');
        let state = shipping.state || (shipping.shipping ? shipping.shipping.state : '');
        let zip = shipping.zip || (shipping.shipping ? shipping.shipping.zip : '');
        let window = shipping.delivery_window || 'Unscheduled';

        let name = shipping.name || (o.billing_details ? o.billing_details.name : null) || 'Guest';
        if (name === 'undefined undefined') name = 'Guest';
        const email = o.userEmail || '';

        let shipDateDisplay = 'Pending Schedule';

        if (o.status === 'Delivered' && o.delivered_at) shipDateDisplay = `Delivered: ${formatDate(o.delivered_at)}`;
        else if (o.status === 'Shipped' && o.shipped_at) shipDateDisplay = `Shipped: ${formatDate(o.shipped_at)}`;
        else if (o.status === 'Packed') shipDateDisplay = 'Packed (Ready)';
        else if (o.status === 'Canceled' || o.status === 'Cancelled') shipDateDisplay = 'Canceled';
        else if (window !== 'Unscheduled') shipDateDisplay = `Scheduled: ${window}`;

        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const colors = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-violet-100 text-violet-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600'];
        const colorClass = colors[name.charCodeAt(0) % colors.length];

        const statusColors = {
            'Pending Payment': 'bg-amber-100 text-amber-800 border-amber-200',
            'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
            'Payment Failed': 'bg-red-100 text-red-800 border-red-200',
            'Paid': 'bg-green-100 text-green-800 border-green-200',
            'Packed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
            'Shipped': 'bg-blue-100 text-blue-800 border-blue-200',
            'Delivered': 'bg-slate-100 text-slate-800 border-slate-200',
            'Canceled': 'bg-red-100 text-red-800 border-red-200',
            'Cancelled': 'bg-red-100 text-red-800 border-red-200'
        };
        const statusClass = statusColors[o.status] || 'bg-gray-100 text-gray-800 border-gray-200';

        return `
        <tr class="hover:bg-blue-50/50 border-b border-gray-100 cursor-pointer transition-all group" onclick="window.ordersController.toggleOrderDetails('${o.id}')">
            <td class="p-4 align-middle">
                <span class="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                    #${String(o.id).slice(0, 8)}
                </span>
            </td>
            <td class="p-4 align-middle text-sm text-gray-500 font-medium whitespace-nowrap">
                ${formatDate(o.date)}
            </td>
            <td class="p-4 align-middle">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-white">
                        ${initials}
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-gray-900">${name}</div>
                        <div class="text-xs text-gray-400 font-mono">${email}</div>
                    </div>
                </div>
            </td>
            <td class="p-4 align-middle">
                <div class="flex flex-col gap-1">
                    <div class="flex flex-col">
                        <span class="text-sm text-gray-700 font-medium leading-tight">${street}</span>
                         <span class="text-xs text-gray-500 font-normal">${city}${state ? `, ${state}` : ''} ${zip}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                         <span class="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">${shipDateDisplay}</span>
                    </div>
                </div>
            </td>
            <td class="p-4 align-middle">
                <div class="flex flex-col items-start gap-1">
                     <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusClass} inline-flex items-center gap-1">
                        ${o.status}
                    </span>
                    <div class="flex items-center gap-1 opacity-60 pl-0.5">
                         ${getStatusIcons(o.status)}
                    </div>
                </div>
            </td>
            <td class="p-4 align-middle text-right">
                <span class="font-bold text-gray-900">${formatCurrency(o.total)}</span>
            </td>
        </tr>
        <tr id="details-${o.id}" class="hidden bg-gray-50/50 border-b border-gray-100 shadow-inner">
            <td colspan="6" class="p-0">
                ${renderOrderDetails(o, street, city, zip, window, isTerminal, templatesCache, productsCache)}
            </td>
        </tr>
        `;
    }).join('');
}

export function renderEditModalItems(items) {
    const tbody = document.getElementById('oe-items-body');
    if (!tbody) return;

    tbody.innerHTML = items.map((item, idx) => `
        <tr class="border-b border-gray-100 last:border-0">
            <td class="p-3 font-medium text-gray-800">${item.name}</td>
            <td class="p-3">
                <input type="number" min="1" value="${item.qty}" 
                    onchange="window.ordersController.updateOrderItemQty(${idx}, this.value)"
                    class="w-16 border rounded px-2 py-1 text-sm text-center">
            </td>
            <td class="p-3 text-right text-gray-600">${formatCurrency(item.price)}</td>
            <td class="p-3 text-right">
                <button onclick="window.ordersController.removeOrderItem(${idx})" class="text-red-500 hover:text-red-700 font-bold">&times;</button>
            </td>
        </tr>
        `).join('');
}

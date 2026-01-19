/**
 * Logistics Map UI Logic
 * Handles rendering of the split-pane map view (Concept 12)
 */

export const mapUI = {
    // ------------------------------------------------------------------------
    // MOCK GEOMETRY (Fake Lat/Lng for Prototype)
    // In real app, this would come from geocoding shipping_details
    // ------------------------------------------------------------------------
    generateMockCoords(id) {
        // Deterministic pseudo-random based on ID
        const strId = String(id);
        const seed = strId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const lat = (seed % 60) + 20; // 20-80% top
        const lng = (seed % 70) + 10; // 10-80% left
        return { lat, lng };
    },

    // ------------------------------------------------------------------------
    // RENDER MARKERS (Fake Map Projection)
    // ------------------------------------------------------------------------
    renderMapMarkers(orders) {
        const container = document.getElementById('map-markers');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-sm">No orders to map.</div>`;
            return;
        }

        // We use percentage-based positioning for the fake map
        // In real implementations, this would interact with a Leaflet/Mapbox instance
        const html = orders.map((o, idx) => {
            const coords = this.generateMockCoords(o.id);
            const statusColor = getStatusColorClass(o.status);
            const isPending = o.status === 'Pending' || o.status === 'Pending Payment';

            // Name resolution
            const shipping = o.shipping_details || {};
            const name = shipping.name || (o.billing_details ? o.billing_details.name : null) || (o.customer ? o.customer.name : null) || 'Guest';

            return `
                <div id="marker-${o.id}" 
                     class="absolute transform -translate-x-1/2 -translate-y-full hover:z-50 cursor-pointer group transition-all duration-300" 
                     style="left: ${coords.lng}%; top: ${coords.lat}%"
                     onclick="window.selectOrder('${o.id}')">
                    
                    <div class="relative">
                        <!-- Pin Icon -->
                        <div class="transform transition-transform group-hover:scale-125 duration-200">
                             <svg class="w-8 h-8 ${statusColor} drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></svg>
                        </div>
                        
                        <!-- Tooltip -->
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white px-3 py-2 rounded-lg shadow-xl border border-gray-100 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[120px]">
                            <div class="font-bold text-gray-800">${name}</div>
                            <div class="text-[10px] text-gray-500 font-mono mb-1">#${o.id}</div>
                            <div class="flex items-center gap-1 mt-1">
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">${o.status}</span>
                            </div>
                            <!-- Arrow -->
                            <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-white transform rotate-45 border-b border-r border-gray-100"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    // ------------------------------------------------------------------------
    // RENDER SIDEBAR LIST (Syncs with Map)
    // ------------------------------------------------------------------------
    renderMapList(orders) {
        const container = document.getElementById('map-order-list');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-gray-400 text-sm">No orders found.</div>`;
            return;
        }

        container.innerHTML = orders.map((o, idx) => {
            const shipping = o.shipping_details || {};
            const name = shipping.name || (o.billing_details ? o.billing_details.name : null) || (o.customer ? o.customer.name : null) || 'Guest';
            const street = shipping.street || (shipping.shipping ? shipping.shipping.street : 'Address hidden');

            const statusClass = getStatusBadgeClass(o.status);

            return `
                <div class="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group relative" 
                     onclick="window.selectOrder('${o.id}')"
                     onmouseenter="highlightMarker('${o.id}')" 
                     onmouseleave="unhighlightMarker('${o.id}')">
                    
                    <div class="flex justify-between items-start mb-1">
                        <span class="font-bold text-sm text-gray-800 truncate pr-2">${name}</span>
                        <span class="${statusClass}">${o.status}</span>
                    </div>
                    
                    <div class="text-xs text-gray-500 flex items-center gap-1 truncate font-mono">
                        <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> 
                        ${street}
                    </div>
                </div>
            `;
        }).join('');
    },
};

// ------------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------------

function getStatusColorClass(status) {
    if (status === 'Pending' || status === 'Pending Payment') return 'text-blue-600';
    if (status === 'Paid') return 'text-emerald-500';
    if (status === 'Packed') return 'text-indigo-500';
    if (status === 'Shipped') return 'text-purple-500';
    if (status === 'Delivered') return 'text-gray-400';
    if (status === 'Canceled') return 'text-red-500';
    return 'text-gray-400';
}

function getStatusBadgeClass(status) {
    if (status === 'Pending' || status === 'Pending Payment') return 'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700';
    if (status === 'Paid') return 'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700';
    if (status === 'Packed') return 'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700';
    if (status === 'Shipped') return 'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700';
    if (status === 'Delivered') return 'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600';
    if (status === 'Canceled') return 'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600';
    return 'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500';
}

// ------------------------------------------------------------------------
// GLOBAL INTERACTION HANDLERS (Highlight Linkage)
// ------------------------------------------------------------------------

window.highlightMarker = (id) => {
    const el = document.getElementById(`marker-${id}`);
    if (el) {
        el.classList.add('z-50', 'scale-110');
        const icon = el.querySelector('svg');
        if (icon) icon.classList.add('text-red-500');
    }
}

window.unhighlightMarker = (id) => {
    const el = document.getElementById(`marker-${id}`);
    if (el) {
        el.classList.remove('z-50', 'scale-110');
        const icon = el.querySelector('svg');
        if (icon) icon.classList.remove('text-red-500');
    }
}

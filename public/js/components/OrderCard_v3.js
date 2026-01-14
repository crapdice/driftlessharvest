
export function OrderCard(o) {
    const statusConfig = {
        'Pending': { label: 'Received', style: 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20', desc: 'We have received your order.' },
        'Pending Payment': { label: 'Processing', style: 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20', desc: 'Securely confirming payment...' },
        'Paid': { label: 'Paid', style: 'bg-indigo-50 text-indigo-700 border-indigo-100', desc: 'Payment secured. Preparing your harvest.' },
        'Packed': { label: 'Packed', style: 'bg-purple-50 text-purple-700 border-purple-100', desc: 'Your box is packed and ready.' },
        'Shipped': { label: 'On its Way', style: 'bg-indigo-50 text-indigo-700 border-indigo-100', desc: 'Your box has left the farm.' },
        'Delivered': { label: 'Delivered', style: 'bg-nature-100 text-nature-800 border-nature-200', desc: 'Enjoy your harvest!' },
        'Canceled': { label: 'Canceled', style: 'bg-red-50 text-red-600 border-red-100', desc: 'This order was canceled.' },
        'Payment Failed': { label: 'Payment Failed', style: 'bg-red-50 text-red-600 border-red-100', desc: 'Payment could not be processed.' }
    };

    // Aggregate items
    const counts = {};
    o.items.forEach(i => {
        const key = i.name; // Simple aggregation
        counts[key] = counts[key] || { ...i, qty: 0 };
        counts[key].qty++;
    });
    const aggregatedItems = Object.values(counts);

    // Detailed Shipping
    const ship = o.shipping || {};
    const streetLine = ship.street || ship.address;
    const addressString = [
        streetLine,
        ship.city ? `${ship.city}, ${ship.state || 'WI'} ${ship.zip || ''}` : null
    ].filter(Boolean).join('<br>');

    let statusInfo = statusConfig[o.status] || { label: o.status, style: 'bg-stone-100 text-stone-500' };

    // Dynamic override for Pending to show Delivery Date
    if (o.status === 'Pending' || o.status === 'Paid') {
        const deliveryDate = ship.date;
        statusInfo = {
            ...statusInfo,
            desc: deliveryDate ? `Expected on ${deliveryDate}` : statusInfo.desc
        };
    }

    const verifyBtn = o.status === 'Pending Payment'
        ? `<button onclick="window.verifyOrderPayment(${o.id})" class="mt-2 text-xs font-bold text-nature-900 underline hover:text-harvest-gold">Check Status</button>`
        : '';

    return `
    <div class="bg-white border border-nature-100 rounded-lg p-0 shadow-sm relative group overflow-hidden">
        <!-- Left accent line -->
        <div class="absolute top-0 left-0 w-1 h-full bg-nature-900 transition-colors"></div>

        <!-- Header -->
        <div class="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start gap-4 bg-stone-50/50 border-b border-stone-100">
            <div>
                 <div class="flex items-center gap-3 mb-2">
                     <span class="font-mono text-xs text-nature-400">#${o.id.toString().substring(0, 8)}</span>
                     <span class="h-px w-8 bg-nature-200"></span>
                     <span class="font-sans text-xs font-bold uppercase tracking-widest text-nature-400">${new Date(o.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                 </div>
                 <h3 class="font-serif text-3xl text-nature-900 leading-none mb-1 transition-colors">${new Date(o.date).toLocaleDateString(undefined, { weekday: 'long' })}'s Harvest</h3>
            </div>

            <div class="text-right">
                <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusInfo.style}">
                    ${statusInfo.label}
                </span>
                <div class="text-xs text-stone-400 mt-1">${statusInfo.desc || ''}</div>
                ${verifyBtn}
            </div>
        </div>

        <!-- Items List -->
        <div class="px-6 md:px-8 py-8">
            <ul class="space-y-3 mb-8">
                ${aggregatedItems.map(i => `
                    <li class="flex justify-between items-baseline group/item text-sm">
                        <div class="flex items-baseline gap-2 flex-1">
                            <span class="font-mono text-nature-400 w-6 text-right font-bold">${i.qty}x</span>
                            <span class="text-nature-900 font-serif font-medium tracking-wide">${i.name}</span>
                            <span class="flex-1 border-b border-dotted border-nature-200 mx-2 relative top-[-4px]"></span>
                        </div>
                        <span class="font-mono text-nature-500 font-medium">$${(i.price * i.qty).toFixed(2)}</span>
                    </li>
                `).join('')}
            </ul>

            <!-- Footer -->
            <div class="flex flex-col md:flex-row justify-between items-start gap-6 pt-6 border-t border-stone-100">
                 <!-- Main Details Grid -->
                 <div class="grid grid-cols-2 gap-12 w-full max-w-lg">
                    <!-- Deliver To -->
                    <div>
                        <div class="text-[10px] uppercase tracking-widest font-bold text-nature-400 mb-2">Deliver To</div>
                        <div class="text-nature-600 text-sm leading-relaxed font-sans">
                            <div class="text-nature-900 mb-1">${ship.name || 'Current Resident'}</div>
                            ${addressString || 'Pick up at Viroqua Food Co-op'}
                        </div>
                    </div>
                    
                    <!-- Deliver By -->
                    <div>
                         <div class="text-[10px] uppercase tracking-widest font-bold text-nature-400 mb-2">Deliver By</div>
                         <div class="text-nature-900 text-sm font-sans">
                            ${ship.delivery_window || ship.date || 'Standard'}
                         </div>
                    </div>
                 </div>
                 
                 <!-- Price -->
                 <div class="text-right whitespace-nowrap">
                    <div class="text-[10px] uppercase tracking-widest font-bold text-nature-400 mb-2">Total</div>
                    <div class="text-3xl font-serif text-nature-900 font-bold">$${o.total.toFixed(2)}</div>
                 </div>
            </div>
        </div>
    </div>
    `;
}

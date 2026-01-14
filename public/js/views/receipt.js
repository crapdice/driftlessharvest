
export function renderReceipt(items, total = 0) {
    const configName = window.CONFIG?.businessName || 'DRIFTLESS HARVEST';
    const businessName = configName.toUpperCase().endsWith(' MARKET')
        ? configName.toUpperCase()
        : `${configName.toUpperCase()} MARKET`;

    return `
            <div class="bg-white p-8 rounded-sm shadow-lg border-t-8 border-kale sticky top-24 font-mono text-sm relative">
                <!-- Receipt Header -->
                <div class="text-center mb-6 pb-6 border-b-2 border-dashed border-stone-300">
                    <div class="text-2xl font-bold text-charcoal mb-2 tracking-wider">${businessName}</div>
                    <div class="text-stone-500 uppercase text-xs tracking-widest">Fresh From Viroqua</div>
                    <div class="text-stone-400 text-xs mt-1">${new Date().toLocaleDateString()} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>

                <!-- Items -->
                <ul class="space-y-4 mb-6">
                    ${items.map(item => `
                        <li class="flex justify-between items-start">
                            <span class="text-charcoal uppercase max-w-[70%] leading-relaxed">
                                ${item.qty} x ${item.name}
                                ${item.type === 'box' ? '<span class="block text-[10px] text-stone-400 pl-2 opacity-75">* Curated Selection</span>' : ''}
                            </span>
                            <span class="text-charcoal font-bold">$${(item.price * item.qty).toFixed(2)}</span>
                        </li>
                    `).join('')}
                </ul>

                <!-- Totals -->
                <div class="border-t-2 border-dashed border-stone-300 pt-6 space-y-2 mb-8">
                    <div class="flex justify-between text-stone-500">
                        <span>Subtotal</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-stone-500">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                    </div>
                    <div class="flex justify-between text-xl font-bold text-charcoal pt-4 mt-2 border-t border-stone-100">
                        <span>TOTAL</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>

                <!-- Footer -->
                <div class="text-center text-xs text-stone-400 uppercase tracking-widest space-y-2">
                    <p>Thank you for supporting local farms</p>
                    <div class="w-2/3 mx-auto h-8 bg-stone-100 mt-4 overflow-hidden flex items-center justify-center opacity-50">
                        ||| ||| | || ||| || ||| |
                    </div>
                </div>
            </div>
    `;
}

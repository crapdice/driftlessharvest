import { formatCurrency } from '../modules/utils.js';

export function ActiveCarts(carts) {
    if (!carts || carts.length === 0) {
        return '<div class="col-span-full text-center py-12 text-gray-400">No active carts right now.</div>';
    }

    return carts.map((c, index) => {
        const itemCount = c.items.reduce((sum, i) => sum + i.qty, 0);
        const totalVal = c.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const timeStr = new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const boxes = c.items.filter(i => i.type === 'box').length;
        const products = c.items.filter(i => i.type !== 'box').length;
        const isEmpty = itemCount === 0;

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group" 
                 onclick="window.openCartModal(${index})"
                 role="button"
                 tabindex="0">
                <div class="flex justify-between items-start mb-3">
                    <div class="font-medium text-gray-800 text-sm truncate w-2/3" title="${c.email}">
                        ${c.email}
                    </div>
                    <div class="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        ${timeStr}
                    </div>
                </div>
                
                <div class="flex items-center gap-2 mb-3">
                    ${boxes > 0 ? `<span class="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-medium border border-purple-200/50">${boxes} Box${boxes !== 1 ? 'es' : ''}</span>` : ''}
                    ${products > 0 ? `<span class="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium border border-blue-200/50">${products} Product${products !== 1 ? 's' : ''}</span>` : ''}
                    ${isEmpty ? '<span class="text-gray-400 text-xs bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Empty Cart</span>' : ''}
                </div>

                <div class="flex justify-between items-end border-t border-gray-50 pt-3 mt-auto group-hover:border-gray-100 transition-colors">
                    <span class="text-xs text-gray-400 font-medium">${itemCount} items</span>
                    <span class="text-sm font-bold text-gray-700 font-mono">${formatCurrency(totalVal)}</span>
                </div>
            </div>
        `;
    }).join('');
}

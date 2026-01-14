import { formatCurrency } from '../modules/utils.js';

export function CartItemRow(item) {
    return `
        <tr class="hover:bg-gray-50 group">
            <td class="py-3 pl-2">
                <div class="flex items-center gap-3">
                    <img src="${item.image_url || 'https://placehold.co/40'}" class="w-8 h-8 rounded object-cover bg-gray-100">
                    <div>
                        <div class="font-medium text-gray-900 line-clamp-1">${item.name}</div>
                        ${item.type === 'box' ? '<div class="text-xs text-purple-600">includes ' + (item.items ? item.items.length : 0) + ' items</div>' : ''}
                    </div>
                </div>
            </td>
            <td class="text-center py-3">
                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.type === 'box' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}">
                    ${item.category || item.type || 'Product'}
                </span>
            </td>
            <td class="text-center py-3 font-mono font-medium text-gray-700">${item.qty}</td>
            <td class="text-right py-3 font-mono text-gray-500">${formatCurrency(item.price)}</td>
            <td class="text-right py-3 pr-2 font-medium text-gray-900">${formatCurrency(item.price * item.qty)}</td>
        </tr>
    `;
}

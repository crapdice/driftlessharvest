export function SonarIndicator(stock) {
    const isLowStock = stock < 10;
    const isOutOfStock = stock === 0;

    let pingClass = '';
    let dotClass = 'bg-emerald-500';

    if (isOutOfStock) {
        pingClass = 'animate-ping bg-red-500';
        dotClass = 'bg-red-600';
    } else if (isLowStock) {
        pingClass = 'animate-ping bg-amber-400';
        dotClass = 'bg-amber-500';
    }

    // Returns HTML string for the indicator
    return `
        <div class="relative flex h-3 w-3">
            ${pingClass ? `<span class="${pingClass} absolute inline-flex h-full w-full rounded-full opacity-75"></span>` : ''}
            <span class="relative inline-flex rounded-full h-3 w-3 ${dotClass}"></span>
        </div>
    `;
}

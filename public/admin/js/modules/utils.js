/**
 * Admin Utility Functions
 */

export function formatCurrency(amount) {
    const val = parseFloat(amount) || 0;
    return '$' + val.toFixed(2);
}

export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${type === 'error' ? 'bg-red-500' : 'bg-green-600'}`;
    toast.innerHTML = `
        <span class="text-xl">${type === 'error' ? '⚠️' : '✅'}</span>
        <span class="font-medium">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function formatPhoneNumber(value) {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Phone input handler for admin forms
export function handleAdminPhoneInput(inputElement) {
    inputElement.value = formatPhoneNumber(inputElement.value);
}

// Make globally available
window.handleAdminPhoneInput = handleAdminPhoneInput;
window.showToast = showToast;
window.formatCurrency = formatCurrency;


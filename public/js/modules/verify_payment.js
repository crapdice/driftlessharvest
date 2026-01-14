export async function verifyOrderPayment(orderId) {
    const btn = event?.target;
    const originalText = btn ? btn.innerText : '';
    if (btn) {
        btn.innerText = 'Checking...';
        btn.disabled = true;
    }

    try {
        const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('harvest_token')}` }
        });
        const data = await res.json();

        if (data.success && data.status === 'Paid') {
            showToast('Payment confirmed! Updating status...');
            // Refresh Orders via dynamic import to avoid circular dependency issues if any
            import('./profile.js').then(m => m.loadUserOrders());
        } else {
            showToast(data.msg || 'Payment not yet confirmed by Stripe', 'info');
            if (btn) {
                btn.innerText = 'Check Again';
                btn.disabled = false;
            }
        }
    } catch (e) {
        console.error(e);
        showToast('Verification failed to connect', 'error');
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}
window.verifyOrderPayment = verifyOrderPayment;

/**
 * Shared logic for all Launching Soon designs
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Identify common elements
    const emailInput = document.querySelector('input[type="email"]');
    const submitBtn = document.querySelector('button');
    const variantName = window.LAUNCH_VARIANT || 'unknown';

    if (!emailInput || !submitBtn) return;

    // 2. Handle Submission
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        if (!email) {
            alert('Please enter your email address.');
            return;
        }

        // Disable UI
        emailInput.disabled = true;
        submitBtn.disabled = true;
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Signing up...';

        // 3. Capture Attribution [MARKETING SILO]
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source') || urlParams.get('source') || 'organic';

        try {
            const response = await fetch('/api/launch-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, variant: variantName, utm_source: utmSource })
            });

            const data = await response.json();

            if (response.ok) {
                // Success State - Replace form or show message
                const formContainer = emailInput.closest('form') || emailInput.parentElement;
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div class="p-6 bg-harvest-green/10 rounded-xl border border-harvest-green/20 text-center animate-fade-in">
                            <p class="text-lg font-bold">You're on the list! 🎉</p>
                            <p class="text-sm opacity-80">We'll let you know the second we're ready.</p>
                        </div>
                    `;
                } else {
                    alert('Success! You are on the waitlist.');
                }
            } else {
                throw new Error(data.error || 'Failed to sign up');
            }
        } catch (error) {
            console.error('Signup Error:', error);
            alert(error.message);
            // Re-enable UI
            emailInput.disabled = false;
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    // 3. Track A/B Exposure (Optional enhancement for future analytics)
    console.log(`[Launch] Exposure tracked for: ${variantName}`);
});

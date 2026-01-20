class StripeService {
    constructor() {
        this.client = null;
    }

    _init() {
        if (this.client) return;

        const key = (process.env.STRIPE_SECRET_KEY || '').trim();
        if (!key) return;

        try {
            this.client = require('stripe')(key);
        } catch (error) {
            console.error('[StripeService] Initialization Failed:', error.message);
        }
    }

    async testConnection() {
        this._init();

        if (!this.client) {
            throw new Error('Stripe Secret Key not configured in .env');
        }

        try {
            // Use balance.retrieve() as it is the most standard "ping" for both full and restricted keys
            const balance = await this.client.balance.retrieve();
            return {
                success: true,
                livemode: balance.livemode,
                msg: balance.livemode ? 'Live Key Detected' : 'Test Key Active'
            };
        } catch (error) {
            const key = (process.env.STRIPE_SECRET_KEY || '').trim();
            console.error('[StripeService] Test Connection Failed:', error.message);
            console.error(`[StripeService] Diagnostic Info: Key Length=${key.length}, Start=${key.substring(0, 7)}..., End=...${key.substring(key.length - 4)}`);

            // If the error message suggests a malformed key, provide more context
            if (error.message.includes('Invalid API Key') || error.message.includes('malformed')) {
                throw new Error(`Invalid Key Format: The key in your .env (length ${key.length}) is being rejected by Stripe. Keys should normally be ~32-40 characters. Yours is ${key.length}.`);
            }
            throw error;
        }
    }
}

module.exports = new StripeService();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

class ResendService {
    constructor() {
        this.apiKey = process.env.RESEND_API_KEY;
    }

    async testConnection() {
        if (!this.apiKey) {
            throw new Error('Resend API key not configured in .env');
        }

        try {
            // Use /emails instead of /api-keys because many keys are restricted to "sending only"
            const response = await fetch('https://api.resend.com/emails', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                // If it's a 401/403 but the message/name confirms it's a restricted key, that's still a "success" in terms of connectivity
                if ((response.status === 401 || response.status === 403) &&
                    (errorData.message?.includes('restricted') || errorData.name === 'restricted_api_key')) {
                    return { success: true, restricted: true };
                }
                throw new Error(errorData.message || `Resend API returned ${response.status}`);
            }

            const data = await response.json();
            return { success: true, count: data.data?.length || 0 };
        } catch (error) {
            console.error('[ResendService] Test Connection Failed:', error.message);
            throw error;
        }
    }
}

module.exports = new ResendService();

/**
 * GeminiService
 * 
 * Pure service for interacting with Gemini AI endpoints.
 * Handles prompt construction and API communication.
 */

class GeminiService {
    /**
     * Generates text content based on a prompt and context
     * @param {string} prompt 
     * @param {string} context 
     * @param {string} originalValue - User's current input for context
     * @returns {Promise<string>} - Generated text
     */
    async generateText(prompt, context, originalValue = '', imageSource = null) {
        const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                prompt,
                context: `${context}. Current Input/Keywords: "${originalValue}"`,
                imageSource
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        const data = await response.json();
        return data.text;
    }

    /**
     * Enhances an image using the Gemini backend
     * @param {string} imageSource - URL or base64 data
     * @param {string} type - 'product' or 'box'
     * @param {Object} contextData - Additional data (name, category, etc.)
     * @returns {Promise<Object>} - The enhanced image data (b64, mimeType, etc.)
     */
    async enhanceImage(imageSource, type, contextData = {}) {
        const response = await fetch('/api/gemini/enhance-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ imageSource, type, contextData })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Enhancement failed');
        return data;
    }
}

export const geminiService = new GeminiService();

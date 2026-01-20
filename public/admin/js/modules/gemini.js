import { showToast } from './utils.js';
import { geminiService } from '../services/GeminiService.js';

/**
 * Gemini AI Frontend Module
 * Binds GeminiService to the Admin UI
 */

/**
 * Generates content (name/description) for products and boxes
 * @param {string} targetId - ID of the input element to fill
 * @param {string} type - 'product_name', 'box_name', or 'box_description'
 */
export async function generateContent(targetId, type) {
    const input = document.getElementById(targetId);
    if (!input) return;

    const originalPlaceholder = input.placeholder;
    const originalValue = input.value;
    input.value = '';
    input.placeholder = '✨ Generative Magic in progress...';
    input.disabled = true;
    document.body.style.cursor = 'wait';

    try {
        let prompt = '';
        let context = '';

        // Identify if there's an image to look at
        let imageSource = null;
        if (type.includes('product')) {
            imageSource = document.getElementById('p-image')?.value || document.getElementById('p-preview-img')?.src;
        } else {
            imageSource = document.getElementById('t-image')?.value || document.getElementById('t-preview-img')?.src;
        }

        // Don't pass placeholders
        if (imageSource && (imageSource.includes('placeholder') || imageSource.includes('placehold.co'))) {
            imageSource = null;
        }

        if (type === 'product_name') {
            const category = document.getElementById('p-category')?.value || 'General';
            context = `Product Category: ${category}`;
            prompt = `Analyze the image and generate 3 short, creative names for this local food product. 
            Output ONLY the names, one per line. No intro, no descriptions, no explanations.`;
        } else if (type === 'box_name') {
            prompt = `Analyze the image and generate 3 creative names for this curated food box. 
            Output ONLY the names, one per line. No intro, no explanations. 
            Keep names under 4 words.`;
        } else if (type === 'box_description') {
            const boxName = document.getElementById('t-name')?.value || 'this box';
            context = `Box Name: ${boxName}`;
            prompt = `As a warm and sophisticated copywriter, analyze the attached image (if provided) and write a short, appetizing, and inviting description (exactly 1-2 sentences) for this premium food subscription box. 
            Focus on the freshness and quality seen in the image, the joy of discovery, and the connection to local farmers.`;
        }

        const text = await geminiService.generateText(prompt, context, originalValue, imageSource);
        if (!text) throw new Error('No text generated');

        if (type === 'box_description') {
            input.value = text.trim();
        } else {
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            if (lines.length > 1) {
                showChoiceModal(input, lines);
            } else {
                input.value = text.replace(/["*]/g, '').trim();
            }
        }
    } catch (error) {
        console.error('Gemini Generation Error:', error);
        showToast('Failed to generate content: ' + error.message, 'error');
        input.value = originalValue;
    } finally {
        input.placeholder = originalPlaceholder;
        input.disabled = false;
        document.body.style.cursor = 'default';
        if (input.value === '') input.value = originalValue;
    }
}

/**
 * Enhances an image using the Gemini backend
 * @param {string} imageSource - URL or base64 data
 * @param {string} type - 'product' or 'box'
 * @param {Object} contextData - Additional data (name, category, etc.)
 * @returns {Promise<Object>} - The enhanced image data
 */
export async function enhanceImageAction(imageSource, type, contextData = {}) {
    try {
        return await geminiService.enhanceImage(imageSource, type, contextData);
    } catch (error) {
        console.error('Gemini Enhancement UI Error:', error);
        showToast('Image enhancement failed: ' + error.message, 'error');
        throw error;
    }
}

/**
 * UI Helper: Shows a modal for choosing between multiple AI options
 */
export function showChoiceModal(inputElement, choices) {
    const existing = document.getElementById('gemini-choice-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'gemini-choice-modal';
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm';

    let choicesHtml = choices.map(choice => {
        const cleanChoice = choice.replace(/^\d+[\.|)]\s*/, '').replace(/["*]/g, '').trim();
        return `
            <button onclick="applyGeminiChoice('${inputElement.id}', '${cleanChoice.replace(/'/g, "\\'")}')" 
                class="w-full text-left px-4 py-3 hover:bg-purple-50 hover:text-purple-700 transition-colors border-b border-gray-100 last:border-0 font-medium">
                ${cleanChoice}
            </button>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up transform transition-all">
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex justify-between items-center text-white">
                <h3 class="font-bold flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214L13 3z"></path></svg>
                    Choose an Option
                </h3>
                <button onclick="document.getElementById('gemini-choice-modal').remove()" class="hover:bg-white/20 rounded-full p-1 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="max-h-[60vh] overflow-y-auto">
                ${choicesHtml}
            </div>
            <div class="bg-gray-50 px-6 py-3 text-xs text-gray-500 text-center">
                AI Generated Content
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * UI Helper: Applies a choice to an input element
 */
export function applyGeminiChoice(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const modal = document.getElementById('gemini-choice-modal');
    if (modal) modal.remove();
}

// Global attach for onclick handlers
if (typeof window !== 'undefined') {
    window.generateContent = generateContent;
    window.applyGeminiChoice = applyGeminiChoice;
}

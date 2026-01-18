/**
 * ConfirmModal - Confirmation Dialog for Dangerous Actions
 * 
 * Extends base Modal for yes/no confirmations
 */

import { Modal } from './Modal.js';

export class ConfirmModal extends Modal {
    constructor(options = {}) {
        super({
            ...options,
            size: 'sm',
            closeOnOverlay: options.closeOnOverlay ?? false // Force explicit choice
        });

        this.message = options.message || 'Are you sure?';
        this.confirmText = options.confirmText || 'Confirm';
        this.cancelText = options.cancelText || 'Cancel';
        this.danger = options.danger || false;
        this.icon = options.icon || '⚠️';
    }

    /**
     * Show confirmation and return promise
     */
    async confirm() {
        return new Promise((resolve) => {
            // Set content
            const contentHtml = `
                <div class="p-6">
                    <div class="flex gap-4 items-start">
                        <div class="text-4xl">${this.icon}</div>
                        <div class="flex-1">
                            <p class="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                ${this.message}
                            </p>
                        </div>
                    </div>
                </div>
            `;
            this.setContent(contentHtml);

            // Set footer
            const footerHtml = `
                <div class="flex justify-end gap-3">
                    <button class="btn-cancel px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                        ${this.cancelText}
                    </button>
                    <button class="btn-confirm px-4 py-2 ${this.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors">
                        ${this.confirmText}
                    </button>
                </div>
            `;
            this.setFooter(footerHtml);

            // Attach handlers
            const cancelBtn = this.element.querySelector('.btn-cancel');
            const confirmBtn = this.element.querySelector('.btn-confirm');

            const handleCancel = () => {
                this.close();
                resolve(false);
            };

            const handleConfirm = () => {
                this.close();
                resolve(true);
            };

            cancelBtn.addEventListener('click', handleCancel);
            confirmBtn.addEventListener('click', handleConfirm);

            // Open modal
            this.open();
        });
    }
}

/**
 * Quick confirm helper function
 */
export async function confirm(message, options = {}) {
    const modal = new ConfirmModal({
        title: options.title || 'Confirmation',
        message,
        ...options
    });

    return await modal.confirm();
}

// Make globally available
window.ConfirmModal = ConfirmModal;
window.confirm = confirm;

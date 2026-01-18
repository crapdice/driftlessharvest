/**
 * Modal - Universal Base Modal Component
 * 
 * Standardized modal implementation to replace 3+ different patterns.
 * Provides consistent behavior, accessibility, and theme support.
 */

export class Modal {
    constructor(options = {}) {
        this.id = options.id || `modal-${Date.now()}`;
        this.title = options.title || '';
        this.size = options.size || 'md'; // sm, md, lg, xl, full
        this.closeOnOverlay = options.closeOnOverlay ?? true;
        this.closeOnEscape = options.closeOnEscape ?? true;
        this.showCloseButton = options.showCloseButton ?? true;

        // Lifecycle hooks
        this.onOpen = options.onOpen || (() => { });
        this.onClose = options.onClose || (() => { });

        this.element = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        this.element = this.createModal();
        document.body.appendChild(this.element);
        this.attachEventListeners();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = this.id;
        modal.className = 'modal-overlay hidden fixed inset-0 bg-black/50 items-center justify-center z-50 backdrop-blur-sm';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${this.id}-title`);

        modal.innerHTML = `
            <div class="modal-panel bg-white dark:bg-gray-800 rounded-xl shadow-2xl ${this.getSizeClass()} max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
                ${this.renderHeader()}
                <div class="modal-body overflow-y-auto"></div>
                ${this.renderFooter()}
            </div>
        `;

        return modal;
    }

    renderHeader() {
        if (!this.title && !this.showCloseButton) return '';

        return `
            <div class="modal-header sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
                <h3 id="${this.id}-title" class="text-xl font-bold text-gray-900 dark:text-white">${this.title}</h3>
                ${this.showCloseButton ? `
                    <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Close modal">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
    }

    renderFooter() {
        return `
            <div class="modal-footer sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 z-10"></div>
        `;
    }

    getSizeClass() {
        const sizes = {
            sm: 'w-full max-w-md',
            md: 'w-full max-w-2xl',
            lg: 'w-full max-w-4xl',
            xl: 'w-full max-w-6xl',
            full: 'w-full max-w-[95vw]'
        };
        return sizes[this.size] || sizes.md;
    }

    attachEventListeners() {
        // Close button
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Overlay click
        if (this.closeOnOverlay) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) this.close();
            });
        }

        // Escape key
        if (this.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) this.close();
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
    }

    setContent(content) {
        const body = this.element.querySelector('.modal-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.innerHTML = '';
            body.appendChild(content);
        }
    }

    setFooter(content) {
        const footer = this.element.querySelector('.modal-footer');
        if (typeof content === 'string') {
            footer.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            footer.innerHTML = '';
            footer.appendChild(content);
        }
    }

    open() {
        this.element.classList.remove('hidden');
        this.element.classList.add('flex');
        this.isOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        this.onOpen();
    }

    close() {
        this.element.classList.add('hidden');
        this.element.classList.remove('flex');
        this.isOpen = false;
        document.body.style.overflow = ''; // Restore scroll
        this.onClose();
    }

    destroy() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        this.element.remove();
    }
}

// Make globally available
window.Modal = Modal;

import ImageService from '../services/ImageService.js';
import { showToast } from '../modules/utils.js';

/**
 * ImageDropZone Component
 * Implements "Concept 1: Interactive Drop-Zone"
 * Attaches to an image container to enable Drag & Drop and Click-to-Upload
 */
export class ImageDropZone {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - The element to attach to (e.g. the preview div)
     * @param {HTMLImageElement} options.imgElement - The <img> tag to update
     * @param {HTMLInputElement} options.inputElement - The URL input field to update
     * @param {string} options.category - 'products' or 'templates'
     * @param {Function} options.onUploadSuccess - Optional career when upload completes
     */
    constructor({ container, imgElement, inputElement, category, onUploadSuccess }) {
        this.container = container;
        this.imgElement = imgElement;
        this.inputElement = inputElement;
        this.category = category;
        this.onUploadSuccess = onUploadSuccess;

        this.init();
    }

    init() {
        // 1. Ensure container is relative for overlay positioning
        if (getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }

        // 2. Create the glassmorphism overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'dropzone-overlay';
        this.overlay.innerHTML = `
            <div class="dropzone-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>Drop image or click</span>
            </div>
            <div class="dropzone-progress hidden">
                <div class="progress-bar"></div>
            </div>
        `;

        // Style the overlay (inline for now to match project style of minimal external CSS)
        Object.assign(this.overlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            cursor: 'pointer',
            borderRadius: 'inherit',
            zIndex: '10',
            color: '#1a202c',
            textAlign: 'center',
            pointerEvents: 'none' // Only catch events during DragOver or when we want it active
        });

        this.container.appendChild(this.overlay);

        // 3. Create hidden file input
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'image/*';
        this.fileInput.style.display = 'none';
        this.container.appendChild(this.fileInput);

        this.setupListeners();
    }

    setupListeners() {
        // Drag events
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.overlay.style.opacity = '1';
            this.overlay.style.pointerEvents = 'auto';
        });

        this.container.addEventListener('dragleave', (e) => {
            // Only hide if we actually left the container
            if (!this.container.contains(e.relatedTarget)) {
                this.overlay.style.opacity = '0';
                this.overlay.style.pointerEvents = 'none';
            }
        });

        this.container.addEventListener('drop', async (e) => {
            e.preventDefault();
            this.overlay.style.opacity = '0';
            this.overlay.style.pointerEvents = 'none';

            const file = e.dataTransfer.files[0];
            if (file) await this.handleFileUpload(file);
        });

        // Click event (for browse)
        this.container.addEventListener('mouseenter', () => {
            this.overlay.style.opacity = '1';
            this.overlay.style.pointerEvents = 'auto';
        });

        this.container.addEventListener('mouseleave', () => {
            this.overlay.style.opacity = '0';
            this.overlay.style.pointerEvents = 'none';
        });

        this.overlay.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', async () => {
            const file = this.fileInput.files[0];
            if (file) await this.handleFileUpload(file);
        });
    }

    async handleFileUpload(file) {
        const originalText = this.overlay.querySelector('span').innerText;
        const icon = this.overlay.querySelector('i');
        const progress = this.overlay.querySelector('.dropzone-progress');

        try {
            // Updated UI state: Loading
            this.overlay.querySelector('span').innerText = 'Uploading...';
            icon.className = 'fas fa-spinner fa-spin';
            this.overlay.style.opacity = '1';
            this.overlay.style.pointerEvents = 'auto';

            const { publicUrl } = await ImageService.uploadImage(file, this.category);

            // Update UI
            if (this.imgElement) this.imgElement.src = publicUrl;
            if (this.inputElement) {
                this.inputElement.value = publicUrl;
                // Trigger input event for any reactive listeners
                this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            }

            showToast('Image uploaded successfully!', 'success');

            if (this.onUploadSuccess) this.onUploadSuccess(publicUrl);

        } catch (error) {
            showToast('Upload failed: ' + error.message, 'error');
        } finally {
            this.overlay.querySelector('span').innerText = originalText;
            icon.className = 'fas fa-cloud-upload-alt';
            this.overlay.style.opacity = '0';
            this.overlay.style.pointerEvents = 'none';
            this.fileInput.value = ''; // Reset input
        }
    }
}

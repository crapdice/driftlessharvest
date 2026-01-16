/**
 * Analog Hi-Fi Master Choice Modal
 * Self-injecting premium confirmation component
 */

const MODAL_ID = 'choice-modal';

function injectModal() {
    if (document.getElementById(MODAL_ID)) return;

    const modalHtml = `
        <div id="${MODAL_ID}" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-[100] backdrop-blur-sm">
            <style>
                /* STANDARD THEME (Default) */
                #${MODAL_ID} .choice-modal-panel {
                    background: white;
                    border-radius: 1.25rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    max-width: 32rem;
                    width: 100%;
                    margin: 0 1.5rem;
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                }
                .dark #${MODAL_ID} .choice-modal-panel {
                    background: #1f2937;
                    border-color: #374151;
                }
                #${MODAL_ID} .choice-header {
                    padding: 1.5rem 1.75rem 0.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                #${MODAL_ID} .choice-body {
                    padding: 1rem 1.75rem 2rem;
                }
                #${MODAL_ID} .choice-footer {
                    padding: 1.25rem 1.75rem;
                    background: #f9fafb;
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                }
                .dark #${MODAL_ID} .choice-footer {
                    background: #111827;
                }
                #${MODAL_ID} .choice-btn {
                    padding: 0.625rem 1.5rem;
                    font-size: 0.875rem;
                    font-weight: 700;
                    border-radius: 0.75rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                }
                #${MODAL_ID} .choice-btn-cancel {
                    background: white;
                    color: #4b5563;
                    border: 1px solid #e5e7eb;
                }
                .dark #${MODAL_ID} .choice-btn-cancel {
                    background: #374151;
                    color: #d1d5db;
                    border-color: #4b5563;
                }
                #${MODAL_ID} .choice-btn-confirm {
                    background: #2563eb;
                    color: white;
                }
                #${MODAL_ID} .status-indicator {
                    width: 10px;
                    height: 10px;
                    background: #2563eb;
                    border-radius: 50%;
                }

                /* HI-FI MASTER THEME (John Deere Override) */
                body.theme-johndeere #${MODAL_ID} .choice-modal-panel {
                    background: #d1d5db;
                    background-image: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 100%), 
                                      repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px);
                    border: 1px solid #9ca3af;
                    border-radius: 4px;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 20px 40px -10px rgba(0,0,0,0.4);
                }
                body.theme-johndeere #${MODAL_ID} .choice-header {
                    padding: 1rem 1.5rem;
                    background: rgba(0,0,0,0.05);
                    border-bottom: 1px solid #9ca3af;
                }
                body.theme-johndeere #${MODAL_ID} .choice-body { padding: 2rem; }
                body.theme-johndeere #${MODAL_ID} .choice-footer {
                    padding: 1.5rem;
                    background: rgba(0,0,0,0.05);
                    border-top: 1px solid #9ca3af;
                }
                body.theme-johndeere #${MODAL_ID} .choice-btn {
                    padding: 0.5rem 1.5rem;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    border-radius: 2px;
                    border: 1px solid #6b7280;
                }
                body.theme-johndeere #${MODAL_ID} .choice-btn-cancel { background: #d1d5db; color: #4b5563; }
                body.theme-johndeere #${MODAL_ID} .choice-btn-confirm { background: #ea580c; color: white; border-color: #9a3412; }
                body.theme-johndeere #${MODAL_ID} .status-indicator {
                    background: #f97316;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
                    70% { opacity: 0.5; box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
                    100% { opacity: 1; box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
                }
            </style>
            <div class="choice-modal-panel">
                <div class="choice-header">
                    <h3 id="choice-title" class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Confirmation</h3>
                    <div class="status-indicator"></div>
                </div>
                <div class="choice-body">
                    <div class="flex gap-6 items-start">
                        <div id="choice-icon" class="text-5xl">⚠️</div>
                        <div class="space-y-4">
                            <p id="choice-message" class="text-base text-gray-600 dark:text-gray-300 font-bold leading-relaxed">
                                Are you sure you want to perform this operation?
                            </p>
                            <p id="choice-warning" class="text-[10px] text-red-600 font-black uppercase tracking-widest border-l-4 border-red-600 pl-3">
                                THIS ACTION IS IRREVERSIBLE
                            </p>
                        </div>
                    </div>
                </div>
                <div class="choice-footer">
                    <button id="choice-cancel" class="choice-btn choice-btn-cancel">Cancel</button>
                    <button id="choice-confirm" class="choice-btn choice-btn-confirm">Confirm</button>
                </div>
            </div>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
}

/**
 * Global Confirmation Utility
 */
export function confirmChoice({ title, message, confirmText = 'Confirm', icon = '⚠️' }) {
    injectModal();

    const isHiFi = document.body.classList.contains('theme-johndeere');

    const modal = document.getElementById(MODAL_ID);
    const titleEl = document.getElementById('choice-title');
    const messageEl = document.getElementById('choice-message');
    const iconEl = document.getElementById('choice-icon');
    const warningEl = document.getElementById('choice-warning');
    const cancelBtn = document.getElementById('choice-cancel');
    const confirmBtn = document.getElementById('choice-confirm');

    titleEl.textContent = title || (isHiFi ? 'MASTER BYPASS' : 'Confirmation');
    messageEl.textContent = message;
    iconEl.textContent = icon;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = isHiFi ? 'Bypass / Cancel' : 'Cancel';

    warningEl.textContent = isHiFi ? 'IRREVERSIBLE ACTION • SIGNAL LOSS IMMINENT' : 'THIS ACTION CANNOT BE UNDONE';

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    return new Promise((resolve) => {
        const handleCancel = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            cleanup();
            resolve(false);
        };

        const handleConfirm = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            cleanup();
            resolve(true);
        };

        const cleanup = () => {
            cancelBtn.removeEventListener('click', handleCancel);
            confirmBtn.removeEventListener('click', handleConfirm);
        };

        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
    });
}

// Also make it globally available for non-module scripts
window.confirmChoice = confirmChoice;

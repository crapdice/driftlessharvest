/**
 * DataStrategy - CAP Theorem Implementation
 * 
 * Explicit consistency/availability choices per feature.
 * Implements both optimistic (AP) and pessimistic (CP) update strategies.
 */

export class DataStrategy {
    constructor() {
        // Define strategies per data type
        this.strategies = {
            // AP: Availability + Partition Tolerance (Optimistic)
            'user-profile': 'optimistic',
            'settings': 'optimistic',
            'analytics': 'optimistic',
            'theme': 'optimistic',
            'preferences': 'optimistic',

            // CP: Consistency + Partition Tolerance (Pessimistic)
            'inventory': 'pessimistic',
            'orders': 'pessimistic',
            'payments': 'pessimistic',
            'products': 'pessimistic',
            'pricing': 'pessimistic'
        };
    }

    /**
     * Get strategy for a data type
     */
    getStrategy(dataType) {
        return this.strategies[dataType] || 'pessimistic'; // Default to safe
    }

    /**
     * Execute operation with appropriate strategy
     */
    async execute(dataType, operation, options = {}) {
        const strategy = this.getStrategy(dataType);

        if (strategy === 'optimistic') {
            return await this.optimisticUpdate(operation, options);
        } else {
            return await this.pessimisticUpdate(operation, options);
        }
    }

    /**
     * Optimistic Update (AP)
     * Update UI immediately, rollback if server fails
     */
    async optimisticUpdate(operation, options = {}) {
        const {
            onOptimisticUpdate,
            onSuccess,
            onRollback,
            onError
        } = options;

        // 1. Apply optimistic update to UI
        if (onOptimisticUpdate) {
            onOptimisticUpdate();
        }

        try {
            // 2. Send to server in background
            const result = await operation();

            // 3. Confirm success
            if (onSuccess) {
                onSuccess(result);
            }

            return { success: true, result };

        } catch (error) {
            // 4. Rollback UI on failure
            if (onRollback) {
                onRollback();
            }

            if (onError) {
                onError(error);
            }

            return { success: false, error };
        }
    }

    /**
     * Pessimistic Update (CP)
     * Wait for server confirmation before updating UI
     */
    async pessimisticUpdate(operation, options = {}) {
        const {
            onPending,
            onSuccess,
            onError
        } = options;

        // 1. Show pending state
        if (onPending) {
            onPending();
        }

        try {
            // 2. Wait for server
            const result = await operation();

            // 3. Update UI only on success
            if (onSuccess) {
                onSuccess(result);
            }

            return { success: true, result };

        } catch (error) {
            // 4. Show error, don't update UI
            if (onError) {
                onError(error);
            }

            return { success: false, error };
        }
    }

    /**
     * Helper: Create optimistic save operation
     */
    createOptimisticSave(dataType, apiCall, uiUpdate, uiRollback) {
        return this.execute(dataType, apiCall, {
            onOptimisticUpdate: uiUpdate,
            onRollback: uiRollback,
            onSuccess: (result) => {
                if (window.showToast) {
                    window.showToast('Saved successfully', 'success');
                }
            },
            onError: (error) => {
                if (window.showToast) {
                    window.showToast('Failed to save - changes reverted', 'error');
                }
                console.error('[DataStrategy] Optimistic save failed:', error);
            }
        });
    }

    /**
     * Helper: Create pessimistic save operation
     */
    createPessimisticSave(dataType, apiCall, uiUpdate) {
        return this.execute(dataType, apiCall, {
            onPending: () => {
                if (window.showToast) {
                    window.showToast('Saving...', 'info');
                }
            },
            onSuccess: (result) => {
                uiUpdate(result);
                if (window.showToast) {
                    window.showToast('Saved successfully', 'success');
                }
            },
            onError: (error) => {
                if (window.showToast) {
                    window.showToast('Failed to save - please try again', 'error');
                }
                console.error('[DataStrategy] Pessimistic save failed:', error);
            }
        });
    }
}

// Singleton instance
export const dataStrategy = new DataStrategy();

// Make globally available
window.DataStrategy = DataStrategy;
window.dataStrategy = dataStrategy;

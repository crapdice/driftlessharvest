/**
 * UsersActions - Registered handlers for users module.
 * Uses ActionDispatcher event delegation.
 * 
 * @module core/UsersActions
 */

import { registerActions } from './ActionDispatcher.js';

let registered = false;

/**
 * Register all users actions.
 */
export function registerUsersActions() {
    if (registered) return;
    registered = true;

    registerActions('users', {
        openModal: () => window.openUserModal?.(),
        closeModal: () => window.closeUserModal?.(),
        save: () => window.saveUser?.()
    });

    console.log('[UsersActions] Registered 3 users actions.');
}

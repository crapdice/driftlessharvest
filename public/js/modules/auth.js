import { store } from '../store/index.js';
import * as api from './api.js';
import { setView } from './router.js';
import { showToast } from '../utils.js';

export async function login(email, password) {
    try {
        const data = await api.loginUser(email, password);

        store.setUser(data.user);

        // Store saves token? No, store saves cart/config.
        // Token management usually stays in Auth module or API layer.
        // API layer reads it from localStorage.
        localStorage.setItem('harvest_token', data.token);
        localStorage.setItem('harvest_user', JSON.stringify(data.user));

        setView('home');
        showToast(`Welcome back, ${data.user.email}!`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

export async function signup(email, password) {
    try {
        const data = await api.signupUser(email, password);

        store.setUser(data.user);
        localStorage.setItem('harvest_token', data.token);
        localStorage.setItem('harvest_user', JSON.stringify(data.user)); // Redundant if store handles it? 
        // Store doesn't persist User to localstorage automatically yet, only Cart. 
        // So keeping this is fine for now/init.

        setView('home');
        showToast('Account created successfully!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

export function logout() {
    store.setUser(null);
    localStorage.removeItem('harvest_token');
    localStorage.removeItem('harvest_user');
    setView('home');
    showToast('Logged out successfully.');
}

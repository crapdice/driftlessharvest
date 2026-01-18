import { store } from '../store/index.js';
import * as api from './api.js';
import { setView } from './router.js';
import { showToast } from '../utils.js';

export async function login(email, password) {
    try {
        const data = await api.loginUser(email, password);

        store.setUser(data.user);
        // Token now in HttpOnly cookie - localStorage only stores user object for UI
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
        // Token now in HttpOnly cookie
        localStorage.setItem('harvest_user', JSON.stringify(data.user));

        setView('home');
        showToast('Account created successfully!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

export async function logout() {
    try {
        // Clear cookie server-side
        await api.sendRequest('/auth/logout', 'POST');
    } catch (e) {
        console.error('Logout API failed:', e);
        // Continue with local cleanup even if API fails
    }

    store.setUser(null);
    localStorage.removeItem('harvest_user');
    // No need to remove harvest_token - it never existed in localStorage
    setView('home');
    showToast('Logged out successfully.');
}

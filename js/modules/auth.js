import { state } from './state.js';
import { setView } from './router.js';
import { showToast } from '../utils.js';

export async function login(email, password) {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Login failed');

        state.user = data.user;
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
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Signup failed');

        state.user = data.user;
        localStorage.setItem('harvest_token', data.token);
        localStorage.setItem('harvest_user', JSON.stringify(data.user));
        setView('home');
        showToast('Account created successfully!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

export function logout() {
    state.user = null;
    localStorage.removeItem('harvest_token');
    localStorage.removeItem('harvest_user');
    setView('home');
    showToast('Logged out successfully.');
}

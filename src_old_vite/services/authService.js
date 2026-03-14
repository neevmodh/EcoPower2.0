import { apiService } from './apiService';

const SESSION_KEY = 'eco_session';

/**
 * Authenticate a user against MongoDB via Express API
 */
export async function login(email, password) {
    try {
        const response = await fetch('http://localhost:5005/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            console.log('[Auth] Login failed for:', email);
            return { success: false, error: 'Invalid credentials' };
        }

        const user = await response.json();
        
        // Store session
        const sessionUser = { ...user };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
        console.log('[Auth] Login successful:', user.email, '→', user.role);
        return { success: true, user: sessionUser };
    } catch (error) {
        console.error('[Auth] Login error:', error);
        return { success: false, error: 'Service unavailable. Please try again.' };
    }
}

/**
 * Clear session and stop any running intervals (IoT simulator)
 */
export function logout() {
    localStorage.removeItem(SESSION_KEY);

    // Clear IoT simulator interval if stored globally
    if (window.__ecoIoTStopFn) {
        window.__ecoIoTStopFn();
        window.__ecoIoTStopFn = null;
    }

    console.log('[Auth] Logged out');
    return true;
}

/**
 * Get the currently logged-in user from localStorage
 */
export function getCurrentUser() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return null;
        return JSON.parse(session);
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

/**
 * Check if a user has admin role
 */
export function isAdmin(user) {
    return user?.role === 'admin';
}

/**
 * Update the stored session user data (e.g., after profile update)
 */
export function updateSession(updatedFields) {
    const user = getCurrentUser();
    if (!user) return null;
    const updated = { ...user, ...updatedFields };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return updated;
}

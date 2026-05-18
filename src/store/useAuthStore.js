import { create } from 'zustand';
import { TokenManager } from '../core/api/TokenManager';

/**
 * Authentication Store (Zustand)
 * Manages user session, role, and token state.
 */
const useAuthStore = create((set, get) => ({
    user: TokenManager.getUserData(),
    token: TokenManager.getToken(),
    isAuthenticated: !!TokenManager.getToken(),

    /**
     * Login - saves user and token to store + localStorage
     */
    login: (user, token) => {
        TokenManager.setToken(token);
        TokenManager.setUserData(user);
        set({ user, token, isAuthenticated: true });
    },

    /**
     * Logout - clears everything
     */
    logout: () => {
        TokenManager.clearAll();
        set({ user: null, token: null, isAuthenticated: false });
    },

    /**
     * Update user data (e.g., after profile edit)
     */
    updateUser: (userData) => {
        const merged = { ...get().user, ...userData };
        TokenManager.setUserData(merged);
        set({ user: merged });
    },

    /**
     * Get user's role name (from the nested role object)
     */
    getRoleName: () => {
        const user = get().user;
        return user?.role?.role_name || null;
    },

    /**
     * Check if the user has a specific role
     */
    hasRole: (roleName) => {
        return get().getRoleName() === roleName;
    },

    /**
     * Check if the user is SuperAdmin
     */
    isAdmin: () => {
        return get().getRoleName() === 'SuperAdmin';
    },

    /**
     * Check if the user is Advertiser
     */
    isAdvertiser: () => {
        return get().getRoleName() === 'Advertiser';
    },
}));

export default useAuthStore;

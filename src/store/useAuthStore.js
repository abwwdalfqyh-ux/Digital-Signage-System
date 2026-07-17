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
    impersonatedRole: null, // Allows admins to view system as other roles

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
     * Set a temporary role ID for impersonation (Admin only)
     */
    setImpersonatedRole: (roleId) => {
        set({ impersonatedRole: roleId });
    },

    /**
     * Get user's role ID
     */
    getRoleId: () => {
        const impersonated = get().impersonatedRole;
        if (impersonated) return impersonated;
        const user = get().user;
        return user?.role_id || user?.role?.role_id || null;
    },

    /**
     * Get user's role name (for display)
     */
    getRoleName: () => {
        const impersonated = get().impersonatedRole;
        if (impersonated) {
            const map = { 1: 'SuperAdmin', 2: 'Advertiser', 3: 'ScreenOwner', 4: 'Maintenance', 5: 'Accountant', 6: 'Secretary' };
            return map[impersonated] || 'Unknown';
        }
        const user = get().user;
        return user?.role?.role_name || null;
    },

    /**
     * Check if the user has a specific role ID
     */
    hasRole: (roleId) => {
        return get().getRoleId() === roleId;
    },

    /**
     * Check if the user is SuperAdmin (1) or Admin (7)
     */
    isAdmin: () => {
        const roleId = get().getRoleId();
        return roleId === 1 || roleId === 7;
    },

    /**
     * Check if the user is Advertiser (2)
     */
    isAdvertiser: () => {
        return get().getRoleId() === 2;
    },
}));

export default useAuthStore;

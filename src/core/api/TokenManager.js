/**
 * Token Manager Utility
 * Responsibilities: Secure storage, retrieval, and removal of auth tokens.
 */

const TOKEN_KEY = 'sabapost_auth_token';
const USER_KEY = 'sabapost_user_data';

export const TokenManager = {
    setToken: (token) => {
        localStorage.setItem(TOKEN_KEY, token);
    },
    getToken: () => {
        return localStorage.getItem(TOKEN_KEY);
    },
    removeToken: () => {
        localStorage.removeItem(TOKEN_KEY);
    },
    setUserData: (user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    getUserData: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    clearAll: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
};

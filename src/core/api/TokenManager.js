/**
 * Token Manager Utility
 * Responsibilities: Secure storage, retrieval, and removal of auth tokens.
 */

const TOKEN_KEY = 'sabapost_auth_token';
const USER_KEY = 'sabapost_user_data';

export const TokenManager = {
    setToken: (token) => {
        sessionStorage.setItem(TOKEN_KEY, token);
    },
    getToken: () => {
        return sessionStorage.getItem(TOKEN_KEY);
    },
    removeToken: () => {
        sessionStorage.removeItem(TOKEN_KEY);
    },
    setUserData: (user) => {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    getUserData: () => {
        const user = sessionStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    clearAll: () => {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    }
};

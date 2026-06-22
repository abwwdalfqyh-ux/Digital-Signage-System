import { create } from 'zustand';

/**
 * UI Store — manages theme & language globally.
 * Persisted to localStorage automatically.
 */
const useUIStore = create((set) => ({

    /* ── Theme: 'light' | 'dark' ── */
    theme: localStorage.getItem('app-theme') || 'light',

    toggleTheme: () =>
        set((state) => {
            const next = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('app-theme', next);

            // Apply immediately to <html> data attribute
            document.documentElement.setAttribute('data-theme', next);

            return { theme: next };
        }),

    /* ── Language: 'ar' | 'en' ── */
    language: localStorage.getItem('app-language') || 'ar',

    toggleLanguage: () =>
        set((state) => {
            const next = state.language === 'ar' ? 'en' : 'ar';
            localStorage.setItem('app-language', next);

            // Apply direction & lang to <html>
            document.documentElement.setAttribute('lang', next);
            document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');

            return { language: next };
        }),
}));

export default useUIStore;

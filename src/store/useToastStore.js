import { create } from 'zustand';

/**
 * Global Toast Notifications Store
 */
const useToastStore = create((set, get) => ({
    toasts: [],
    
    addToast: (message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type };
        
        set((state) => ({
            toasts: [...state.toasts, newToast]
        }));
        
        // Auto remove toast after 4 seconds
        setTimeout(() => {
            get().removeToast(id);
        }, 4000);
    },
    
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id)
        }));
    }
}));

export default useToastStore;

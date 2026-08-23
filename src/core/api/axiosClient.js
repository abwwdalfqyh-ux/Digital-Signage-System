import axios from 'axios';
import { TokenManager } from './TokenManager';
import useToastStore from '../../store/useToastStore';
import useAuthStore from '../../store/useAuthStore';

/**
 * Production-Ready Axios Client
 * Features: 
 * - Auto Token Injectionظظ
  * - Centralized Error Handling (401, 403, 422, etc.)
 * - Network Exception & Timeout Handling
 */

let API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
    if (import.meta.env.DEV) {
        API_BASE_URL = 'https://laravel-1-h8ye.onrender.com/api';
        console.warn('⚠️ No VITE_API_URL found. Defaulting to Render URL.');
    } else {
        API_BASE_URL = 'https://laravel-1-h8ye.onrender.com/api';
    }
}

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60 seconds timeout to handle Vercel cold starts
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request Interceptor: Attach Token + Handle FormData automatically
axiosClient.interceptors.request.use(
    (config) => {
        const token = TokenManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Auto-detect FormData: let the browser set Content-Type with correct boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle errors globally
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const { response } = error;

        const addToast = useToastStore.getState().addToast;
        const lang = useAuthStore.getState().language || (localStorage.getItem('app-language') || 'ar'); // Read from localStorage since it's global
        const isAr = lang === 'ar';

        // 1. Handle Network Errors
        if (!response) {
            addToast(isAr ? "مشكلة في الاتصال بالإنترنت، يرجى التحقق من الشبكة." : "Network connection issue, please check your internet.", 'error');
            return Promise.reject(error);
        }

        // 2. Handle 401 Unauthorized
        if (response.status === 401) {
            // Do not force logout if the 401 came from the login attempt itself
            if (error.config?.url?.includes('/login')) {
                addToast(response.data?.message || (isAr ? "بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى." : "Invalid login credentials, please try again."), 'error');
                return Promise.reject(error);
            }
            
            useAuthStore.getState().logout();
            addToast(isAr ? "انتهت صلاحية الجلسة أو تم تحديث صلاحياتك، يرجى تسجيل الدخول مرة أخرى." : "Session expired or permissions updated, please log in again.", 'error');
            return Promise.reject(error);
        }

        // 3. Handle 422 Validation Errors
        if (response.status === 422) {
            const firstError = Object.values(response.data.errors || {})[0]?.[0];
            addToast(firstError || (isAr ? "البيانات المدخلة غير صحيحة." : "Invalid input data."), 'warning');
            return Promise.reject(error);
        }

        // 4. Handle 403 Forbidden
        if (response.status === 403) {
            addToast(isAr ? "ليس لديك صلاحية للقيام بهذا الإجراء." : "You do not have permission to perform this action.", 'warning');
            return Promise.reject(error);
        }

        // 5. Generic Server Errors
        // Translate common backend English messages to Arabic
        let msg = response.data?.message;
        if (isAr && typeof msg === 'string') {
            if (msg.includes('SQLSTATE')) {
                msg = "حدث خطأ في قاعدة البيانات، يرجى مراجعة الدعم الفني.";
            } else if (msg.toLowerCase().includes('failed to upload') || msg.toLowerCase().includes('the file failed to upload')) {
                msg = "حجم الملف يتجاوز الحد الأقصى المسموح به في السيرفر.";
            } else if (msg.includes('format is invalid')) {
                msg = "صيغة البيانات المدخلة غير صالحة.";
            } else if (msg.includes('must be a file of type')) {
                msg = "نوع الملف المرفق غير مدعوم.";
            }
        } else if (msg && msg.includes('SQLSTATE')) {
            msg = "A database error occurred, please contact support.";
        }

        addToast(msg || (isAr ? "حدث خطأ غير متوقع في السيرفر." : "An unexpected server error occurred."), 'error');
        return Promise.reject(error);
    }
);

export default axiosClient;

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

        // 1. Handle Network Errors
        if (!response) {
            addToast("مشكلة في الاتصال بالإنترنت، يرجى التحقق من الشبكة.", 'error');
            return Promise.reject(error);
        }

        // 2. Handle 401 Unauthorized
        if (response.status === 401) {
            useAuthStore.getState().logout();
            addToast("انتهت صلاحية الجلسة أو تم تحديث صلاحياتك، يرجى تسجيل الدخول مرة أخرى.", 'error');
            return Promise.reject(error);
        }

        // 3. Handle 422 Validation Errors
        if (response.status === 422) {
            const firstError = Object.values(response.data.errors || {})[0]?.[0];
            addToast(firstError || "البيانات المدخلة غير صحيحة.", 'warning');
            return Promise.reject(error);
        }

        // 4. Handle 403 Forbidden
        if (response.status === 403) {
            addToast("ليس لديك صلاحية للقيام بهذا الإجراء.", 'warning');
            return Promise.reject(error);
        }

        // 5. Generic Server Errors
        addToast(response.data?.message || "حدث خطأ غير متوقع في السيرفر.", 'error');
        return Promise.reject(error);
    }
);

export default axiosClient;

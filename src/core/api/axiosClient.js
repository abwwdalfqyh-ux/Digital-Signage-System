import axios from 'axios';
import { TokenManager } from './TokenManager';
import useToastStore from '../../store/useToastStore';

/**
 * Production-Ready Axios Client
 * Features: 
 * - Auto Token Injection
 * - Request/Response Interceptors
 * - Centralized Error Handling (401, 403, 422, etc.)
 * - Network Exception & Timeout Handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://laravel-production-969f.up.railway.app/api';

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000, // 20 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request Interceptor: Attach Token automatically
axiosClient.interceptors.request.use(
    (config) => {
        const token = TokenManager.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
            TokenManager.clearAll();
            addToast("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.", 'error');
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

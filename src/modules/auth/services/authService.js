import axiosClient from '../../../core/api/axiosClient';
import { ENDPOINTS } from '../../../core/api/endpoints';

/**
 * Auth Module API Services
 */

export const loginUserApi = async (login_id, password) => {
    try {
        const response = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, { login_id, password });
        return response.data;
    } catch (error) {
        throw error; // الخطأ يتم معالجته في axiosClient
    }
};

export const registerUserApi = async (userData) => {
    try {
        const response = await axiosClient.post(ENDPOINTS.AUTH.REGISTER, userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};
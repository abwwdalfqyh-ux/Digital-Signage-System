import axiosClient from '../../../core/api/axiosClient';

/**
 * Auth Module API Services
 */

export const loginUserApi = async (login_id, password) => {
    try {
        const response = await axiosClient.post('/login', { login_id, password });
        return response.data;
    } catch (error) {
        throw error; // الخطأ يتم معالجته في axiosClient
    }
};

export const registerUserApi = async (userData) => {
    try {
        const response = await axiosClient.post('/register', userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};
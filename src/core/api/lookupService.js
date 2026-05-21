import axiosClient from './axiosClient';

/**
 * Lookup Service
 * Centralized service for fetching dynamic lookups from the unified LookupController.
 */

export const lookupService = {
    getScreenTypes: async () => {
        const res = await axiosClient.get('/lookups/screen-types');
        return res.data;
    },
    getGovernorates: async () => {
        const res = await axiosClient.get('/lookups/governorates');
        return res.data;
    },
    getRegions: async (governorateId) => {
        const res = await axiosClient.get(`/lookups/governorates/${governorateId}/regions`);
        return res.data;
    },
    getStreets: async (regionId) => {
        const res = await axiosClient.get(`/lookups/regions/${regionId}/streets`);
        return res.data;
    },
    getCategories: async () => {
        const res = await axiosClient.get('/lookups/categories');
        return res.data;
    },
    getRoles: async () => {
        const res = await axiosClient.get('/lookups/roles');
        return res.data;
    },
    // New endpoint for frequency packages directly connected to scheduling/pricing
    getFrequencyPackages: async () => {
        const res = await axiosClient.get('/frequency-packages');
        return res.data?.data || [];
    }
};

export default lookupService;

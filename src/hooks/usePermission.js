import useAuthStore from '../store/useAuthStore';

/**
 * Permission & Role Configuration
 * Maps roles to their sidebar items and permissions.
 */

// Role names from backend
export const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    ADVERTISER: 'Advertiser',
    SCREEN_OWNER: 'ScreenOwner',
    MAINTENANCE: 'Maintenance',
    SECRETARY: 'Secretary',
};

/**
 * Hook to check permissions based on user role.
 */
const usePermission = () => {
    const user = useAuthStore(state => state.user);
    const roleName = user?.role?.role_name || null;

    const isAdmin = roleName === ROLES.SUPER_ADMIN;
    const isAdvertiser = roleName === ROLES.ADVERTISER;
    const isScreenOwner = roleName === ROLES.SCREEN_OWNER;
    const isMaintenance = roleName === ROLES.MAINTENANCE;
    const isSecretary = roleName === ROLES.SECRETARY;

    // Permission checks matching backend capabilities
    const can = (permission) => {
        switch (permission) {
            case 'manage_all':
                return isAdmin;
            case 'manage_users':
                return isAdmin;
            case 'manage_regions':
                return isAdmin;
            case 'review_ads':
                return isAdmin || isSecretary;
            case 'approve_ads':
                return isAdmin || isSecretary;
            case 'create_campaigns':
                return isAdmin || isAdvertiser;
            case 'view_own_reports':
                return isAdvertiser || isScreenOwner;
            case 'view_financial':
                return isAdmin;
            case 'view_earnings':
                return isScreenOwner;
            case 'manage_screens':
                return isAdmin || isScreenOwner || isMaintenance;
            case 'manage_settings':
                return isAdmin;
            default:
                return false;
        }
    };

    return {
        user,
        roleName,
        isAdmin,
        isAdvertiser,
        isScreenOwner,
        isMaintenance,
        isSecretary,
        can,
    };
};

export default usePermission;

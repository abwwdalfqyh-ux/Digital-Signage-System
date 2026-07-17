import useAuthStore from '../store/useAuthStore';

/**
 * Permission & Role Configuration
 * Maps roles to their sidebar items and permissions using role_id.
 */

// Role IDs from backend database
export const ROLES = {
    SUPER_ADMIN: 1,
    ADVERTISER: 2,
    SCREEN_OWNER: 3,
    MAINTENANCE: 4,
    SECRETARY: 6,
    ADMIN: 7, // If you have a separate Admin role, else map it as needed
};

/**
 * Hook to check permissions based on user role ID.
 */
const usePermission = () => {
    const user = useAuthStore(state => state.user);
    const roleId = useAuthStore(state => state.getRoleId());
    const roleName = useAuthStore(state => state.getRoleName()); // Keep for UI display

    const isAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
    const isAdvertiser = roleId === ROLES.ADVERTISER;
    const isScreenOwner = roleId === ROLES.SCREEN_OWNER;
    const isMaintenance = roleId === ROLES.MAINTENANCE;
    const isSecretary = roleId === ROLES.SECRETARY;

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
                return isAdmin || isMaintenance;
            case 'manage_settings':
                return isAdmin;
            default:
                return false;
        }
    };

    return {
        user,
        roleId,
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

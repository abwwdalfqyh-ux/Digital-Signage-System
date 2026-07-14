import React from 'react';
import useAuthStore from '../../store/useAuthStore';

/**
 * RoleGuard Component
 * Only renders children if the current user has one of the allowed roles.
 * Roles: 1 (Admin), 2 (Advertiser), 3 (Screen Owner), 4 (Employee), 5 (Maintenance)
 */
const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
    const { user } = useAuthStore();
    
    const hasAccess = user && allowedRoles.includes(user.role_id);

    if (!hasAccess) {
        return fallback;
    }

    return <>{children}</>;
};

export default RoleGuard;

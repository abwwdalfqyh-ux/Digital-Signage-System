import React from 'react';
import useAuthStore from '../../store/useAuthStore';

/**
 * RoleGuard Component
 * Only renders children if the current user has one of the allowed roles.
 *
 * Rules:
 *  - SuperAdmin (1) and Admin (7) ALWAYS have access — even when impersonating.
 *  - Other users: access is checked against getRoleId() which returns
 *    impersonatedRole when active, or the real role_id otherwise.
 */
const RoleGuard = ({ allowedRoles, children, fallback = null }) => {
    const user           = useAuthStore(state => state.user);
    const getRoleId      = useAuthStore(state => state.getRoleId);

    if (!user) return fallback;

    // Determine the real (permanent) role of the logged-in user
    const realRoleId = user?.role_id ?? user?.role?.role_id;
    const isRealAdmin = realRoleId === 1 || realRoleId === 7;

    // Admins can always see every section — impersonation is preview-only
    if (isRealAdmin) return <>{children}</>;

    // For non-admin users, check against the effective role (may be impersonated)
    const effectiveRoleId = getRoleId();
    const hasAccess = allowedRoles.includes(effectiveRoleId);

    return hasAccess ? <>{children}</> : fallback;
};

export default RoleGuard;

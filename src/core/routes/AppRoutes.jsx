import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import usePermission, { ROLES } from '../../hooks/usePermission';

// Auth Pages
import LoginPage from '../../modules/auth/LoginPage';
import RegisterPage from '../../modules/auth/RegisterPage';
import ForgotPasswordPage from '../../modules/auth/ForgotPasswordPage';

// Layout
import DashboardLayout from '../../shared/layouts/DashboardLayout';

// Dashboard
import Dashboard from '../../modules/dashboard/Dashboard';
import AdvertiserDashboard from '../../modules/dashboard/AdvertiserDashboard';

// Modules
import ScreensPage from '../../modules/screens/ScreensPage';
import AdsPage from '../../modules/ads/AdsPage';
import CreateAdPage from '../../modules/ads/CreateAdPage';
import UsersPage from '../../modules/users/UsersPage';
import LocationsPage from '../../modules/locations/LocationsPage';
import FinancialPage from '../../modules/financial/FinancialPage';
import OwnerEarningsPage from '../../modules/financial/OwnerEarningsPage';
import AdvertiserFinancials from '../../modules/financial/AdvertiserFinancials';
import SettingsPage from '../../modules/settings/SettingsPage';
import NotificationsPage from '../../modules/notifications/NotificationsPage';

// Admin Modules
import CategoriesPage from '../../modules/admin/CategoriesPage';
import PaymentMethodsPage from '../../modules/admin/PaymentMethodsPage';
import PeakHoursPage from '../../modules/admin/PeakHoursPage';
import RolesPage from '../../modules/admin/RolesPage';
import PaymentOperationsPage from '../../modules/admin/PaymentOperationsPage';
import AdminProfilePage from '../../modules/admin/AdminProfilePage';
import FrequencyPackagesPage from '../../modules/admin/FrequencyPackagesPage';
/**
 * Protected Route - requires authentication
 */
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * Public Route - redirects to dashboard if already authenticated
 */
const PublicRoute = ({ children }) => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

/**
 * Role-Based Route - restricts access to specific roles
 */
const RoleRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated } = useAuthStore();
    const roleName = user?.role?.role_name;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(roleName)) return <Navigate to="/dashboard" replace />;
    return children;
};

/**
 * Smart Dashboard - renders different dashboard based on role
 */
const SmartDashboard = () => {
    const { roleName } = usePermission();
    if (roleName === ROLES.ADVERTISER) return <AdvertiserDashboard />;
    return <Dashboard />;
};

const AppRoutes = () => {
    return (
        <Routes>
            {/* === Public Auth Routes === */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

            {/* === Protected Dashboard Routes === */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                {/* Smart Dashboard (renders based on role) */}
                <Route index element={<SmartDashboard />} />

                {/* Screens Module */}
                <Route path="screens" element={<ScreensPage />} />

                {/* Ads Module */}
                <Route path="ads" element={<AdsPage />} />
                <Route path="ads/create" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADVERTISER]}>
                        <CreateAdPage />
                    </RoleRoute>
                } />

                {/* Users Module (Admin Only) */}
                <Route path="users" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <UsersPage />
                    </RoleRoute>
                } />

                {/* Locations Module (Admin Only) */}
                <Route path="locations" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <LocationsPage />
                    </RoleRoute>
                } />

                {/* Financial Module (Admin Only) */}
                <Route path="financial" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <FinancialPage />
                    </RoleRoute>
                } />

                {/* Admin Modules (Admin Only) */}
                <Route path="categories" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <CategoriesPage />
                    </RoleRoute>
                } />
                <Route path="payment-methods" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <PaymentMethodsPage />
                    </RoleRoute>
                } />
                <Route path="peak-hours" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <PeakHoursPage />
                    </RoleRoute>
                } />
                <Route path="frequency-packages" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <FrequencyPackagesPage />
                    </RoleRoute>
                } />
                <Route path="roles" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <RolesPage />
                    </RoleRoute>
                } />
                <Route path="payment-ops" element={
                    <RoleRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.SECRETARY]}>
                        <PaymentOperationsPage />
                    </RoleRoute>
                } />
                <Route path="profile" element={<AdminProfilePage />} />

                {/* Owner Earnings (Screen Owner) */}
                <Route path="earnings" element={
                    <RoleRoute allowedRoles={[ROLES.SCREEN_OWNER]}>
                        <OwnerEarningsPage />
                    </RoleRoute>
                } />

                {/* Advertiser Financials */}
                <Route path="my-financials" element={
                    <RoleRoute allowedRoles={[ROLES.ADVERTISER]}>
                        <AdvertiserFinancials />
                    </RoleRoute>
                } />

                {/* Settings */}
                <Route path="settings" element={<SettingsPage />} />

                {/* Notifications */}
                <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Default Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={
                <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white font-black text-3xl tracking-tighter">
                    404 | الصفحة غير موجودة
                </div>
            } />
        </Routes>
    );
};

export default AppRoutes;

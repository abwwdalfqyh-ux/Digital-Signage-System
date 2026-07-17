import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { FileText, DollarSign, BarChart2, Wrench } from 'lucide-react';
import useTranslation from '../../i18n/useTranslation';
import useAuthStore from '../../store/useAuthStore';
import { ROLES } from '../../hooks/usePermission';

const ReportsHubPage = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const location = useLocation();
    
    // Determine allowed tabs based on role
    const tabs = [];
    
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role_id)) {
        tabs.push({ path: 'screen', label: t('reports.screen_reports', 'تقرير الشاشات'), icon: FileText });
        tabs.push({ path: 'financial', label: t('reports.financial_report', 'التقرير المالي'), icon: DollarSign });
        tabs.push({ path: 'ad-performance', label: t('reports.ad_performance', 'تقرير الأداء'), icon: BarChart2 });
        tabs.push({ path: 'maintenance', label: t('reports.maintenance', 'تقرير الصيانة'), icon: Wrench });
    } else if (user?.role_id === ROLES.SECRETARY) {
        tabs.push({ path: 'financial', label: t('reports.financial_report', 'التقرير المالي'), icon: DollarSign });
        tabs.push({ path: 'ad-performance', label: t('reports.ad_performance', 'تقرير الأداء'), icon: BarChart2 });
    } else if (user?.role_id === ROLES.MAINTENANCE) {
        tabs.push({ path: 'maintenance', label: t('reports.maintenance', 'تقرير الصيانة'), icon: Wrench });
    }

    // If on the root /reports, redirect to the first allowed tab
    if (location.pathname === '/dashboard/reports' || location.pathname === '/dashboard/reports/') {
        if (tabs.length > 0) {
            return <Navigate to={`/dashboard/reports/${tabs[0].path}`} replace />;
        }
    }

    if (tabs.length === 0) return <div className="p-6">{t('common.unauthorized')}</div>;

    return (
        <div className="font-sans min-h-screen flex flex-col">
            {/* Tabs Navigation */}
            <div className="bg-surface border-b border-border-color sticky top-0 z-10 print:hidden pt-4 px-6 md:px-8">
                <div className="flex gap-6 overflow-x-auto max-w-7xl mx-auto w-full">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={({ isActive }) => `flex items-center gap-2 pb-3 px-1 border-b-2 transition-all whitespace-nowrap ${
                                    isActive 
                                    ? 'border-primary text-primary font-bold' 
                                    : 'border-transparent text-on-surface-variant hover:text-on-background hover:border-outline-variant'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 w-full">
                <Outlet />
            </div>
        </div>
    );
};

export default ReportsHubPage;

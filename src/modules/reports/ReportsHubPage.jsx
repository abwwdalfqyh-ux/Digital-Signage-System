import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, DollarSign, BarChart2, Wrench, Monitor } from 'lucide-react';
import useTranslation from '../../i18n/useTranslation';
import useAuthStore from '../../store/useAuthStore';
import { ROLES } from '../../hooks/usePermission';

const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    surface: '#f9f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
};

const TAB_META = {
    screen:             { color: '#2563eb', bg: '#dbeafe', icon: Monitor },
    financial:          { color: '#16a34a', bg: '#dcfce7', icon: DollarSign },
    'ad-performance':   { color: '#7c3aed', bg: '#ede9fe', icon: BarChart2 },
    maintenance:        { color: '#ea580c', bg: '#ffedd5', icon: Wrench },
};

const ReportsHubPage = () => {
    const { t, dir } = useTranslation();
    const { user } = useAuthStore();
    const location = useLocation();

    /* ── Build allowed tabs by role ── */
    const tabs = [];
    if ([ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role_id)) {
        tabs.push({ path: 'screen',           label: t('reports.screen_reports'),  icon: Monitor });
        tabs.push({ path: 'financial',         label: t('reports.financial_report'), icon: DollarSign });
        tabs.push({ path: 'ad-performance',    label: t('reports.ad_performance'),  icon: BarChart2 });
        tabs.push({ path: 'maintenance',       label: t('reports.maintenance'),    icon: Wrench });
    } else if (user?.role_id === ROLES.SECRETARY) {
        tabs.push({ path: 'financial',         label: t('reports.financial_report'), icon: DollarSign });
        tabs.push({ path: 'ad-performance',    label: t('reports.ad_performance'),  icon: BarChart2 });
    } else if (user?.role_id === ROLES.MAINTENANCE) {
        tabs.push({ path: 'maintenance',       label: t('reports.maintenance'),    icon: Wrench });
    } else if (user?.role_id === ROLES.SCREEN_OWNER) {
        tabs.push({ path: 'screen',            label: t('reports.screen_reports'),  icon: Monitor });
    }

    /* ── Redirect to first allowed tab ── */
    const isRoot = location.pathname === '/dashboard/reports' || location.pathname === '/dashboard/reports/';
    if (isRoot && tabs.length > 0) return <Navigate to={`/dashboard/reports/${tabs[0].path}`} replace />;
    if (tabs.length === 0) return (
        <div style={{ padding: '48px', textAlign: 'center', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            {t('common.unauthorized')}
        </div>
    );

    /* ── Detect active tab meta ── */
    const activeTab = tabs.find(tab => location.pathname.includes(tab.path));
    const meta = activeTab ? TAB_META[activeTab.path] : TAB_META['financial'];

    return (
        <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* ── Hub Header ── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '0' }}
            >
                <div style={{ paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: meta?.bg || S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText style={{ width: 20, height: 20, color: meta?.color || S.primaryContainer }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('reports.reports_hub')}
                            </h1>
                            <p style={{ margin: 0, fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {t('reports.reports_hub_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Tab Navigation ── */}
            <div style={{
                background: S.surfaceContainerLowest,
                borderBottom: `1px solid ${S.outlineVariant}`,
                borderTop: `1px solid ${S.outlineVariant}`,
                position: 'sticky', top: 0, zIndex: 10,
                marginBottom: '24px',
            }}>
                <div style={{ display: 'flex', gap: '0', overflowX: 'auto' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const m = TAB_META[tab.path];
                        const isActive = location.pathname.includes(tab.path);
                        return (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                style={({ isActive: ia }) => ({
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    padding: '14px 20px',
                                    borderBottom: `3px solid ${ia ? (m?.color || S.primaryContainer) : 'transparent'}`,
                                    color: ia ? (m?.color || S.primaryContainer) : S.onSurfaceVariant,
                                    fontWeight: ia ? 700 : 500,
                                    fontSize: '13px',
                                    whiteSpace: 'nowrap',
                                    textDecoration: 'none',
                                    transition: 'all 0.15s ease',
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                    background: ia ? `${m?.bg || S.surfaceContainer}60` : 'transparent',
                                })}
                            >
                                <div style={{
                                    width: 26, height: 26, borderRadius: '7px',
                                    background: isActive ? (m?.bg || S.surfaceContainer) : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                                }}>
                                    <Icon style={{ width: 14, height: 14 }} />
                                </div>
                                {tab.label}
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* ── Tab Content ── */}
            <div style={{ flex: 1, width: '100%' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default ReportsHubPage;

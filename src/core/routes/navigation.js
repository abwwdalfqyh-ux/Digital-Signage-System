import {
    LayoutDashboard,
    Monitor,
    MapPin,
    Users,
    Settings,
    Megaphone,
    CreditCard,
    Shield,
    Layers,
    Clock,
    DollarSign,
    Wallet,
    Repeat,
    ShieldAlert,
    ShieldCheck,
    Wrench,
    AlertTriangle,
    FileText,
    HeadphonesIcon,
    BarChart2,
} from 'lucide-react';
import { ROLES } from '../../hooks/usePermission';

/* ── Bilingual nav labels ── */
const NAV_LABELS = {
    dashboard:          { ar: 'لوحة التحكم',    en: 'Dashboard' },
    ads:                { ar: 'الإعلانات',       en: 'Ads' },
    screens:            { ar: 'الشاشات',         en: 'Screens' },
    financial:          { ar: 'المالية',          en: 'Financial' },
    users:              { ar: 'المستخدمون',      en: 'Users' },
    roles:              { ar: 'الصلاحيات',       en: 'Roles' },
    locations:          { ar: 'المواقع',          en: 'Locations' },
    frequencyPackages:  { ar: 'باقات التكرار',   en: 'Frequency Packages' },
    paymentMethods:     { ar: 'طرق الدفع',       en: 'Payment Methods' },
    paymentOps:         { ar: 'عمليات الدفع',    en: 'Payment Operations' },
    sessions:           { ar: 'الجلسات',          en: 'Sessions' },
    mySessions:         { ar: 'جلساتي',           en: 'My Sessions' },
    settings:           { ar: 'الإعدادات',        en: 'Settings' },
    myFinancials:       { ar: 'السجل المالي',     en: 'My Financials' },
    earnings:           { ar: 'العوائد المالية',  en: 'Earnings' },
    reports:            { ar: 'التقارير',         en: 'Reports' },
    analytics:          { ar: 'التحليلات والأداء', en: 'Analytics & Reports' },
    // Maintenance specific
    nocCenter:          { ar: 'مركز العمليات',    en: 'NOC Center' },
    screenStatus:       { ar: 'حالة الشاشات',     en: 'Screen Status' },
    support:            { ar: 'الدعم والصيانة',   en: 'Support' },
};

const t = (key, lang = 'ar') => NAV_LABELS[key]?.[lang] ?? NAV_LABELS[key]?.ar ?? key;

/**
 * Centralized Navigation Configuration
 * @param {string} roleName
 * @param {string} lang  'ar' | 'en'
 */
export const getNavItems = (roleName, lang = 'ar') => {
    switch (roleName) {
        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
                { path: '/dashboard/ads', icon: Megaphone, label: t('ads', lang) },
                { path: '/dashboard/screens', icon: Monitor, label: t('screens', lang) },
                { path: '/dashboard/financial', icon: Wallet, label: t('financial', lang) },
                { path: '/dashboard/reports/screen', icon: FileText, label: t('reports', lang) },
                { path: '/dashboard/users', icon: Users, label: t('users', lang) },
                { path: '/dashboard/roles', icon: Shield, label: t('roles', lang) },
                { path: '/dashboard/locations', icon: MapPin, label: t('locations', lang) },
                { path: '/dashboard/frequency-packages', icon: Repeat, label: t('frequencyPackages', lang) },
                { path: '/dashboard/payment-methods', icon: CreditCard, label: t('paymentMethods', lang) },
                { path: '/dashboard/payment-ops', icon: DollarSign, label: t('paymentOps', lang) },
                { path: '/dashboard/sessions', icon: ShieldAlert, label: t('sessions', lang) },
                { path: '/dashboard/settings', icon: Settings, label: t('settings', lang) },
            ];
        case ROLES.ADVERTISER:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
                { path: '/dashboard/ads', icon: Megaphone, label: t('ads', lang) },
                { path: '/dashboard/my-financials', icon: CreditCard, label: t('myFinancials', lang) },
                { path: '/dashboard/sessions', icon: ShieldCheck, label: t('mySessions', lang) },
                { path: '/dashboard/settings', icon: Settings, label: t('settings', lang) },
            ];
        case ROLES.SCREEN_OWNER:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
                { path: '/dashboard/screens', icon: Monitor, label: t('screens', lang) },
                { path: '/dashboard/earnings', icon: Wallet, label: t('earnings', lang) },
                { path: '/dashboard/analytics/owner', icon: BarChart2, label: t('analytics', lang) },
                { path: '/dashboard/support', icon: HeadphonesIcon, label: t('support', lang) },
                { path: '/dashboard/sessions', icon: ShieldCheck, label: t('mySessions', lang) },
                { path: '/dashboard/settings', icon: Settings, label: t('settings', lang) },
            ];
        case ROLES.SECRETARY:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
                { path: '/dashboard/ads', icon: Megaphone, label: t('ads', lang) },
                { path: '/dashboard/payment-ops', icon: DollarSign, label: t('paymentOps', lang) },
                { path: '/dashboard/screens', icon: Monitor, label: t('screens', lang) },
                { path: '/dashboard/sessions', icon: ShieldCheck, label: t('mySessions', lang) },
                { path: '/dashboard/settings', icon: Settings, label: t('settings', lang) },
            ];
        case ROLES.MAINTENANCE:
            return [
                { path: '/dashboard',         icon: LayoutDashboard, label: t('nocCenter', lang) },
                { path: '/dashboard/screens', icon: Monitor,         label: t('screenStatus', lang), badge: { value: 2, color: '#dc2626', bg: '#fee2e2', title: 'شاشات منقطعة' } },
                { path: '/dashboard/reports/maintenance', icon: FileText, label: t('reports', lang) },
                { path: '/dashboard/sessions', icon: ShieldCheck,   label: t('mySessions', lang) },
                { path: '/dashboard/settings', icon: Settings,       label: t('settings', lang) },
            ];
        default:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
            ];
    }
};

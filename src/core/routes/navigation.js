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
    UserCog,
} from 'lucide-react';
import { ROLES } from '../../hooks/usePermission';

/* ── Bilingual nav labels ── */
const NAV_LABELS = {
    dashboard:          { ar: 'لوحة التحكم',    en: 'Dashboard' },
    ads:                { ar: 'الإعلانات',       en: 'Ads' },
    adsApproval:        { ar: 'مراجعة الإعلانات',en: 'Ads Approval' },
    screens:            { ar: 'الشاشات',         en: 'Screens' },
    financial:          { ar: 'المالية',          en: 'Financial' },
    users:              { ar: 'المستخدمون',      en: 'Users' },
    roles:              { ar: 'الصلاحيات',       en: 'Roles' },
    locations:          { ar: 'المواقع',          en: 'Locations' },
    packages:           { ar: 'إدارة الباقات',      en: 'Packages' },
    defaultContent:     { ar: 'المحتوى الافتراضي',  en: 'Default Content' },
    paymentMethods:     { ar: 'طرق الدفع',       en: 'Payment Methods' },
    paymentOps:         { ar: 'عمليات الدفع',    en: 'Payment Operations' },
    sessions:           { ar: 'الجلسات',          en: 'Sessions' },
    mySessions:         { ar: 'جلساتي',           en: 'My Sessions' },
    settings:           { ar: 'الإعدادات',        en: 'Settings' },
    myFinancials:       { ar: 'السجل المالي',     en: 'My Financials' },
    earnings:           { ar: 'العوائد المالية',  en: 'Earnings' },
    reports:            { ar: 'التقارير',         en: 'Reports' },
    reportsFinancial:   { ar: 'التقرير المالي',  en: 'Financial Report' },
    reportsAdPerformance: { ar: 'تقرير الأداء', en: 'Ad Performance' },
    analytics:          { ar: 'التحليلات والأداء', en: 'Analytics & Reports' },
    nocCenter:          { ar: 'مركز العمليات',    en: 'NOC Center' },
    screenStatus:       { ar: 'حالة الشاشات',     en: 'Screen Status' },
    support:            { ar: 'الدعم والصيانة',   en: 'Support' },

    // Group labels
    groupUserManagement: { ar: 'إدارة المستخدمين', en: 'User Management' },
    groupContent:        { ar: 'المحتوى والشاشات',  en: 'Content & Screens' },
    groupPayments:       { ar: 'المدفوعات',         en: 'Payments' },
    groupSystem:         { ar: 'النظام',             en: 'System' },
};

const t = (key, lang = 'ar') => NAV_LABELS[key]?.[lang] ?? NAV_LABELS[key]?.ar ?? key;

/**
 * A nav item with optional group membership.
 * type: 'link' | 'group'
 * If type === 'group': { type, id, label, icon, children: NavItem[] }
 * If type === 'link':  { type, path, icon, label, badge? }
 */

/**
 * Centralized Navigation Configuration
 * @param {number} roleId
 * @param {string} lang  'ar' | 'en'
 */
export const getNavItems = (roleId, lang = 'ar') => {
    switch (roleId) {
        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:
            return [
                { type: 'link', path: '/dashboard',           icon: LayoutDashboard, label: t('dashboard', lang) },
                { type: 'link', path: '/dashboard/ads',        icon: Megaphone,       label: t('ads', lang) },
                { type: 'link', path: '/dashboard/screens',    icon: Monitor,         label: t('screens', lang) },
                { type: 'link', path: '/dashboard/financial',  icon: Wallet,          label: t('financial', lang) },
                { type: 'link', path: '/dashboard/reports',    icon: FileText,        label: t('reports', lang) },

                // ── Collapsible Group: إدارة المستخدمين ──
                {
                    type: 'group',
                    id: 'user-management',
                    icon: UserCog,
                    label: t('groupUserManagement', lang),
                    children: [
                        { type: 'link', path: '/dashboard/users',     icon: Users,   label: t('users', lang) },
                        { type: 'link', path: '/dashboard/roles',     icon: Shield,  label: t('roles', lang) },
                        { type: 'link', path: '/dashboard/sessions',  icon: ShieldAlert, label: t('sessions', lang) },
                    ],
                },

                // ── Collapsible Group: المحتوى والشاشات ──
                {
                    type: 'group',
                    id: 'content-screens',
                    icon: Layers,
                    label: t('groupContent', lang),
                    children: [
                        { type: 'link', path: '/dashboard/locations',        icon: MapPin,  label: t('locations', lang) },
                        { type: 'link', path: '/dashboard/packages',         icon: Layers,  label: t('packages', lang) },
                        { type: 'link', path: '/dashboard/default-content',  icon: Repeat,  label: t('defaultContent', lang) },
                    ],
                },

                // ── Collapsible Group: المدفوعات ──
                {
                    type: 'group',
                    id: 'payments',
                    icon: DollarSign,
                    label: t('groupPayments', lang),
                    children: [
                        { type: 'link', path: '/dashboard/payment-methods', icon: CreditCard,  label: t('paymentMethods', lang) },
                        { type: 'link', path: '/dashboard/payment-ops',     icon: DollarSign,  label: t('paymentOps', lang) },
                    ],
                },

                { type: 'link', path: '/dashboard/settings', icon: Settings, label: t('settings', lang) },
            ];

        case ROLES.ADVERTISER:
            return [
                { type: 'link', path: '/dashboard',              icon: LayoutDashboard, label: t('dashboard', lang) },
                { type: 'link', path: '/dashboard/ads',           icon: Megaphone,       label: t('ads', lang) },
                { type: 'link', path: '/dashboard/my-financials', icon: CreditCard,      label: t('myFinancials', lang) },
                { type: 'link', path: '/dashboard/sessions',      icon: ShieldCheck,     label: t('mySessions', lang) },
                { type: 'link', path: '/dashboard/settings',      icon: Settings,        label: t('settings', lang) },
            ];

        case ROLES.SCREEN_OWNER:
            return [
                { type: 'link', path: '/dashboard',                  icon: LayoutDashboard, label: t('dashboard', lang) },
                { type: 'link', path: '/dashboard/screens',           icon: Monitor,         label: t('screens', lang) },
                { type: 'link', path: '/dashboard/earnings',          icon: Wallet,          label: t('earnings', lang) },
                { type: 'link', path: '/dashboard/analytics/owner',   icon: BarChart2,       label: t('analytics', lang) },
                { type: 'link', path: '/dashboard/support',           icon: HeadphonesIcon,  label: t('support', lang) },
                { type: 'link', path: '/dashboard/sessions',          icon: ShieldCheck,     label: t('mySessions', lang) },
                { type: 'link', path: '/dashboard/settings',          icon: Settings,        label: t('settings', lang) },
            ];

        case ROLES.SECRETARY:
            return [
                { type: 'link', path: '/dashboard',              icon: LayoutDashboard, label: t('dashboard', lang) },
                { type: 'link', path: '/dashboard/ads',           icon: Megaphone,       label: t('ads', lang) },
                { type: 'link', path: '/dashboard/payment-ops',   icon: DollarSign,      label: t('paymentOps', lang) },
                { type: 'link', path: '/dashboard/screens',       icon: Monitor,         label: t('screens', lang) },
                { type: 'link', path: '/dashboard/reports',       icon: FileText,        label: t('reports', lang) },
                { type: 'link', path: '/dashboard/sessions',      icon: ShieldCheck,     label: t('mySessions', lang) },
                { type: 'link', path: '/dashboard/settings',      icon: Settings,        label: t('settings', lang) },
            ];

        case ROLES.MAINTENANCE:
            return [
                { type: 'link', path: '/dashboard',         icon: LayoutDashboard, label: t('nocCenter', lang) },
                { type: 'link', path: '/dashboard/screens', icon: Monitor, label: t('screenStatus', lang), badge: { value: 2, color: '#dc2626', bg: '#fee2e2', title: 'شاشات منقطعة' } },
                { type: 'link', path: '/dashboard/reports', icon: FileText, label: t('reports', lang) },
                { type: 'link', path: '/dashboard/sessions', icon: ShieldCheck, label: t('mySessions', lang) },
                { type: 'link', path: '/dashboard/settings', icon: Settings, label: t('settings', lang) },
            ];

        default:
            return [
                { type: 'link', path: '/dashboard', icon: LayoutDashboard, label: t('dashboard', lang) },
            ];
    }
};

/** Flatten all nav items (including group children) to get a flat list for keyboard nav / quick access */
export const getFlatNavItems = (roleId, lang = 'ar') => {
    const items = getNavItems(roleId, lang);
    const flat = [];
    for (const item of items) {
        if (item.type === 'group') {
            flat.push(...item.children);
        } else {
            flat.push(item);
        }
    }
    return flat;
};

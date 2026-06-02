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
    Repeat
} from 'lucide-react';
import { ROLES } from '../../hooks/usePermission';

/**
 * Centralized Navigation Configuration
 */
export const getNavItems = (roleName) => {
    switch (roleName) {
        case ROLES.SUPER_ADMIN:
        case ROLES.ADMIN:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
                { path: '/dashboard/ads', icon: Megaphone, label: 'الإعلانات' },
                { path: '/dashboard/screens', icon: Monitor, label: 'الشاشات' },
                { path: '/dashboard/financial', icon: Wallet, label: 'المالية' },
                { path: '/dashboard/users', icon: Users, label: 'المستخدمون' },
                { path: '/dashboard/roles', icon: Shield, label: 'الصلاحيات' },
                { path: '/dashboard/locations', icon: MapPin, label: 'المواقع' },
                { path: '/dashboard/categories', icon: Layers, label: 'تصنيفات' },
                { path: '/dashboard/peak-hours', icon: Clock, label: 'أوقات الذروة' },
                { path: '/dashboard/frequency-packages', icon: Repeat, label: 'باقات التكرار' },
                { path: '/dashboard/payment-methods', icon: CreditCard, label: 'طرق الدفع' },
                { path: '/dashboard/payment-ops', icon: DollarSign, label: 'عمليات الدفع' },
                { path: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
            ];
        case ROLES.ADVERTISER:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
                { path: '/dashboard/ads', icon: Megaphone, label: 'الإعلانات' },
                { path: '/dashboard/my-financials', icon: CreditCard, label: 'السجل المالي' },
                { path: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
            ];
        case ROLES.SCREEN_OWNER:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
                { path: '/dashboard/screens', icon: Monitor, label: 'الشاشات' },
                { path: '/dashboard/earnings', icon: Wallet, label: 'العوائد المالية' },
                { path: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
            ];
        case ROLES.SECRETARY:
             return [
                { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
                { path: '/dashboard/ads', icon: Megaphone, label: 'الإعلانات' },
                { path: '/dashboard/payment-ops', icon: DollarSign, label: 'عمليات الدفع' },
                { path: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
             ];
        case ROLES.MAINTENANCE:
             return [
                { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
                { path: '/dashboard/screens', icon: Monitor, label: 'الشاشات' },
                { path: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
             ];
        default:
            return [
                { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
            ];
    }
};

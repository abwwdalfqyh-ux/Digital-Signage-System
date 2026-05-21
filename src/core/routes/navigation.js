import { 
    LayoutDashboard, 
    Monitor, 
    MapPin, 
    Users, 
    Settings, 
    Video, 
    FileText,
    MessageSquare,
    Wrench,
    CreditCard,
    Bell
} from 'lucide-react';

/**
 * Centralized Navigation Configuration
 * Defines menu items based on user roles.
 * Roles: 1 (Admin), 2 (Advertiser), 3 (Screen Owner), 4 (Employee), 5 (Maintenance)
 */
export const navigationConfig = {
    // Admin/SuperAdmin: صلاحيات كاملة لإدارة المواقع والسياسات
    'SuperAdmin': [
        { id: 'overview', label: 'نظرة عامة', path: '/dashboard', icon: LayoutDashboard },
        { id: 'screens', label: 'إدارة الشاشات', path: '/dashboard/screens', icon: Monitor },
        { id: 'locations', label: 'المواقع الجغرافية', path: '/dashboard/locations', icon: MapPin },
        { id: 'users', label: 'المستخدمين', path: '/dashboard/users', icon: Users },
        { id: 'settings', label: 'إعدادات النظام', path: '/dashboard/settings', icon: Settings },
    ],
    // Advertiser: يركز على الحملات الإعلانية والرفع
    'Advertiser': [
        { id: 'overview', label: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard },
        { id: 'ads', label: 'إعلاناتي', path: '/dashboard/ads', icon: Video },
        { id: 'media', label: 'الوسائط', path: '/dashboard/media', icon: FileText },
        { id: 'finance', label: 'الفواتير', path: '/dashboard/finance', icon: CreditCard },
        { id: 'support', label: 'الدعم الفني', path: '/dashboard/support', icon: MessageSquare },
    ],
    // Screen Owner: يراقب أداء شاشاته وأرباحه
    'ScreenOwner': [
        { id: 'overview', label: 'إحصائياتي', path: '/dashboard', icon: LayoutDashboard },
        { id: 'my-screens', label: 'شاشاتي', path: '/dashboard/screens', icon: Monitor },
        { id: 'earnings', label: 'العوائد المالية', path: '/dashboard/earnings', icon: CreditCard },
    ],
    // Maintenance: إدارة الأعطال والتذاكر
    'Maintenance': [
        { id: 'tasks', label: 'المهام الحالية', path: '/dashboard', icon: Wrench },
        { id: 'tickets', label: 'بلاغات الأعطال', path: '/dashboard/tickets', icon: Bell },
    ]
};

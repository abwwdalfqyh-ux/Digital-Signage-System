import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Monitor, Wallet, Users, Settings, Bell, User as UserIcon, LogOut, Menu, Layers, Shield, DollarSign, CreditCard, Clock } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const DashboardLayout = () => {
    const { user, logout, isAdvertiser, isAdmin } = useAuthStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Define navigation items based on roles
    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم', allowed: true },
        { path: '/dashboard/ads', icon: Megaphone, label: 'الإعلانات', allowed: true },
        { path: '/dashboard/screens', icon: Monitor, label: 'الشاشات', allowed: !isAdvertiser() },
        { path: '/dashboard/financial', icon: Wallet, label: 'المالية', allowed: true },
        { path: '/dashboard/users', icon: Users, label: 'المستخدمون', allowed: isAdmin() },
        { path: '/dashboard/roles', icon: Shield, label: 'الصلاحيات', allowed: isAdmin() },
        { path: '/dashboard/locations', icon: Monitor, label: 'المواقع', allowed: isAdmin() },
        { path: '/dashboard/categories', icon: Layers, label: 'تصنيفات الإعلانات', allowed: isAdmin() },
        { path: '/dashboard/peak-hours', icon: Clock, label: 'أوقات الذروة', allowed: isAdmin() },
        { path: '/dashboard/payment-methods', icon: CreditCard, label: 'طرق الدفع', allowed: isAdmin() },
        { path: '/dashboard/payment-ops', icon: DollarSign, label: 'عمليات الدفع', allowed: isAdmin() },
        { path: '/dashboard/settings', icon: Settings, label: 'الإعدادات', allowed: true },
    ].filter(item => item.allowed);

    return (
        <div className="min-h-screen bg-[var(--color-bg-light)] text-gray-800 flex flex-col font-sans" dir="rtl">
            {/* Top AppBar */}
            <header className="bg-[var(--color-dark-turquoise)] text-white shadow-md relative z-20 rounded-b-[20px]">
                <div className="flex items-center justify-between px-4 h-[70px]">
                    {/* Right side (Desktop Menu Toggle - Optional, usually hidden on mobile) */}
                    <div className="w-[100px] flex items-center">
                        {/* Empty space to balance the center logo, or add a menu button for desktop */}
                    </div>

                    {/* Center Logo */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg p-1">
                        <img 
                            src="/src/assets/images/Main_app_logo.png" 
                            alt="Logo" 
                            className="w-[50px] h-[50px] object-contain rounded-full"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/50?text=Logo';
                            }}
                        />
                    </div>

                    {/* Left Side Actions */}
                    <div className="flex items-center gap-4 w-[100px] justify-end">
                        {/* Notifications */}
                        <div className="relative cursor-pointer">
                            <Bell className="w-[26px] h-[26px] text-white" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[var(--color-dark-turquoise)]"></div>
                        </div>

                        {/* Profile/Logout */}
                        <div 
                            className="w-[32px] h-[32px] rounded-full border-[1.5px] border-[var(--color-gold)] flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors overflow-hidden"
                            onClick={() => navigate('/dashboard/profile')}
                            title="الملف الشخصي"
                        >
                            <UserIcon className="w-5 h-5 text-[var(--color-gold)]" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar (Visible on md and up) */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-200 shadow-sm z-10">
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-[var(--color-dark-turquoise)]">القائمة الرئيسية</h2>
                        <p className="text-xs text-gray-500">{user?.full_name}</p>
                    </div>
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                                        isActive 
                                        ? 'bg-[var(--color-dark-turquoise)] text-white shadow-md' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-[var(--color-dark-turquoise)]'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation (Visible only on small screens) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-30">
                <nav className="flex items-center justify-around">
                    {navItems.slice(0, 5).map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center py-2 w-full transition-colors ${
                                    isActive 
                                    ? 'text-[var(--color-dark-turquoise)]' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`
                            }
                        >
                            <item.icon className={`w-6 h-6 mb-1 ${/* Active state icon variant can be handled here if needed */ ''}`} />
                            <span className={`text-[10px] ${window.location.pathname === item.path || (item.path === '/dashboard' && window.location.pathname === '/dashboard') ? 'font-bold' : ''}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    ))}
                    {/* More Menu for Mobile if items exceed 5 */}
                    {navItems.length > 5 && (
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`flex flex-col items-center justify-center py-2 w-full transition-colors ${isMobileMenuOpen ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-400'}`}
                        >
                            <Menu className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">المزيد</span>
                        </button>
                    )}
                </nav>

                {/* Mobile Extra Menu Overlay */}
                {isMobileMenuOpen && navItems.length > 5 && (
                    <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-2 flex flex-wrap justify-around">
                        {navItems.slice(5).map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center py-3 px-4 m-1 rounded-xl transition-colors ${
                                        isActive 
                                        ? 'bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)]' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <item.icon className="w-6 h-6 mb-1" />
                                <span className="text-[10px] font-bold">{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;

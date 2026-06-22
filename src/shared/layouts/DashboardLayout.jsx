import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, User as UserIcon, Menu, LogOut, Grid, Sun, Moon, Languages } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import usePermission from '../../hooks/usePermission';
import useUIStore from '../../store/useUIStore';
import { getNavItems } from '../../core/routes/navigation';

/* ─── Stitch colour tokens — light ─── */
const LIGHT = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    surface: '#f9f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    surfaceContainerHigh: '#e1e8fd',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
};

/* ─── Stitch colour tokens — dark ─── */
const DARK = {
    primary: '#b4c5ff',
    primaryContainer: '#3b63e8',
    surface: '#0f1117',
    surfaceContainerLowest: '#151720',
    surfaceContainerLow: '#1a1d2a',
    surfaceContainer: '#1f2230',
    surfaceContainerHigh: '#252838',
    onSurface: '#e2e5f0',
    onSurfaceVariant: '#9ea3b8',
    outline: '#5a5e72',
    outlineVariant: '#2e3145',
    error: '#ffb4ab',
};

const SIDEBAR_FULL = 250;
const SIDEBAR_MINI = 68;

/* Labels map — ar / en */
const T = {
    ar: {
        brandSub: 'لوحة تحكم سبأ',
        logout: 'تسجيل الخروج',
        expandSidebar: 'توسيع القائمة',
        collapseSidebar: 'تصغير القائمة',
        darkMode: 'الوضع الليلي',
        lightMode: 'الوضع النهاري',
        switchLang: 'English',
        notifications: 'الإشعارات',
        profile: 'الملف الشخصي',
    },
    en: {
        brandSub: 'Saba Control Panel',
        logout: 'Logout',
        expandSidebar: 'Expand sidebar',
        collapseSidebar: 'Collapse sidebar',
        darkMode: 'Dark mode',
        lightMode: 'Light mode',
        switchLang: 'عربي',
        notifications: 'Notifications',
        profile: 'Profile',
    },
};

/* ──────────────────────────────────────────── */
const DashboardLayout = () => {
    const { user, logout }           = useAuthStore();
    const { roleName }               = usePermission();
    const { theme, toggleTheme, language, toggleLanguage } = useUIStore();
    const navigate = useNavigate();

    const [isMobileMenuOpen,   setIsMobileMenuOpen]   = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    /* Derived */
    const isDark = theme === 'dark';
    const isRTL  = language === 'ar';
    const S      = isDark ? DARK : LIGHT;
    const lbl    = T[language] ?? T.ar;

    const handleLogout = () => { logout(); navigate('/login'); };
    const navItems = getNavItems(roleName);

    /* ── Small icon-button helper (reusable inside header) ── */
    const IconBtn = ({ onClick, title, children }) => (
        <button
            onClick={onClick}
            title={title}
            style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '50%',
                width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s',
                color: S.onSurfaceVariant,
                flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            {children}
        </button>
    );

    /* ─────────────────────────────────────────────
       SidebarInner
    ───────────────────────────────────────────── */
    const SidebarInner = ({ mini = false }) => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* ── Header: toggle + logo + brand ── */}
            <div style={{
                padding: mini ? '18px 0' : '18px 14px 14px',
                borderBottom: '1px solid rgba(220,226,247,0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
            }}>
                {/* Hamburger toggle */}
                <button
                    onClick={() => setIsSidebarCollapsed(p => !p)}
                    title={mini ? lbl.expandSidebar : lbl.collapseSidebar}
                    style={{
                        alignSelf: mini ? 'center' : 'flex-end',
                        background: 'rgba(220,226,247,0.08)',
                        border: '1px solid rgba(220,226,247,0.15)',
                        borderRadius: '8px',
                        width: 34, height: 34,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.15s, transform 0.18s',
                        color: 'rgba(220,226,247,0.75)',
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,226,247,0.15)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,226,247,0.08)'; e.currentTarget.style.color = 'rgba(220,226,247,0.75)'; }}
                    onMouseDown={e  => e.currentTarget.style.transform = 'scale(0.88)'}
                    onMouseUp={e    => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Menu style={{ width: 17, height: 17 }} />
                </button>

                {/* Logo circle */}
                <div style={{
                    width: mini ? 40 : 54, height: mini ? 40 : 54,
                    borderRadius: '50%',
                    background: '#dce2f7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                    transition: 'width 0.3s, height 0.3s',
                }}>
                    <img
                        src="/src/assets/images/Main_app_logo.png"
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={e => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML =
                                '<span style="color:#004ac6;font-size:18px;font-weight:800;font-family:sans-serif">SC</span>';
                        }}
                    />
                </div>

                {/* Brand text — hidden in mini */}
                <div style={{
                    overflow: 'hidden',
                    maxHeight: mini ? '0px' : '60px',
                    opacity: mini ? 0 : 1,
                    transition: 'max-height 0.3s ease, opacity 0.2s ease',
                    textAlign: 'center',
                    width: '100%',
                }}>
                    <h1 style={{
                        margin: 0, fontSize: '19px', fontWeight: 700,
                        color: '#ffffff', whiteSpace: 'nowrap',
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}>SabaControl</h1>
                    <p style={{
                        margin: '2px 0 0', fontSize: '11px',
                        color: 'rgba(220,226,247,0.55)', whiteSpace: 'nowrap',
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}>{lbl.brandSub}</p>
                </div>
            </div>

            {/* ── Nav links ── */}
            <nav style={{
                flex: 1, overflowY: 'auto', overflowX: 'hidden',
                padding: '10px 0',
                display: 'flex', flexDirection: 'column', gap: '2px',
            }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        title={mini ? item.label : ''}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: mini ? 'center' : 'flex-start',
                            gap: mini ? '0' : '13px',
                            padding: mini ? '13px 0' : '11px 18px',
                            fontSize: '15px',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#ffffff' : 'rgba(220,226,247,0.75)',
                            background: isActive ? 'rgba(220,226,247,0.10)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'background 0.15s, color 0.15s',
                            direction: isRTL ? 'rtl' : 'ltr',
                            borderRight: (isActive && isRTL)  ? '3px solid #2563eb' : '3px solid transparent',
                            borderLeft:  (isActive && !isRTL) ? '3px solid #2563eb' : '3px solid transparent',
                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        })}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(220,226,247,0.07)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                            // Only reset if not active
                            if (e.currentTarget.style.fontWeight !== '700') {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(220,226,247,0.75)';
                            }
                        }}
                    >
                        <item.icon style={{ width: 21, height: 21, flexShrink: 0 }} />
                        <span style={{
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: mini ? '0px' : '160px',
                            opacity: mini ? 0 : 1,
                            transition: 'max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
                            display: 'block',
                        }}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* ── Logout ── */}
            <div style={{
                padding: mini ? '12px 0' : '10px 10px 18px',
                borderTop: '1px solid rgba(220,226,247,0.10)',
                display: 'flex', justifyContent: 'center',
            }}>
                <button
                    onClick={handleLogout}
                    title={mini ? lbl.logout : ''}
                    style={{
                        width: mini ? 40 : '100%',
                        height: mini ? 40 : 'auto',
                        padding: mini ? '0' : '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(195,198,215,0.25)',
                        background: 'transparent',
                        color: 'rgba(220,226,247,0.65)',
                        fontSize: '14px', fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        direction: isRTL ? 'rtl' : 'ltr',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        gap: mini ? '0' : '8px',
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(220,226,247,0.08)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = 'rgba(195,198,215,0.5)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(220,226,247,0.65)';
                        e.currentTarget.style.borderColor = 'rgba(195,198,215,0.25)';
                    }}
                >
                    <LogOut style={{ width: 17, height: 17, flexShrink: 0 }} />
                    <span style={{
                        overflow: 'hidden', whiteSpace: 'nowrap',
                        maxWidth: mini ? '0px' : '120px',
                        opacity: mini ? 0 : 1,
                        transition: 'max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
                    }}>
                        {lbl.logout}
                    </span>
                </button>
            </div>
        </div>
    );

    /* ════════════════════════════════════ RENDER ════════════════════════════════════ */
    return (
        <div style={{
            display: 'flex',
            minHeight: '100svh',
            background: S.surface,
            direction: isRTL ? 'rtl' : 'ltr',
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            transition: 'background 0.3s ease, color 0.3s ease',
        }}>
            {/* ════ Desktop Sidebar ════ */}
            <aside
                className="ds-sidebar"
                style={{
                    width: isSidebarCollapsed ? `${SIDEBAR_MINI}px` : `${SIDEBAR_FULL}px`,
                    flexShrink: 0,
                    background: '#141b2b',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'sticky',
                    top: 0,
                    height: '100svh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxShadow: '-2px 0 20px rgba(0,0,0,0.20)',
                    zIndex: 50,
                    transition: 'width 0.32s cubic-bezier(0.4,0,0.2,1)',
                }}
            >
                <SidebarInner mini={isSidebarCollapsed} />
            </aside>

            {/* ════ Main column ════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, direction: isRTL ? 'rtl' : 'ltr' }}>

                {/* ── Top Header ── */}
                <header style={{
                    height: '64px',
                    background: S.surfaceContainerLowest,
                    borderBottom: `1px solid ${S.outlineVariant}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    direction: isRTL ? 'rtl' : 'ltr',
                    transition: 'background 0.3s ease, border-color 0.3s ease',
                }}>
                    {/* ── Right side: mobile hamburger ── */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="mob-toggle"
                        style={{
                            background: S.surfaceContainerLow,
                            border: `1px solid ${S.outlineVariant}`,
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Menu style={{ width: 18, height: 18, color: S.onSurfaceVariant }} />
                    </button>

                    {/* ── Center: App brand ── */}
                    <div
                        onClick={() => navigate('/dashboard')}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: '10px',
                            background: S.primaryContainer,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
                        }}>
                            <img
                                src="/src/assets/images/Main_app_logo.png"
                                alt="Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<span style="color:#fff;font-size:12px;font-weight:800">SC</span>';
                                }}
                            />
                        </div>
                        <div>
                            <p style={{
                                margin: 0, fontSize: '15px', fontWeight: 700,
                                color: S.primary,
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                lineHeight: 1.1,
                            }}>SabaControl</p>
                            <p style={{
                                margin: 0, fontSize: '9px',
                                color: S.outline, textTransform: 'uppercase', letterSpacing: '0.1em',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            }}>Smart Advertising</p>
                        </div>
                    </div>

                    {/* ── Left side: action buttons ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', direction: 'ltr' }}>

                        {/* 🌙 Dark / Light mode toggle */}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? lbl.lightMode : lbl.darkMode}
                            style={{
                                background: isDark ? 'rgba(180,197,255,0.12)' : S.surfaceContainerLow,
                                border: `1px solid ${isDark ? 'rgba(180,197,255,0.22)' : S.outlineVariant}`,
                                borderRadius: '10px',
                                width: 38, height: 38,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: isDark ? '#b4c5ff' : '#f59e0b',
                                flexShrink: 0,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(180,197,255,0.20)' : S.surfaceContainer}
                            onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(180,197,255,0.12)' : S.surfaceContainerLow}
                        >
                            {isDark
                                ? <Sun  style={{ width: 17, height: 17 }} />
                                : <Moon style={{ width: 17, height: 17 }} />
                            }
                        </button>

                        {/* 🌐 Language toggle */}
                        <button
                            onClick={toggleLanguage}
                            title={lbl.switchLang}
                            style={{
                                background: S.surfaceContainerLow,
                                border: `1px solid ${S.outlineVariant}`,
                                borderRadius: '10px',
                                height: 38,
                                padding: '0 10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: S.onSurfaceVariant,
                                fontSize: '12px', fontWeight: 600,
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = S.surfaceContainer;
                                e.currentTarget.style.color = S.onSurface;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = S.surfaceContainerLow;
                                e.currentTarget.style.color = S.onSurfaceVariant;
                            }}
                        >
                            <Languages style={{ width: 15, height: 15 }} />
                            {lbl.switchLang}
                        </button>

                        {/* Notifications */}
                        <IconBtn onClick={() => navigate('/dashboard/notifications')} title={lbl.notifications}>
                            <Bell style={{ width: 19, height: 19 }} />
                            <span style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 7, height: 7, borderRadius: '50%',
                                background: S.error,
                                border: `1.5px solid ${S.surfaceContainerLowest}`,
                            }} />
                        </IconBtn>

                        {/* Grid */}
                        <IconBtn onClick={() => {}} title="">
                            <Grid style={{ width: 17, height: 17 }} />
                        </IconBtn>

                        {/* Divider */}
                        <div style={{ width: 1, height: 26, background: S.outlineVariant, margin: '0 4px' }} />

                        {/* Profile chip */}
                        <button
                            onClick={() => navigate('/dashboard/profile')}
                            title={lbl.profile}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '9px',
                                background: 'transparent',
                                border: `1px solid ${S.outlineVariant}`,
                                borderRadius: '999px',
                                padding: '4px 12px 4px 4px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                direction: isRTL ? 'rtl' : 'ltr',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                                <p style={{
                                    margin: 0, fontSize: '13px', fontWeight: 600,
                                    color: S.onSurface,
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                    lineHeight: 1.2,
                                }}>
                                    {user?.full_name || (isRTL ? 'مدير النظام' : 'System Admin')}
                                </p>
                                <p style={{
                                    margin: 0, fontSize: '10px', color: S.onSurfaceVariant,
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                }}>
                                    {roleName || 'Admin'}
                                </p>
                            </div>
                            <div style={{
                                width: 30, height: 30, borderRadius: '50%',
                                background: S.surfaceContainerHigh,
                                border: `1.5px solid ${S.outlineVariant}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <UserIcon style={{ width: 15, height: 15, color: S.primary }} />
                            </div>
                        </button>
                    </div>
                </header>

                {/* ── Page Content ── */}
                <main
                    className="custom-scrollbar"
                    style={{
                        flex: 1, overflowY: 'auto',
                        padding: '24px 28px 56px',
                        direction: isRTL ? 'rtl' : 'ltr',
                        background: S.surface,
                        transition: 'background 0.3s ease',
                    }}
                >
                    <div style={{ maxWidth: '1400px', margin: '0 auto', direction: isRTL ? 'rtl' : 'ltr' }}>
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* ════ Mobile Overlay ════ */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {/* ════ Mobile Drawer ════ */}
            <div style={{
                position: 'fixed',
                top: 0,
                [isRTL ? 'right' : 'left']: 0,
                bottom: 0,
                width: '250px',
                background: '#141b2b',
                zIndex: 110,
                transform: isMobileMenuOpen ? 'translateX(0)' : (isRTL ? 'translateX(100%)' : 'translateX(-100%)'),
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isMobileMenuOpen ? (isRTL ? '-4px 0 24px rgba(0,0,0,0.25)' : '4px 0 24px rgba(0,0,0,0.25)') : 'none',
            }}>
                <SidebarInner mini={false} />
            </div>

            {/* ════ Mobile Bottom Nav ════ */}
            <div
                className="mob-bottom"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    height: '60px',
                    background: '#141b2b',
                    borderTop: '1px solid rgba(220,226,247,0.12)',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    zIndex: 90,
                }}
            >
                {navItems.slice(0, 5).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        style={({ isActive }) => ({
                            flex: 1,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '3px',
                            textDecoration: 'none',
                            color: isActive ? '#3b63e8' : 'rgba(220,226,247,0.5)',
                            fontSize: '9px',
                            fontWeight: isActive ? 700 : 400,
                            borderTop: isActive ? '2px solid #3b63e8' : '2px solid transparent',
                            padding: '6px 0',
                            transition: 'all 0.15s',
                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        })}
                    >
                        <item.icon style={{ width: 20, height: 20 }} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Responsive CSS */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

                @media (min-width: 768px) {
                    .ds-sidebar { display: flex !important; }
                    .mob-toggle { display: none  !important; }
                    .mob-bottom { display: none  !important; }
                }
                @media (max-width: 767px) {
                    .ds-sidebar { display: none  !important; }
                    .mob-bottom { display: flex  !important; }
                    main        { padding-bottom: 72px !important; }
                    .mob-toggle { display: flex  !important; }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;

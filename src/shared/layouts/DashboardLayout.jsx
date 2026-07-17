import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, User as UserIcon, Menu, LogOut, Grid, Sun, Moon, Languages, Users, Plus, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import usePermission from '../../hooks/usePermission';
import useUIStore from '../../store/useUIStore';
import { getNavItems } from '../../core/routes/navigation';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import echo from '../../core/api/echo';
import useToastStore from '../../store/useToastStore';
import { useQueryClient } from '@tanstack/react-query';
import { SETTINGS_QUERY_KEY } from '../../hooks/api/useSettings';
import useTranslation from '../../i18n/useTranslation';

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

/* Labels map — now powered by useTranslation hook */

/* ──────────────────────────────────────────── */
const DashboardLayout = () => {
    const { user, logout, impersonatedRole, setImpersonatedRole } = useAuthStore();
    const addToast = useToastStore(s => s.addToast);
    const queryClient = useQueryClient();
    const { roleId, roleName } = usePermission();
    const { theme, toggleTheme, language, setLanguage } = useUIStore();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
    const roleMenuRef = useRef(null);

    /* ── Quick Access Launcher State ── */
    const maxItems = 4;
    const [isLauncherOpen, setIsLauncherOpen] = useState(false);
    const launcherRef = useRef(null);
    const [isAddingShortcut, setIsAddingShortcut] = useState(false);
    
    // Pass roleId to getNavItems instead of roleName
    const navItems = getNavItems(roleId, language);
    const launchableItems = navItems.filter(i => i.path !== '/dashboard');

    const [savedPaths, setSavedPaths] = useState(() => {
        try {
            const val = localStorage.getItem(`qa_${roleId}`);
            if (val) return JSON.parse(val);
        } catch(e) {}
        return launchableItems.slice(0, maxItems).map(i => i.path);
    });

    useEffect(() => {
        localStorage.setItem(`qa_${roleId}`, JSON.stringify(savedPaths));
    }, [savedPaths, roleId]);

    /* Close launchers on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
                setIsRoleMenuOpen(false);
            }
            if (launcherRef.current && !launcherRef.current.contains(e.target)) {
                setIsLauncherOpen(false);
                setIsAddingShortcut(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* WebSockets Real-time Notifications & Settings */
    useEffect(() => {
        if (!user) return;
        
        // Notification Channel
        const userChannel = echo.private(`user.${user.user_id}`);
        userChannel.listen('NotificationSent', (e) => {
            setUnreadCount(prev => prev + 1);
            let title = t('common.new notification');
            try {
                const parsed = JSON.parse(e.notification.title);
                if (parsed.key) {
                    if (parsed.key === 'notif title payout requested') title = t('notifications.payout_requested');
                    else if (parsed.key === 'notif title payout approved') title = t('notifications.payout_approved');
                    else if (parsed.key === 'notif title payout rejected') title = t('notifications.payout_rejected');
                }
            } catch (err) {}
            
            addToast(`🔔 ${title}`, 'info');
        });

        // Global System Channel
        const systemChannel = echo.channel('system.settings');
        systemChannel.listen('SettingsUpdated', (e) => {
            // Update the React Query cache immediately with the new settings
            if (e.settings) {
                queryClient.setQueryData(SETTINGS_QUERY_KEY, e.settings);
            } else {
                queryClient.invalidateQueries(SETTINGS_QUERY_KEY);
            }
        });

        return () => {
            echo.leave(`user.${user.user_id}`);
            echo.leave('system.settings');
        };
    }, [user, addToast, queryClient, t]);

    /* Fetch unread notifications count */
    useEffect(() => {
        let isMounted = true;
        const fetchUnread = async () => {
            try {
                const res = await axiosClient.get(ENDPOINTS.NOTIFICATIONS.ALL);
                if (isMounted && res.data?.success) {
                    setUnreadCount(res.data.unread_count || 0);
                }
            } catch (error) {
                console.error("Failed to fetch unread count:", error);
            }
        };

        fetchUnread();
        const intervalId = setInterval(fetchUnread, 60000); // Poll every minute

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const canImpersonate = roleId === 1 || roleId === 7; // SuperAdmin or Admin

    /* Derived */
    const isDark = theme === 'dark';
    const isRTL = language === 'ar';
    const S = isDark ? DARK : LIGHT;
    const lbl = {
        brandSub: t('layout.brand_sub'),
        logout: t('layout.logout'),
        expandSidebar: t('layout.expand_sidebar'),
        collapseSidebar: t('layout.collapse_sidebar'),
        darkMode: t('layout.dark_mode'),
        lightMode: t('layout.light_mode'),
        switchLang: t('layout.switch_lang'),
        notifications: t('layout.notifications'),
        profile: t('layout.profile'),
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const activeLaunchItems = savedPaths.map(p => launchableItems.find(i => i.path === p)).filter(Boolean);
    const availableLaunchItems = launchableItems.filter(i => !savedPaths.includes(i.path));

    /* ── Small icon-button helper (reusable inside header) ── */
    const IconBtn = ({ onClick, title, children }) => (
        <button
            onClick={onClick}
            title={title}
            style={{
                position: 'relative',
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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden' }}>

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
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
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
                        src="/Main_app_logo.png"
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
                            borderRight: (isActive && isRTL) ? '3px solid #2563eb' : '3px solid transparent',
                            borderLeft: (isActive && !isRTL) ? '3px solid #2563eb' : '3px solid transparent',
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
                            maxWidth: mini ? '0px' : '140px',
                            opacity: mini ? 0 : 1,
                            transition: 'max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
                            display: 'block',
                            flex: 1,
                        }}>
                            {item.label}
                        </span>
                        {/* Badge indicator for items like offline screens count */}
                        {item.badge && item.badge.value > 0 && (
                            <span
                                title={item.badge.title}
                                style={{
                                    fontSize: '10px', fontWeight: 800,
                                    minWidth: 18, height: 18,
                                    borderRadius: 99,
                                    background: item.badge.color,
                                    color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '0 5px',
                                    flexShrink: 0,
                                    opacity: mini ? 0 : 1,
                                    maxWidth: mini ? '0px' : '40px',
                                    overflow: 'hidden',
                                    transition: 'opacity 0.2s ease, max-width 0.3s',
                                    animation: 'badgePulse 2.5s ease-in-out infinite',
                                }}
                            >
                                {item.badge.value}
                            </span>
                        )}
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
                    overflowY: 'hidden',
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
                                src="/Main_app_logo.png"
                                alt="SabaControl Logo"
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
                                ? <Sun style={{ width: 17, height: 17 }} />
                                : <Moon style={{ width: 17, height: 17 }} />
                            }
                        </button>

                        {/* 🌐 Language buttons: EN | عربي */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: S.surfaceContainerLow,
                            border: `1px solid ${S.outlineVariant}`,
                            borderRadius: '10px',
                            overflow: 'hidden',
                            flexShrink: 0,
                        }}>
                            {/* English button */}
                            <button
                                onClick={() => setLanguage('en')}
                                style={{
                                    height: 38,
                                    padding: '0 11px',
                                    border: 'none',
                                    borderRight: `1px solid ${S.outlineVariant}`,
                                    background: language === 'en' ? S.primary : 'transparent',
                                    color: language === 'en' ? '#ffffff' : S.onSurfaceVariant,
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                    cursor: language === 'en' ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    letterSpacing: '0.02em',
                                }}
                                onMouseEnter={e => {
                                    if (language !== 'en') {
                                        e.currentTarget.style.background = S.surfaceContainer;
                                        e.currentTarget.style.color = S.onSurface;
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (language !== 'en') {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = S.onSurfaceVariant;
                                    }
                                }}
                            >
                                English
                            </button>

                            {/* Arabic button */}
                            <button
                                onClick={() => setLanguage('ar')}
                                style={{
                                    height: 38,
                                    padding: '0 11px',
                                    border: 'none',
                                    background: language === 'ar' ? S.primary : 'transparent',
                                    color: language === 'ar' ? '#ffffff' : S.onSurfaceVariant,
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                    cursor: language === 'ar' ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    direction: 'rtl',
                                }}
                                onMouseEnter={e => {
                                    if (language !== 'ar') {
                                        e.currentTarget.style.background = S.surfaceContainer;
                                        e.currentTarget.style.color = S.onSurface;
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (language !== 'ar') {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = S.onSurfaceVariant;
                                    }
                                }}
                            >
                                عربي
                            </button>
                        </div>

                        {/* Notifications */}
                        <IconBtn onClick={() => navigate('/dashboard/notifications')} title={lbl.notifications}>
                            <Bell style={{ width: 19, height: 19 }} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: 4, right: 4,
                                    minWidth: 16, height: 16, borderRadius: 8,
                                    background: S.error, color: '#fff',
                                    fontSize: '10px', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: `1.5px solid ${S.surfaceContainerLowest}`,
                                    padding: '0 4px',
                                    pointerEvents: 'none'
                                }}>
                                    {unreadCount > 99 ? '+99' : unreadCount}
                                </span>
                            )}
                        </IconBtn>

                        <style>{`
                            @keyframes launcherIn {
                                from { opacity: 0; transform: scale(0.95) translateY(-6px); }
                                to   { opacity: 1; transform: scale(1)   translateY(0); }
                            }
                        `}</style>

                        {/* ██ Quick Access App Launcher ██ */}
                        <div ref={launcherRef} style={{ position: 'relative' }}>
                            <IconBtn 
                                onClick={() => { setIsLauncherOpen(!isLauncherOpen); setIsAddingShortcut(false); }} 
                                title={t('common.quick_access')}
                            >
                                <Grid style={{
                                    width: 17, height: 17,
                                    color: isLauncherOpen ? S.primaryContainer : S.onSurfaceVariant,
                                    transition: 'color 0.2s',
                                }} />
                            </IconBtn>
                            {isLauncherOpen && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 8px)', [isRTL ? 'left' : 'right']: 0,
                                    width: '280px', background: S.surfaceContainerLowest, border: `1px solid ${S.outlineVariant}`,
                                    borderRadius: '16px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                                    zIndex: 999,
                                    animation: 'launcherIn 0.18s cubic-bezier(0.4,0,0.2,1)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: S.onSurface, fontFamily: "'IBM Plex Sans Arabic'" }}>
                                            {t('common.quick_access')}
                                        </span>
                                        {activeLaunchItems.length < maxItems && (
                                            <button
                                                onClick={() => setIsAddingShortcut(!isAddingShortcut)}
                                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: S.primaryContainer, fontSize: '12px', fontWeight: 600, padding: 0 }}
                                            >
                                                + {t('common.add')}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {!isAddingShortcut ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                            {activeLaunchItems.map((item) => (
                                                <div key={item.path} style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => { navigate(item.path); setIsLauncherOpen(false); }}
                                                        style={{
                                                            width: '100%', height: '70px',
                                                            background: S.surfaceContainerLow, border: 'none', borderRadius: '12px',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                            cursor: 'pointer', transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainer}
                                                        onMouseLeave={e => e.currentTarget.style.background = S.surfaceContainerLow}
                                                    >
                                                        <item.icon style={{ width: 22, height: 22, color: S.primary }} />
                                                    </button>
                                                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: S.onSurfaceVariant, textAlign: 'center', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.label}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSavedPaths(savedPaths.filter(p => p !== item.path)); }}
                                                        style={{ position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: '50%', background: S.error, color: '#fff', border: `2px solid ${S.surfaceContainerLowest}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', display: 'flex' }}
                                                    >
                                                        <X style={{ width: 10, height: 10 }} />
                                                    </button>
                                                </div>
                                            ))}
                                            {/* Empty placeholders */}
                                            {Array.from({ length: maxItems - activeLaunchItems.length }).map((_, idx) => (
                                                <div key={`empty-${idx}`} style={{ width: '100%', height: '70px', border: `2px dashed ${S.outlineVariant}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Plus style={{ width: 16, height: 16, color: S.outlineVariant }} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {availableLaunchItems.length === 0 && (
                                                <div style={{ fontSize: '12px', color: S.outline, textAlign: 'center' }}>
                                                    {t('common.all interfaces added')}
                                                </div>
                                            )}
                                            {availableLaunchItems.map(item => (
                                                <button
                                                    key={item.path}
                                                    onClick={() => { setSavedPaths([...savedPaths, item.path]); setIsAddingShortcut(false); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', border: 'none', background: S.surfaceContainerLow, cursor: 'pointer', direction: isRTL ? 'rtl' : 'ltr' }}
                                                >
                                                    <item.icon style={{ width: 16, height: 16, color: S.primaryContainer }} />
                                                    <span style={{ fontSize: '12px', fontWeight: 600, color: S.onSurface, fontFamily: "'IBM Plex Sans Arabic'" }}>
                                                        {item.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ██ Role Switcher (Admin Only) ██ */}
                        {canImpersonate && (
                            <div ref={roleMenuRef} style={{ position: 'relative' }}>
                                <IconBtn
                                    onClick={() => { setIsRoleMenuOpen(p => !p); }}
                                    title={t('common.switch role preview')}
                                >
                                    <Users style={{
                                        width: 17, height: 17,
                                        color: impersonatedRole ? S.error : (isRoleMenuOpen ? S.primaryContainer : S.onSurfaceVariant),
                                        transition: 'color 0.2s',
                                    }} />
                                </IconBtn>

                                {isRoleMenuOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        [isRTL ? 'left' : 'right']: 0,
                                        width: '200px',
                                        background: S.surfaceContainerLowest,
                                        border: `1px solid ${S.outlineVariant}`,
                                        borderRadius: '16px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                                        zIndex: 999,
                                        overflow: 'hidden',
                                        animation: 'launcherIn 0.18s cubic-bezier(0.4,0,0.2,1)',
                                    }}>
                                        <div style={{ 
                                            padding: '12px 16px', 
                                            borderBottom: `1px solid ${S.outlineVariant}`,
                                            background: S.surfaceContainerLow,
                                            textAlign: 'center'
                                        }}>
                                            <span style={{ fontSize: '13px', fontWeight: 800, color: S.primary, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                                {t('common.preview_system_as')}
                                            </span>
                                        </div>
                                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {[
                                                { id: null, label: t('common.role admin reset') },
                                                { id: 2, label: t('common.role advertiser') },
                                                { id: 3, label: t('common.role screen owner') },
                                                { id: 6, label: t('common.role secretary') },
                                                { id: 4, label: t('common.role maintenance') }
                                            ].map(r => (
                                                <button
                                                    key={r.id || 'admin'}
                                                    onClick={() => {
                                                        setImpersonatedRole(r.id);
                                                        setIsRoleMenuOpen(false);
                                                        navigate('/dashboard'); // jump home to reload layout correctly
                                                    }}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderRadius: '8px', border: 'none',
                                                        background: (impersonatedRole === r.id || (r.id === null && !impersonatedRole)) ? S.primaryContainer : 'transparent',
                                                        color: (impersonatedRole === r.id || (r.id === null && !impersonatedRole)) ? '#fff' : S.onSurface,
                                                        textAlign: 'center',
                                                        fontSize: '13px', fontWeight: 600,
                                                        cursor: 'pointer', transition: 'all 0.2s',
                                                        direction: isRTL ? 'rtl' : 'ltr',
                                                        fontFamily: "'IBM Plex Sans Arabic', sans-serif"
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (impersonatedRole !== r.id && (r.id !== null || impersonatedRole)) e.currentTarget.style.background = S.surfaceContainerLow;
                                                    }}
                                                    onMouseLeave={e => {
                                                        if (impersonatedRole !== r.id && (r.id !== null || impersonatedRole)) e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
                                    {user?.full_name || t('common.system admin')}
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
                    <div style={{ maxWidth: '100%', margin: '0 auto', direction: isRTL ? 'rtl' : 'ltr' }}>
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';

const AdminProfilePage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [logoutHover, setLogoutHover] = useState(false);

    const handleLogout = async () => {
        if (window.confirm('هل أنت متأكد أنك تريد الخروج من التطبيق؟')) {
            try {
                await axiosClient.post(ENDPOINTS.AUTH.LOGOUT);
            } catch (e) {
                console.error('Logout API failed', e);
            } finally {
                logout();
                navigate('/login');
            }
        }
    };

    const fullName = user?.full_name || 'أوس';
    const email    = user?.email            || 'and@gmail.com';
    const phone    = user?.phone            || '7701244071';
    const roleName = user?.role?.role_name  || 'SuperAdmin';
    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })
        : 'يناير 2024';

    /* ── Settings rows data ── */
    const settingsRows = [
        {
            id: 'edit-profile',
            icon: 'manage_accounts',
            iconColor: 'text-primary',
            iconBg: 'bg-primary/10',
            label: 'تعديل البيانات الشخصية',
            description: 'تحديث الاسم والصورة والبيانات الأساسية',
            badge: null,
            action: () => navigate('/dashboard/settings'),
            destructive: false,
        },
        {
            id: 'change-password',
            icon: 'lock_reset',
            iconColor: 'text-secondary',
            iconBg: 'bg-secondary/10',
            label: 'تغيير كلمة المرور',
            description: 'تعديل كلمة المرور لحماية حسابك',
            badge: null,
            action: () => navigate('/dashboard/settings'),
            destructive: false,
        },
        {
            id: 'logout',
            icon: 'logout',
            iconColor: 'text-error',
            iconBg: 'bg-error/10',
            label: 'تسجيل الخروج',
            description: 'إنهاء الجلسة الحالية وتسجيل الخروج من النظام',
            badge: null,
            action: handleLogout,
            destructive: true,
        },
    ];

    return (
        <div className="space-y-4 pb-8" dir="rtl">

            {/* ══════════════════════════════════════
                Page Header
            ══════════════════════════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2 mb-1">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-on-surface mb-0.5 flex items-center gap-2">
                        الملف الشخصي
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-base">account_circle</span>
                        </div>
                    </h1>
                    <p className="text-on-surface-variant text-sm">
                        إدارة معلومات حسابك الشخصي وإعدادات الأمان.
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════
                Hero Banner
            ══════════════════════════════════════ */}
            <div
                className="rounded-xl overflow-hidden relative"
                style={{
                    background: 'linear-gradient(135deg, #5b9bd5 0%, #4a7fc1 45%, #3460a8 100%)',
                    minHeight: 120,
                }}
            >
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-10 bg-white -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full opacity-10 bg-white translate-x-1/4 translate-y-1/4 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center gap-4 p-5">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
                    </div>

                    {/* Name & role */}
                    <div className="text-center md:text-right">
                        <h2 className="text-lg font-bold text-white mb-1">{fullName}</h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-medium backdrop-blur-sm">
                            <span className="material-symbols-outlined text-[13px]">verified_user</span>
                            @{roleName}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════
                KPI Info Cards
            ══════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Email */}
                <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="text-xs text-on-surface-variant mb-1.5">البريد الإلكتروني</p>
                        <p className="text-sm font-semibold text-on-surface break-all">{email}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-lg">mail</span>
                    </div>
                </div>

                {/* Phone */}
                <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="text-xs text-on-surface-variant mb-1.5">رقم الهاتف</p>
                        <p className="text-sm font-semibold text-on-surface" style={{ direction: 'ltr', textAlign: 'right' }}>{phone}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
                        <span className="material-symbols-outlined text-lg">call</span>
                    </div>
                </div>

                {/* Join date */}
                <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="text-xs text-on-surface-variant mb-1.5">تاريخ الانضمام</p>
                        <p className="text-sm font-semibold text-on-surface">{joinDate}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                    </div>
                </div>
            </div>



            {/* ══════════════════════════════════════
                Account Settings — Stitch Table
            ══════════════════════════════════════ */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">

                {/* Table header */}
                <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
                    <h3 className="text-base font-semibold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-primary">settings</span>
                        إعدادات الحساب
                    </h3>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-surface-container-low border-b border-outline-variant">
                            <tr>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap">
                                    الإجراء
                                </th>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap hidden md:table-cell">
                                    الوصف
                                </th>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap text-left">
                                    تنفيذ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant text-sm">
                            {settingsRows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-surface-container-lowest transition-colors group"
                                >
                                    {/* Label + Icon */}
                                    <td className="py-3 px-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-full ${row.iconBg} ${row.iconColor} flex items-center justify-center flex-shrink-0`}>
                                                <span className="material-symbols-outlined text-[16px]">{row.icon}</span>
                                            </div>
                                            <span className={`font-medium ${row.destructive ? 'text-error' : 'text-on-surface'}`}>
                                                {row.label}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Description */}
                                    <td className="py-3 px-5 text-on-surface-variant text-xs hidden md:table-cell">
                                        {row.description}
                                    </td>

                                    {/* Action button */}
                                    <td className="py-3 px-5 text-left">
                                        <button
                                            type="button"
                                            onClick={row.action}
                                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                                row.destructive
                                                    ? 'text-error hover:bg-error/10'
                                                    : 'text-primary hover:bg-primary/10'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                {row.destructive ? 'logout' : 'arrow_back_ios'}
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AdminProfilePage;

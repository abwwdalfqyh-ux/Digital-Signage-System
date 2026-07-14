import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import Modal from '../../shared/components/Modal';
import useToastStore from '../../store/useToastStore';
import { useUsers, useCreateUser, useUpdateUser, useUpdateUserRole, useUpdateUserStatus, useDeleteUser } from '../../hooks/api/useUsers';
import { useRoles } from '../../hooks/api/useLookups';

const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-surface border border-outline-variant rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] transition-shadow">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {icon}
            </span>
        </div>
        <div>
            <p className="font-caption text-caption text-on-surface-variant mb-1">{title}</p>
            <p className="font-title-lg text-title-lg text-on-surface">{value}</p>
        </div>
    </div>
);

const UsersPage = () => {
    const { data: users = [], isLoading: usersLoading } = useUsers();
    const { data: roles = [] } = useRoles();
    
    const { mutateAsync: createUser } = useCreateUser();
    const { mutateAsync: updateUser } = useUpdateUser();
    const { mutateAsync: updateUserRole } = useUpdateUserRole();
    const { mutateAsync: updateUserStatus } = useUpdateUserStatus();
    const { mutateAsync: deleteUser } = useDeleteUser();

    const loading = usersLoading;
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [modalConfig, setModalConfig] = useState({ open: false, type: '', user: null });
    const addToast = useToastStore(state => state.addToast);
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterLocation, setFilterLocation] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role_id: '',
        location: '',
        bank_name: '',
        account_name: '',
        account_number: ''
    });

    const handleDelete = async () => {
        try {
            await deleteUser(deleteTarget);
            setDeleteTarget(null);
        } catch (e) {
            // Handled by mutation hook
        }
    };

    const handleRowClick = (e, item) => {
        if (e.detail === 3) {
            handleOpenModal('details', item);
        }
    };

    const handleToggleStatus = async (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        const newStatus = (item.account_status === 'Active' || !item.account_status) ? 'Suspended' : 'Active';
        try {
            await updateUserStatus({ id: item.user_id, payload: { account_status: newStatus } });
        } catch (error) {
            // Handled by mutation hook
        }
    };

    const handleOpenModal = (type, user = null) => {
        if (type === 'edit-role') {
            setForm({
                role_id: user.role_id || user.role?.role_id || '',
                bank_name: '',
                account_name: '',
                account_number: ''
            });
        } else if (type === 'edit') {
            setForm({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                password: '', // Leave blank to not change password
                role_id: user.role_id || user.role?.role_id || '',
                location: user.location || '',
                bank_name: user.bank_name || '',
                account_name: user.account_name || '',
                account_number: user.account_number || ''
            });
            setShowPassword(false);
        } else {
            setForm({
                full_name: '',
                email: '',
                phone: '',
                password: '',
                role_id: '',
                location: '',
                bank_name: '',
                account_name: '',
                account_number: ''
            });
            setShowPassword(false);
        }
        setModalConfig({ open: true, type, user });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (modalConfig.type === 'add') {
                await createUser(form);
            } else if (modalConfig.type === 'edit') {
                await updateUser({ id: modalConfig.user.user_id, payload: form });
            } else if (modalConfig.type === 'edit-role') {
                await updateUserRole({ id: modalConfig.user.user_id, payload: {
                    role_id: form.role_id,
                    bank_name: form.bank_name,
                    account_name: form.account_name,
                    account_number: form.account_number
                }});
            }
            setModalConfig({ open: false, type: '', user: null });
        } catch (error) {
            // Error is handled by mutation hooks
        } finally {
            setFormLoading(false);
        }
    };

    const inputClass = "w-full bg-background border border-outline-variant rounded-lg py-2 px-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow text-right";
    const labelClass = "font-label-md text-label-md text-on-surface-variant mb-2 block";

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = React.useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig.key !== null) {
            sortableUsers.sort((a, b) => {
                const getVal = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
                let aValue = getVal(a, sortConfig.key) || '';
                let bValue = getVal(b, sortConfig.key) || '';
                if (typeof aValue === 'string') aValue = aValue.toLowerCase();
                if (typeof bValue === 'string') bValue = bValue.toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const filteredUsers = sortedUsers.filter(u => {
        const matchesSearch = (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone || '').includes(searchTerm);
            
        const matchesRole = filterRole === 'ALL' || (u.role?.role_name === filterRole);
        const matchesLocation = filterLocation === 'ALL' || (u.location && u.location.includes(filterLocation));
        
        let matchesStatus = true;
        if(filterStatus === 'ACTIVE') matchesStatus = (u.is_active || u.account_status === 'Active' || !u.account_status);
        if(filterStatus === 'SUSPENDED') matchesStatus = (u.account_status === 'Suspended');

        return matchesSearch && matchesRole && matchesLocation && matchesStatus;
    });

    // Dynamic stats based on filtered data (Enterprise Standard)
    const stats = {
        total: filteredUsers.length,
        active: filteredUsers.filter(u => u.is_active || u.account_status === 'Active' || !u.account_status).length,
        admin: filteredUsers.filter(u => u.role?.role_name === 'Administrator' || u.role?.role_name === 'SuperAdmin').length,
        advertiser: filteredUsers.filter(u => u.role?.role_name === 'Advertiser').length,
        owner: filteredUsers.filter(u => u.role?.role_name === 'ScreenOwner').length,
    };

    const uniqueLocations = [...new Set(users.map(u => u.location).filter(Boolean))].sort();

    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="material-symbols-outlined text-[16px] text-on-surface-variant/30">unfold_more</span>;
        return <span className="material-symbols-outlined text-[16px] text-primary transition-all duration-300">{sortConfig.direction === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>;
    };



    const renderRoleBadge = (roleName) => {
        if (roleName === 'Administrator' || roleName === 'SuperAdmin') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">SuperAdmin</span>;
        } else if (roleName === 'Advertiser') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-container/20 text-secondary border border-secondary/20">Advertiser</span>;
        } else if (roleName === 'ScreenOwner') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#a855f7]/10 text-[#9333ea] border border-[#a855f7]/20">ScreenOwner</span>;
        } else if (roleName === 'Accountant') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f97316]/10 text-[#ea580c] border border-[#f97316]/20">Accountant</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-outline-variant/30 text-on-surface-variant border border-outline-variant/50">{roleName || '—'}</span>;
    };

    return (
        <div className="flex flex-col gap-8">
            <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">إدارة المستخدمين</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">إدارة وتحديث بيانات المستخدمين وصلاحياتهم في النظام</p>
                </div>
                <button onClick={() => handleOpenModal('add')} className="bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all">
                    <span className="material-symbols-outlined">add</span>
                    <span>توثيق حساب جديد</span>
                </button>
            </section>

            {!loading && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard title="إجمالي المسجلين" value={stats.total} icon="group" colorClass="bg-primary/10 text-primary" />
                    <StatCard title="حسابات نشطة" value={stats.active} icon="person_check" colorClass="bg-[#22c55e]/10 text-[#22c55e]" />
                    <StatCard title="أعضاء الإدارة" value={stats.admin} icon="admin_panel_settings" colorClass="bg-secondary-container/20 text-secondary" />
                    <StatCard title="كبار المعلنين" value={stats.advertiser} icon="campaign" colorClass="bg-[#eab308]/10 text-[#eab308]" />
                    <StatCard title="ملاك الشاشات" value={stats.owner} icon="monitor" colorClass="bg-[#a855f7]/10 text-[#a855f7]" />
                </section>
            )}

            <section className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant bg-surface flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Search */}
                        <div className="relative w-full lg:w-96">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                            <input
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-background border border-outline-variant rounded-lg py-2.5 pr-10 pl-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow"
                                placeholder="البحث بالاسم، البريد أو الهاتف..."
                                type="text"
                            />
                        </div>

                        {/* Enterprise Advanced Filters */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <select
                                value={filterRole}
                                onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                                className="bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:outline-none transition-shadow min-w-[140px] cursor-pointer appearance-none"
                                style={{ backgroundPosition: 'left 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '18px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236b7280\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")' }}
                            >
                                <option value="ALL">جميع الصلاحيات</option>
                                {roles.map(r => <option key={r.role_id || r.id} value={r.role_name}>{r.role_name}</option>)}
                            </select>

                            <select
                                value={filterLocation}
                                onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                                className="bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:outline-none transition-shadow min-w-[140px] cursor-pointer appearance-none"
                                style={{ backgroundPosition: 'left 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '18px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236b7280\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")' }}
                            >
                                <option value="ALL">كل المحافظات</option>
                                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                className="bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:outline-none transition-shadow min-w-[140px] cursor-pointer appearance-none"
                                style={{ backgroundPosition: 'left 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '18px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236b7280\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")' }}
                            >
                                <option value="ALL">كل الحالات</option>
                                <option value="ACTIVE">الحسابات النشطة</option>
                                <option value="SUSPENDED">الحسابات الموقوفة</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative min-h-[300px]">
                    {loading ? (
                        <div className="flex justify-center items-center absolute inset-0 bg-surface/50 z-10">
                            <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : paginatedUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                                <span className="material-symbols-outlined text-outline text-3xl">warning</span>
                            </div>
                            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">النظام قيد الانتظار</h4>
                            <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px] mx-auto">
                                لا توجد بيانات مسجلين لعرضها حالياً.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-background/80 border-b border-outline-variant font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
                                <tr>
                                    <th className="py-4 px-6 font-medium text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('full_name')}>
                                        <div className="flex items-center gap-1">الاسم <SortIcon columnKey="full_name" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-medium text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('email')}>
                                        <div className="flex items-center gap-1">البريد الإلكتروني <SortIcon columnKey="email" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-medium text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('role.role_name')}>
                                        <div className="flex items-center gap-1">الصلاحية <SortIcon columnKey="role.role_name" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-medium text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('phone')}>
                                        <div className="flex items-center gap-1">رقم الهاتف <SortIcon columnKey="phone" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-medium text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('location')}>
                                        <div className="flex items-center gap-1">الموقع <SortIcon columnKey="location" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-medium text-center cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('account_status')}>
                                        <div className="flex items-center justify-center gap-1">حالة الحساب <SortIcon columnKey="account_status" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-medium text-center cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('is_active')}>
                                        <div className="flex items-center justify-center gap-1">نشط <SortIcon columnKey="is_active" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-medium text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
                                {paginatedUsers.map((item) => (
                                    <tr key={item.user_id} onClick={(e) => handleRowClick(e, item)} className="hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                                    {item.full_name?.charAt(0) || <span className="material-symbols-outlined text-sm">person</span>}
                                                </div>
                                                <span className="font-medium">{item.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-on-surface-variant dir-ltr text-right">
                                            {item.email}
                                        </td>
                                        <td className="py-4 px-6">
                                            {renderRoleBadge(item.role?.role_name)}
                                        </td>
                                        <td className="py-4 px-6 dir-ltr text-right">
                                            {item.phone || '—'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1 text-on-surface-variant">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                <span>{item.location || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {item.account_status === 'Active' || !item.account_status ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#16a34a]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                                                    نشط
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-outline-variant/30 text-on-surface-variant">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span>
                                                    غير نشط
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="relative inline-flex items-center cursor-pointer" onClick={(e) => handleToggleStatus(e, item)}>
                                                <input readOnly type="checkbox" className="sr-only peer" checked={item.account_status === 'Active' || !item.account_status} />
                                                <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', item) }} className="text-on-surface-variant hover:text-primary transition-colors p-1" title="تعديل الحساب">
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>

                                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.user_id) }} className="text-on-surface-variant hover:text-error transition-colors p-1" title="حذف">
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filteredUsers.length > 0 && (
                    <div className="p-4 border-t border-outline-variant bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="font-caption text-caption text-on-surface-variant">
                            عرض <span className="font-medium text-on-surface">{(currentPage - 1) * itemsPerPage + 1}</span> إلى <span className="font-medium text-on-surface">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> من أصل <span className="font-medium text-on-surface">{filteredUsers.length}</span> مستخدم
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant bg-background text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md border font-medium text-sm transition-colors ${currentPage === page ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant bg-background text-on-surface hover:bg-surface-container-low'}`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant bg-background text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, type: '', user: null })} title={modalConfig.type === 'add' ? 'تسجيل عضوية النظام' : modalConfig.type === 'details' ? 'استعراض تفاصيل المستخدم' : modalConfig.type === 'edit' ? 'تعديل بيانات المستخدم' : 'تحديث الصلاحيات'} size="md">
                {modalConfig.type === 'details' && modalConfig.user ? (
                    <div className="space-y-4 mt-4" dir="rtl">
                        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex flex-col md:flex-row items-center md:items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20 shrink-0">
                                {modalConfig.user.full_name?.charAt(0) || <span className="material-symbols-outlined text-3xl">person</span>}
                            </div>
                            <div className="text-center md:text-right">
                                <h4 className="font-title-lg text-title-lg text-on-surface">{modalConfig.user.full_name}</h4>
                                <p className="font-body-md text-body-md text-on-surface-variant justify-center md:justify-start flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[16px]">mail</span> <span className="dir-ltr">{modalConfig.user.email}</span>
                                </p>
                                <p className="font-body-md text-body-md text-on-surface-variant justify-center md:justify-start flex items-center gap-1 mt-1">
                                    <span className="material-symbols-outlined text-[16px]">phone</span> <span className="dir-ltr">{modalConfig.user.phone || 'غير متوفر'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-caption text-caption text-on-surface-variant mb-2 font-medium">الصلاحية (الدور)</span>
                                <div>{renderRoleBadge(modalConfig.user.role?.role_name)}</div>
                            </div>
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-caption text-caption text-on-surface-variant mb-2 font-medium">الموقع / المحافظة</span>
                                <div className="font-body-md text-on-surface flex items-center gap-1 text-sm">
                                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>
                                    {modalConfig.user.location || 'غير متوفر'}
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-caption text-caption text-on-surface-variant mb-2 font-medium">حالة الحساب</span>
                                <div className="font-body-md text-on-surface flex items-center gap-1 text-sm font-medium">
                                    {modalConfig.user.account_status === 'Active' || !modalConfig.user.account_status ? (
                                        <span className="text-[#16a34a] flex items-center gap-1.5 px-2.5 py-1 bg-[#22c55e]/10 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span> نشط للوصول</span>
                                    ) : (
                                        <span className="text-on-surface-variant flex items-center gap-1.5 px-2.5 py-1 bg-outline-variant/30 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span> تم الإيقاف</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-caption text-caption text-on-surface-variant mb-2 font-medium">تاريخ التسجيل</span>
                                <div className="font-body-md text-on-surface flex items-center gap-1 text-sm dir-ltr justify-end text-on-surface-variant">
                                    {modalConfig.user.created_at ? new Date(modalConfig.user.created_at).toLocaleDateString('en-GB') : '—'}
                                </div>
                            </div>
                        </div>

                        <button type="button" onClick={() => setModalConfig({ open: false, type: '', user: null })} className="w-full bg-surface-container-low text-on-surface font-label-md hover:bg-surface-container transition-colors py-3 rounded-xl border border-outline-variant shadow-sm mt-6">
                            الرجوع وإغلاق النافذة
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4" dir="rtl">
                        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-primary">
                                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                                <h4 className="font-label-md text-label-md">هيكل الصلاحيات الوصولية</h4>
                            </div>
                            <div>
                                <label className={labelClass}>تصنيف الصلاحية <span className="text-error">*</span></label>
                                <select required value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} className={inputClass}>
                                    <option value="">-- اضغط لتعيين الدور الإداري --</option>
                                    {roles.map(r => <option key={r.role_id || r.id} value={r.role_id || r.id}>{r.role_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {(modalConfig.type === 'add' || modalConfig.type === 'edit') && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>الاسم الكامل <span className="text-error">*</span></label>
                                        <input type="text" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="الاسم" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>الموقع / المحافظة</label>
                                        <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="الموقع" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>البريد الإلكتروني <span className="text-error">*</span></label>
                                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} dir="ltr" placeholder="user@example.com" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>رقم الهاتف</label>
                                        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} dir="ltr" placeholder="رقم الهاتف" />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>كلمة المرور {modalConfig.type === 'add' && <span className="text-error">*</span>}</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} required={modalConfig.type === 'add'} minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${inputClass} !pl-10`} placeholder={modalConfig.type === 'edit' ? "اتركه فارغاً للحفاظ على كلمة المرور الحالية" : "••••••••"} dir={form.password ? 'ltr' : 'rtl'} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface outline-none flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {roles.find(r => (r.role_id || r.id) == form.role_id)?.role_name === 'ScreenOwner' && (
                            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant space-y-4 mt-2">
                                <div className="flex items-center gap-2 mb-2 text-[#a855f7]">
                                    <span className="material-symbols-outlined text-xl">account_balance</span>
                                    <h4 className="font-label-md text-label-md">السجل المالي</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>البنك المصرفي</label>
                                        <input type="text" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>اسم المستفيد</label>
                                        <input type="text" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>رقم الحساب / الآيبان (IBAN)</label>
                                    <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className={inputClass} dir="ltr" />
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={formLoading} className="w-full bg-primary text-on-primary font-label-md hover:bg-primary/90 py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6">
                            {formLoading ? 'جاري المعالجة...' : 'تأكيد الحفظ'}
                        </button>
                    </form>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="إلغاء نشاط المستخدم وحذفه"
                message="هل أنت متأكد من إسقاط هذا الحساب من سجلات الوصول نهائياً؟ في حال حذفه لن يتمكن صاحبه من الدخول مستقبلاً وهذا الإجراء دائم."
                confirmText="نعم، موافق على الإلغاء"
            />
        </div>
    );
};

export default UsersPage;

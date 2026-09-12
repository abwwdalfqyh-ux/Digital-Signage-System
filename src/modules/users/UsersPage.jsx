import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import Modal from '../../shared/components/Modal';
import useToastStore from '../../store/useToastStore';
import { useUsers, useCreateUser, useUpdateUser, useUpdateUserRole, useUpdateUserStatus, useDeleteUser } from '../../hooks/api/useUsers';
import { useRoles } from '../../hooks/api/useLookups';
import useTranslation from '../../i18n/useTranslation';

const StatCard = ({ title, value }) => (
    <div className="bg-surface border border-outline-variant rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
        <p className="text-base md:text-lg font-extrabold text-on-surface mb-3">{title}</p>
        <p className="text-sm font-normal text-on-surface-variant">{value}</p>
    </div>
);

const UsersPage = () => {
    const { data: users = [], isLoading: usersLoading, refetch } = useUsers();
    const { data: roles = [] } = useRoles();
    const { t, dir } = useTranslation();
    
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

    const inputClass = "w-full bg-background border border-outline-variant rounded-xl h-12 px-4 font-bold text-base md:text-lg focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-right text-on-surface";
    const labelClass = "text-base md:text-lg font-extrabold text-on-surface mb-2 block";

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
            
        const matchesRole = filterRole === 'ALL' || (String(u.role_id) === String(filterRole));
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
        admin: filteredUsers.filter(u => u.role_id === 1 || u.role_id === 7).length,
        advertiser: filteredUsers.filter(u => u.role_id === 2).length,
        owner: filteredUsers.filter(u => u.role_id === 3).length,
    };

    const uniqueLocations = [...new Set(users.map(u => u.location).filter(Boolean))].sort();

    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <span className="material-symbols-outlined text-[16px] text-on-surface-variant/30">unfold_more</span>;
        return <span className="material-symbols-outlined text-[16px] text-primary transition-all duration-300">{sortConfig.direction === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>;
    };



    const renderRoleBadge = (roleId, roleName) => {
        if (roleId === 1 || roleId === 7) {
            return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-error/10 text-error border border-error/20">{roleName || 'SuperAdmin'}</span>;
        } else if (roleId === 2) {
            return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-secondary-container/20 text-secondary border border-secondary/20">{roleName || 'Advertiser'}</span>;
        } else if (roleId === 3) {
            return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-[#a855f7]/10 text-[#9333ea] border border-[#a855f7]/20">{roleName || 'ScreenOwner'}</span>;
        }
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-outline-variant/30 text-on-surface-variant border border-outline-variant/50">{roleName || '—'}</span>;
    };

    return (
        <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">{t('users.manage_users')}</h2>
                </div>
                <div className="w-full">
                    <button 
                        onClick={() => handleOpenModal('add')} 
                        className="w-full bg-primary hover:bg-primary/90 text-on-primary font-extrabold text-base md:text-lg py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                        <span className="material-symbols-outlined text-2xl font-bold">add</span>
                        <span>{t('users.add_new_user')}</span>
                    </button>
                </div>
            </section>

            {!loading && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard title={t('users.total_registered')} value={stats.total} />
                    <StatCard title={t('users.active_accounts')} value={stats.active} />
                    <StatCard title={t('users.admin_members')} value={stats.admin} />
                    <StatCard title={t('users.top_advertisers')} value={stats.advertiser} />
                    <StatCard title={t('users.screen_owners')} value={stats.owner} />
                </section>
            )}

            <section className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-outline-variant bg-surface flex flex-col gap-4">
                    {/* Row 1: Filters (All Roles, All Locations, All Statuses) in one row, full width */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <select
                            value={filterRole}
                            onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-background border border-outline-variant rounded-xl h-12 px-4 font-semibold text-base focus:border-primary focus:ring-1 focus:outline-none transition-all cursor-pointer appearance-none text-on-surface"
                            style={{ backgroundPosition: 'left 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236b7280\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")' }}
                        >
                            <option value="ALL">{t('users.all_roles')}</option>
                            {roles.map(r => <option key={r.role_id || r.id} value={r.role_id || r.id}>{r.role_name}</option>)}
                        </select>

                        <select
                            value={filterLocation}
                            onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-background border border-outline-variant rounded-xl h-12 px-4 font-semibold text-base focus:border-primary focus:ring-1 focus:outline-none transition-all cursor-pointer appearance-none text-on-surface"
                            style={{ backgroundPosition: 'left 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236b7280\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")' }}
                        >
                            <option value="ALL">{t('users.all_locations')}</option>
                            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-background border border-outline-variant rounded-xl h-12 px-4 font-semibold text-base focus:border-primary focus:ring-1 focus:outline-none transition-all cursor-pointer appearance-none text-on-surface"
                            style={{ backgroundPosition: 'left 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%236b7280\'%3E%3Cpath d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")' }}
                        >
                            <option value="ALL">{t('users.all_statuses')}</option>
                            <option value="ACTIVE">{t('users.active_accounts_filter')}</option>
                            <option value="SUSPENDED">{t('users.suspended_accounts_filter')}</option>
                        </select>
                    </div>

                    {/* Row 2: Search bar occupying full row with Refresh Button beside it */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                        <div className="relative flex-1 w-full">
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-2xl">search</span>
                            <input
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full bg-background border border-outline-variant rounded-xl h-12 pr-12 pl-4 font-semibold text-base focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-on-surface"
                                placeholder={t('users.search_placeholder')}
                                type="text"
                            />
                        </div>

                        <button
                            onClick={() => {
                                if (refetch) refetch();
                                addToast(t('common.data_refreshed', 'تم تحديث البيانات بنجاح'), 'success');
                            }}
                            className="h-12 px-6 bg-surface border border-outline-variant hover:border-primary hover:bg-primary-container text-on-surface hover:text-primary font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 w-full sm:w-auto"
                            title={t('common.refresh', 'تحديث البيانات')}
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                            <span>{t('common.refresh', 'تحديث')}</span>
                        </button>
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
                            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{t('users.system_waiting')}</h4>
                            <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px] mx-auto">
                                {t('users.no_users_data')}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-background/90 border-b border-outline-variant text-base md:text-lg font-extrabold text-on-surface whitespace-nowrap">
                                <tr>
                                    <th className="py-4 px-6 font-extrabold text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('full_name')}>
                                        <div className="flex items-center gap-1.5">{t('users.name')} <SortIcon columnKey="full_name" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-extrabold text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('email')}>
                                        <div className="flex items-center gap-1.5">{t('users.email')} <SortIcon columnKey="email" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-extrabold text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('role.role_name')}>
                                        <div className="flex items-center gap-1.5">{t('users.role')} <SortIcon columnKey="role.role_name" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-extrabold text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('phone')}>
                                        <div className="flex items-center gap-1.5">{t('users.phone')} <SortIcon columnKey="phone" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-extrabold text-right cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('location')}>
                                        <div className="flex items-center gap-1.5">{t('users.location')} <SortIcon columnKey="location" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-extrabold text-center cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('account_status')}>
                                        <div className="flex items-center justify-center gap-1.5">{t('users.account_status')} <SortIcon columnKey="account_status" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-extrabold text-center cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => handleSort('is_active')}>
                                        <div className="flex items-center justify-center gap-1.5">{t('users.active')} <SortIcon columnKey="is_active" /></div>
                                    </th>
                                    <th className="py-4 px-6 font-extrabold text-center">{t('users.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="text-base font-bold text-on-surface divide-y divide-outline-variant">
                                {paginatedUsers.map((item) => (
                                    <tr key={item.user_id} onClick={(e) => handleRowClick(e, item)} className="hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold border border-primary/20 text-base">
                                                    {item.full_name?.charAt(0) || <span className="material-symbols-outlined text-base">person</span>}
                                                </div>
                                                <span className="font-extrabold text-base md:text-lg text-on-surface">{item.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-on-surface font-bold text-base dir-ltr text-right">
                                            {item.email}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>{renderRoleBadge(item.role?.role_id, item.role?.role_name)}</div>
                                        </td>
                                        <td className="py-4 px-6 dir-ltr text-right font-bold text-base text-on-surface">
                                            {item.phone || '—'}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-base">
                                            <div className="flex items-center gap-1.5 text-on-surface">
                                                <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                                                <span>{item.location || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {item.account_status === 'Active' || !item.account_status ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-[#22c55e]/15 text-[#15803d]">
                                                    <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
                                                    {t('users.status_active')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-outline-variant/40 text-on-surface-variant">
                                                    <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                                                    {t('users.status_inactive')}
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
                                            <div className="flex items-center justify-center gap-3">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', item) }} className="text-on-surface-variant hover:text-primary transition-colors p-1.5 hover:bg-primary/10 rounded-lg" title={t('users.edit_account')}>
                                                    <span className="material-symbols-outlined text-2xl font-bold">edit</span>
                                                </button>

                                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.user_id) }} className="text-on-surface-variant hover:text-error transition-colors p-1.5 hover:bg-error/10 rounded-lg" title={t('users.delete_account')}>
                                                    <span className="material-symbols-outlined text-2xl font-bold">delete</span>
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
                            {t('common.showing')} <span className="font-medium text-on-surface">{(currentPage - 1) * itemsPerPage + 1}</span> {t('common.to')} <span className="font-medium text-on-surface">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> {t('common.of')} <span className="font-medium text-on-surface">{filteredUsers.length}</span> {t('users.users_count')}
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

            <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, type: '', user: null })} title={modalConfig.type === 'add' ? t('users.modal_add_title') : modalConfig.type === 'details' ? t('users.modal_details_title') : modalConfig.type === 'edit' ? t('users.modal_edit_title') : t('users.modal_role_title')} maxWidth="max-w-[850px]">
                {modalConfig.type === 'details' && modalConfig.user ? (
                    <div className="space-y-4 mt-4" dir="rtl">
                        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex flex-col md:flex-row items-center md:items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20 shrink-0">
                                {modalConfig.user.full_name?.charAt(0) || <span className="material-symbols-outlined text-3xl">person</span>}
                            </div>
                            <div className="text-center md:text-right">
                                <h4 className="font-title-lg text-title-lg text-on-surface font-extrabold">{modalConfig.user.full_name}</h4>
                                <p className="font-body-md text-body-md text-on-surface-variant justify-center md:justify-start flex items-center gap-1 mt-1 font-bold">
                                    <span className="material-symbols-outlined text-[16px]">mail</span> <span className="dir-ltr">{modalConfig.user.email}</span>
                                </p>
                                <p className="font-body-md text-body-md text-on-surface-variant justify-center md:justify-start flex items-center gap-1 mt-1 font-bold">
                                    <span className="material-symbols-outlined text-[16px]">phone</span> <span className="dir-ltr">{modalConfig.user.phone || t('common.unavailable')}</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-extrabold text-base text-on-surface mb-2">{t('users.role')}</span>
                                <div>{renderRoleBadge(modalConfig.user.role?.role_id, modalConfig.user.role?.role_name)}</div>
                            </div>
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-extrabold text-base text-on-surface mb-2">{t('users.location')}</span>
                                <div className="font-bold text-on-surface flex items-center gap-1 text-base">
                                    <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                                    {modalConfig.user.location || t('common.unavailable')}
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-extrabold text-base text-on-surface mb-2">{t('users.account_status')}</span>
                                <div className="font-bold text-on-surface flex items-center gap-1 text-base">
                                    {modalConfig.user.account_status === 'Active' || !modalConfig.user.account_status ? (
                                        <span className="text-[#15803d] flex items-center gap-1.5 px-3 py-1 bg-[#22c55e]/15 rounded-full text-sm font-bold"><span className="w-2 h-2 rounded-full bg-[#15803d]"></span> {t('users.status_active')}</span>
                                    ) : (
                                        <span className="text-on-surface-variant flex items-center gap-1.5 px-3 py-1 bg-outline-variant/40 rounded-full text-sm font-bold"><span className="w-2 h-2 rounded-full bg-on-surface-variant"></span> {t('users.status_inactive')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                                <span className="block font-extrabold text-base text-on-surface mb-2">{t('users.registration_date')}</span>
                                <div className="font-bold text-on-surface flex items-center gap-1 text-base dir-ltr justify-end">
                                    {modalConfig.user.created_at ? new Date(modalConfig.user.created_at).toLocaleDateString('en-GB') : '—'}
                                </div>
                            </div>
                        </div>

                        <button type="button" onClick={() => setModalConfig({ open: false, type: '', user: null })} className="w-full bg-surface-container-low text-on-surface font-extrabold text-base hover:bg-surface-container transition-colors py-3.5 rounded-xl border border-outline-variant shadow-sm mt-6">
                            {t('common.close')}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4" dir="rtl">
                        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant space-y-4">
                            <div>
                                <label className={labelClass}>{t('users.role_category')}</label>
                                <select required value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} className={inputClass}>
                                    <option value="">-- {t('users.select_role')} --</option>
                                    {roles.map(r => <option key={r.role_id || r.id} value={r.role_id || r.id}>{r.role_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {(modalConfig.type === 'add' || modalConfig.type === 'edit') && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>{t('users.full_name')}</label>
                                        <input type="text" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder={t('users.name_placeholder')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>{t('users.location')}</label>
                                        <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder={t('users.location_placeholder')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>{t('users.email')}</label>
                                        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} dir="ltr" placeholder="user@example.com" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>{t('users.phone')}</label>
                                        <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} dir="ltr" placeholder={t('users.phone_placeholder')} />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>{t('users.password')}</label>
                                    <div className="relative">
                                        <input type={showPassword ? "text" : "password"} required={modalConfig.type === 'add'} minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${inputClass} !pl-12`} placeholder={modalConfig.type === 'edit' ? t('users.password_edit_placeholder') : "••••••••"} dir={form.password ? 'ltr' : 'rtl'} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface outline-none flex items-center justify-center p-1">
                                            <span className="material-symbols-outlined text-2xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {Number(form.role_id) === 3 && (
                            <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant space-y-4 mt-2">
                                <div className="flex items-center gap-2 mb-2 text-[#a855f7]">
                                    <span className="material-symbols-outlined text-xl">account_balance</span>
                                    <h4 className="font-extrabold text-base">{t('users.financial_record')}</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>{t('users.bank_name')}</label>
                                        <input type="text" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>{t('users.account_name')}</label>
                                        <input type="text" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>{t('users.account_number')}</label>
                                    <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className={inputClass} dir="ltr" />
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={formLoading} className="w-full bg-primary text-on-primary font-extrabold text-base md:text-lg hover:bg-primary/90 py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6">
                            {formLoading ? t('common.processing') : t('common.save_confirm')}
                        </button>
                    </form>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t('users.delete_dialog_title')}
                message={t('users.delete_dialog_message')}
                confirmText={t('users.delete_dialog_confirm')}
            />
        </div>
    );
};

export default UsersPage;

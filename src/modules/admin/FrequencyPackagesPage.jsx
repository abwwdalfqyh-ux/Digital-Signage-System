import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Edit2, Trash2, RefreshCw, Clock, Zap, TrendingUp, ToggleLeft, ToggleRight, Search, X, CheckCircle } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import usePermission from '../../hooks/usePermission';
import useTranslation from '../../i18n/useTranslation';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';

/* ─── Design Tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    surface: '#f9f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    surfaceContainerHigh: '#e1e8fd',
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    success: '#16a34a',
    successContainer: '#dcfce7',
};

/* ─── KPI Card ─── */
const KpiCard = ({ label, value, icon: Icon, iconBg, iconColor, accentColor, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,74,198,0.12)' }}
        style={{
            background: S.surfaceContainerLowest,
            border: `1px solid ${S.outlineVariant}`,
            borderRight: `4px solid ${accentColor || S.primaryContainer}`,
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            cursor: 'default',
            transition: 'all 0.2s ease',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{label}</p>
            {Icon && (
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: iconBg || S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 20, height: 20, color: iconColor || S.primaryContainer }} />
                </div>
            )}
        </div>
        <span style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1, color: accentColor || S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            {value}
        </span>
    </motion.div>
);

/* ─── Package Card ─── */
const PackageCard = ({ pkg, onEdit, onDelete, onToggle, dir, index, t }) => {
    const isActive = pkg.is_active;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4, boxShadow: '0 12px 32px -8px rgba(0,74,198,0.15)' }}
            style={{
                background: S.surfaceContainerLowest,
                border: `1px solid ${isActive ? S.outlineVariant : '#e5e7eb'}`,
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                opacity: isActive ? 1 : 0.7,
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Top accent line */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: isActive
                    ? 'linear-gradient(90deg, #004ac6, #2563eb)'
                    : `linear-gradient(90deg, ${S.outlineVariant}, ${S.outline})`,
                borderRadius: '20px 20px 0 0',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif", lineHeight: 1.3 }}>
                        {dir === 'rtl' ? pkg.name_ar : pkg.name_en}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {dir === 'rtl' ? pkg.name_en : pkg.name_ar}
                    </p>
                </div>
                <span style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: isActive ? S.successContainer : '#f3f4f6',
                    color: isActive ? S.success : S.outline,
                    border: `1px solid ${isActive ? '#86efac' : S.outlineVariant}`,
                    whiteSpace: 'nowrap',
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}>
                    {isActive ? t('packages_page.active') : t('packages_page.inactive')}
                </span>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: S.surfaceContainerLow, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Clock style={{ width: 15, height: 15, color: S.primaryContainer }} />
                        <span style={{ fontSize: '11px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('packages_page.time_interval')}</span>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: S.primaryContainer, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {pkg.interval_minutes}
                    </span>
                    <span style={{ fontSize: '12px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'block' }}>{t('packages_page.minute')}</span>
                </div>
                <div style={{ background: S.surfaceContainerLow, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                        <TrendingUp style={{ width: 15, height: 15, color: '#16a34a' }} />
                        <span style={{ fontSize: '11px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('packages_page.price_multiplier')}</span>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        ×{parseFloat(pkg.price_multiplier).toFixed(1)}
                    </span>
                    <span style={{ fontSize: '12px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'block' }}>
                        {parseFloat(pkg.price_multiplier) === 1 ? t('packages_page.normal_price') : parseFloat(pkg.price_multiplier) > 1 ? t('packages_page.high_price') : t('packages_page.discount')}
                    </span>
                </div>
            </div>

            {/* Frequency visual */}
            <div style={{ padding: '12px', background: S.surfaceContainerLow, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap style={{ width: 16, height: 16, color: S.primaryContainer, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ height: '6px', background: S.surfaceContainerHigh, borderRadius: '999px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{
                            height: '100%',
                            width: `${Math.min(100, Math.round((60 / (pkg.interval_minutes || 1)) * 100 / 60))}%`,
                            background: 'linear-gradient(90deg, #004ac6, #2563eb)',
                            borderRadius: '999px',
                        }} />
                    </div>
                    <span style={{ fontSize: '11px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {pkg.interval_minutes <= 5 ? t('packages_page.very_high_freq') :
                            pkg.interval_minutes <= 15 ? t('packages_page.high_freq') :
                                pkg.interval_minutes <= 30 ? t('packages_page.medium_freq') : t('packages_page.low_freq')}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${S.outlineVariant}`, paddingTop: '14px' }}>
                <button
                    onClick={() => onEdit(pkg)}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '9px', borderRadius: '10px', border: `1px solid ${S.outlineVariant}`,
                        background: S.surfaceContainerLow, color: S.onSurfaceVariant, cursor: 'pointer',
                        fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.target.style.background = S.surfaceContainer; e.target.style.color = S.onBackground; }}
                    onMouseLeave={e => { e.target.style.background = S.surfaceContainerLow; e.target.style.color = S.onSurfaceVariant; }}
                >
                    <Edit2 style={{ width: 14, height: 14 }} /> {t('packages_page.edit')}
                </button>
                <button
                    onClick={() => onToggle(pkg)}
                    style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '9px', borderRadius: '10px', border: `1px solid ${isActive ? '#fde68a' : '#86efac'}`,
                        background: isActive ? '#fef9c3' : '#dcfce7', color: isActive ? '#b45309' : '#16a34a',
                        cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        transition: 'all 0.15s',
                    }}
                >
                    {isActive ? <ToggleRight style={{ width: 14, height: 14 }} /> : <ToggleLeft style={{ width: 14, height: 14 }} />}
                    {isActive ? t('packages_page.deactivate') : t('packages_page.activate')}
                </button>
                <button
                    onClick={() => onDelete(pkg.package_id)}
                    style={{
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '10px', border: `1px solid ${S.errorContainer}`,
                        background: S.errorContainer, color: S.error, cursor: 'pointer', transition: 'all 0.15s',
                        flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = S.error; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = S.errorContainer; e.currentTarget.style.color = S.error; }}
                >
                    <Trash2 style={{ width: 15, height: 15 }} />
                </button>
            </div>
        </motion.div>
    );
};

/* ─── Form Field ─── */
const Field = ({ label, required, children }) => (
    <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            {label} {required && <span style={{ color: S.error }}>*</span>}
        </label>
        {children}
    </div>
);

const inputStyle = {
    width: '100%', border: `1px solid ${S.outlineVariant}`, borderRadius: '10px',
    padding: '10px 14px', fontSize: '14px', fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    background: S.surfaceContainerLowest, color: S.onBackground, outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
};

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
const FrequencyPackagesPage = () => {
    const { t, dir } = useTranslation();
    const addToast = useToastStore(state => state.addToast);
    const { can } = usePermission();

    const [packages, setPackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');

    const EMPTY_FORM = { name_ar: '', name_en: '', interval_minutes: '15', price_multiplier: '1.0', is_active: true };
    const [form, setForm] = useState(EMPTY_FORM);

    /* ── Fetch ── */
    const fetchPackages = async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.PACKAGES.ALL);
            const data = res.data?.data || res.data;
            setPackages(Array.isArray(data) ? data : []);
        } catch (err) {
            if (!silent) addToast(err.response?.data?.message || 'فشل تحميل الباقات', 'error');
            setPackages([]);
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => { fetchPackages(); }, []);

    /* ── Open Modal ── */
    const openModal = (pkg = null) => {
        if (pkg) {
            setEditingPkg(pkg);
            setForm({
                name_ar: pkg.name_ar || '',
                name_en: pkg.name_en || '',
                interval_minutes: String(pkg.interval_minutes || '15'),
                price_multiplier: String(pkg.price_multiplier || '1.0'),
                is_active: pkg.is_active !== undefined ? pkg.is_active : true,
            });
        } else {
            setEditingPkg(null);
            setForm(EMPTY_FORM);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingPkg(null); };

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name_ar.trim() || !form.name_en.trim()) {
            addToast('يرجى تعبئة الاسم بالعربي والإنجليزي', 'warning');
            return;
        }
        if (!form.interval_minutes || Number(form.interval_minutes) < 1) {
            addToast('الفترة الزمنية يجب أن تكون دقيقة واحدة على الأقل', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                name_ar: form.name_ar.trim(),
                name_en: form.name_en.trim(),
                interval_minutes: parseInt(form.interval_minutes),
                price_multiplier: parseFloat(form.price_multiplier),
                is_active: form.is_active,
            };
            if (editingPkg) {
                await axiosClient.put(ENDPOINTS.PACKAGES.UPDATE(editingPkg.package_id), payload);
                addToast('تم تعديل الباقة بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.PACKAGES.CREATE, payload);
                addToast('تم إنشاء الباقة بنجاح', 'success');
            }
            closeModal();
            fetchPackages(true);
        } catch (err) {
            addToast(err.response?.data?.message || 'حدث خطأ أثناء الحفظ', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        try {
            await axiosClient.delete(ENDPOINTS.PACKAGES.DELETE(deleteDialog.id));
            addToast('تم حذف الباقة بنجاح', 'success');
            fetchPackages(true);
        } catch (err) {
            addToast(err.response?.data?.message || 'فشل حذف الباقة', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    /* ── Toggle ── */
    const handleToggle = async (pkg) => {
        try {
            await axiosClient.put(ENDPOINTS.PACKAGES.UPDATE(pkg.package_id), { ...pkg, is_active: !pkg.is_active });
            addToast(`تم ${pkg.is_active ? 'تعطيل' : 'تفعيل'} الباقة`, 'success');
            fetchPackages(true);
        } catch (err) {
            addToast(err.response?.data?.message || 'فشل تحديث الحالة', 'error');
        }
    };

    /* ── Derived ── */
    const filtered = packages.filter(p =>
        !searchTerm ||
        p.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const activeCount = packages.filter(p => p.is_active).length;
    const avgInterval = packages.length > 0
        ? Math.round(packages.reduce((s, p) => s + p.interval_minutes, 0) / packages.length)
        : 0;

    /* ─── Skeleton ─── */
    if (isLoading) {
        return (
            <div dir={dir} style={{ padding: '8px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                <div style={{ height: '32px', width: '260px', borderRadius: '10px', background: S.surfaceContainerHigh, marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: '110px', borderRadius: '16px', background: S.surfaceContainerHigh }} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '280px', borderRadius: '20px', background: S.surfaceContainerHigh }} />)}
                </div>
            </div>
        );
    }

    return (
        <div dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", paddingBottom: '40px' }}>

            {/* ─── Header ─── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers style={{ width: 22, height: 22, color: S.primaryContainer }} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('packages_page.title')}
                        </h1>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        {t('packages_page.subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => fetchPackages()}
                        title={t('packages_page.refresh')}
                        style={{
                            width: '40px', height: '40px', borderRadius: '10px', border: `1px solid ${S.outlineVariant}`,
                            background: S.surfaceContainerLowest, color: S.onSurfaceVariant, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <RefreshCw style={{ width: 16, height: 16 }} />
                    </button>
                    {can('manage_all') && (
                        <button
                            onClick={() => openModal()}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', borderRadius: '12px',
                                background: S.primaryContainer, color: '#fff',
                                border: 'none', fontSize: '14px', fontWeight: 600,
                                cursor: 'pointer', fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Plus style={{ width: 18, height: 18 }} />
                            {t('packages_page.add_new')}
                        </button>
                    )}
                </div>
            </motion.div>

            {/* ─── KPI Cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <KpiCard label={t('packages_page.total_packages')} value={packages.length} icon={Layers} iconBg={S.surfaceContainer} iconColor={S.primaryContainer} accentColor={S.primaryContainer} index={0} />
                <KpiCard label={t('packages_page.active_packages')} value={activeCount} icon={CheckCircle} iconBg="#dcfce7" iconColor="#16a34a" accentColor="#16a34a" index={1} />
                <KpiCard label={t('packages_page.avg_interval')} value={`${avgInterval} ${t('packages_page.minute')}`} icon={Clock} iconBg={S.surfaceContainerHigh} iconColor="#6366f1" accentColor="#6366f1" index={2} />
            </div>

            {/* ─── Search Bar ─── */}
            <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '400px' }}>
                <Search style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: dir === 'rtl' ? '14px' : 'auto', left: dir === 'ltr' ? '14px' : 'auto', width: 16, height: 16, color: S.outline }} />
                <input
                    type="text"
                    placeholder={t('packages_page.search_placeholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, paddingRight: dir === 'rtl' ? '42px' : '14px', paddingLeft: dir === 'ltr' ? '42px' : '14px' }}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: dir === 'rtl' ? '14px' : 'auto', right: dir === 'ltr' ? '14px' : 'auto', background: 'none', border: 'none', cursor: 'pointer', color: S.outline }}>
                        <X style={{ width: 14, height: 14 }} />
                    </button>
                )}
            </div>

            {/* ─── Packages Grid ─── */}
            <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '80px 20px', background: S.surfaceContainerLowest, borderRadius: '24px', border: `2px dashed ${S.outlineVariant}` }}
                    >
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: S.surfaceContainer, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Layers style={{ width: 36, height: 36, color: S.outline }} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {searchTerm ? t('packages_page.no_results') : t('packages_page.no_packages')}
                        </h3>
                        <p style={{ margin: '0 0 24px', fontSize: '14px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {searchTerm ? t('packages_page.try_diff_words') : t('packages_page.start_adding')}
                        </p>
                        {!searchTerm && can('manage_all') && (
                            <button
                                onClick={() => openModal()}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 22px', borderRadius: '12px',
                                    background: S.primaryContainer, color: '#fff',
                                    border: 'none', fontSize: '14px', fontWeight: 600,
                                    cursor: 'pointer', fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                }}
                            >
                                <Plus style={{ width: 16, height: 16 }} /> {t('packages_page.add_package')}
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}
                    >
                        {filtered.map((pkg, idx) => (
                            <PackageCard
                                key={pkg.package_id}
                                pkg={pkg}
                                dir={dir}
                                index={idx}
                                t={t}
                                onEdit={openModal}
                                onDelete={id => setDeleteDialog({ open: true, id })}
                                onToggle={handleToggle}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Add/Edit Modal ─── */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPkg ? t('packages_page.edit_package') : t('packages_page.add_new')} size="md">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {/* Preview Card */}
                    <div style={{ background: 'linear-gradient(135deg, #004ac6, #2563eb)', borderRadius: '16px', padding: '20px', color: '#fff', marginBottom: '4px' }}>
                        <div style={{ fontSize: '12px', opacity: 0.75, marginBottom: '6px', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('packages_page.package_preview')}</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {form.name_ar || t('packages_page.pkg_name_ar_preview')}
                        </div>
                        <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px', opacity: 0.85, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            <span>🕐 {t('packages_page.every')} {form.interval_minutes || '?'} {t('packages_page.minute')}</span>
                            <span>📈 ×{parseFloat(form.price_multiplier || 1).toFixed(1)} {t('packages_page.price')}</span>
                        </div>
                    </div>

                    {/* Names */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <Field label={t('packages_page.name_ar')} required>
                            <input type="text" value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))}
                                placeholder={t('packages_page.name_ar_placeholder')} style={inputStyle} dir="rtl" />
                        </Field>
                        <Field label={t('packages_page.name_en')} required>
                            <input type="text" value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
                                placeholder={t('packages_page.name_en_placeholder')} style={inputStyle} dir="ltr" />
                        </Field>
                    </div>

                    {/* Interval & Multiplier */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <Field label={t('packages_page.interval_minutes')} required>
                            <input type="number" min="1" max="1440" value={form.interval_minutes}
                                onChange={e => setForm(p => ({ ...p, interval_minutes: e.target.value }))}
                                style={{ ...inputStyle, fontWeight: 700 }} dir="ltr" />
                            <span style={{ fontSize: '11px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'block', marginTop: '4px' }}>
                                {t('packages_page.once_every')} {form.interval_minutes} {t('packages_page.minute')} = {form.interval_minutes > 0 ? Math.round(60 / form.interval_minutes) : 0} {t('packages_page.times_per_hour')}
                            </span>
                        </Field>
                        <Field label={t('packages_page.price_multiplier')} required>
                            <input type="number" min="0.1" step="0.1" value={form.price_multiplier}
                                onChange={e => setForm(p => ({ ...p, price_multiplier: e.target.value }))}
                                style={{ ...inputStyle, fontWeight: 700 }} dir="ltr" />
                            <span style={{ fontSize: '11px', color: parseFloat(form.price_multiplier) > 1 ? '#ea580c' : parseFloat(form.price_multiplier) < 1 ? '#16a34a' : S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif", display: 'block', marginTop: '4px' }}>
                                {parseFloat(form.price_multiplier) === 1 ? t('packages_page.normal_price_no_increase')
                                    : parseFloat(form.price_multiplier) > 1 ? t('packages_page.increase_by').replace('{percent}', Math.round((parseFloat(form.price_multiplier) - 1) * 100))
                                        : t('packages_page.discount_by').replace('{percent}', Math.round((1 - parseFloat(form.price_multiplier)) * 100))}
                            </span>
                        </Field>
                    </div>

                    {/* Active toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: S.surfaceContainerLow, borderRadius: '12px', border: `1px solid ${S.outlineVariant}` }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: S.onBackground, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>{t('packages_page.package_status')}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: S.outline, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                                {form.is_active ? t('packages_page.available_to_advertisers') : t('packages_page.hidden_from_advertisers')}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                            style={{
                                width: '52px', height: '28px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                                background: form.is_active ? S.primaryContainer : S.outlineVariant,
                                position: 'relative', transition: 'background 0.2s',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: '4px', width: '20px', height: '20px', borderRadius: '50%',
                                background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                left: form.is_active ? 'calc(100% - 24px)' : '4px',
                            }} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                        <button type="button" onClick={closeModal}
                            style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${S.outlineVariant}`, background: S.surfaceContainerLowest, color: S.onSurfaceVariant, cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                            {t('packages_page.cancel')}
                        </button>
                        <button type="submit" disabled={isSubmitting}
                            style={{
                                padding: '10px 24px', borderRadius: '10px', border: 'none',
                                background: isSubmitting ? S.outlineVariant : S.primaryContainer,
                                color: '#fff', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                fontSize: '14px', fontWeight: 600, fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                            {isSubmitting && <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                            {editingPkg ? t('packages_page.save_changes') : t('packages_page.create_package')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── Delete Confirm ─── */}
            <ConfirmDialog
                isOpen={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: null })}
                onConfirm={handleDelete}
                title={t('packages_page.delete_title')}
                message={t('packages_page.delete_message')}
                confirmLabel={t('packages_page.confirm_delete')}
                cancelLabel={t('packages_page.cancel')}
                confirmVariant="danger"
            />
        </div>
    );
};

export default FrequencyPackagesPage;

import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  Monitor, Plus, Trash2, TerminalSquare, Edit2, Image as ImageIcon,
  Eye, Activity, Info, MapPin, UploadCloud, AlertCircle, Layers,
  ChevronDown, Wifi, WifiOff, Wrench, Navigation, Star, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import useToastStore from '../../store/useToastStore';
import ScreenCommandModal from './components/ScreenCommandModal';
import usePermission from '../../hooks/usePermission';

// Lazy load map to avoid SSR issues & improve initial load
const ScreenMapView = lazy(() => import('./components/ScreenMapView'));

// ─────────────────────────────────────────────────
//  Animation Variants
// ─────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

// ─────────────────────────────────────────────────
//  Stat Card
// ─────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass, textClass }) => (
  <motion.div variants={itemVariants} className={`p-5 rounded-2xl border-2 ${borderClass} ${bgClass} relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 cursor-default`}>
    <div className="flex justify-between items-start mb-3 relative z-10">
      <div className="space-y-0.5">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className={`text-3xl font-black ${textClass}`}>{value}</h3>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full blur-3xl opacity-15 ${colorClass} group-hover:scale-150 transition-transform duration-700 pointer-events-none`} />
  </motion.div>
);

// ─────────────────────────────────────────────────
//  Featured Screen Card (shown beside map)
// ─────────────────────────────────────────────────
const STATUS_CFG = {
  Online:      { label: 'متصل',      dot: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-200', bg: 'bg-emerald-50', icon: Wifi },
  Offline:     { label: 'غير متصل', dot: 'bg-red-500',     text: 'text-red-600',     ring: 'ring-red-200',     bg: 'bg-red-50',     icon: WifiOff },
  Maintenance: { label: 'صيانة',    dot: 'bg-amber-500',   text: 'text-amber-600',   ring: 'ring-amber-200',   bg: 'bg-amber-50',   icon: Wrench },
};

const FeaturedScreenCard = ({ screen, onClick }) => {
  const cfg = STATUS_CFG[screen.status] || STATUS_CFG.Offline;
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      variants={itemVariants}
      onClick={() => onClick(screen)}
      className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group relative overflow-hidden"
    >
      {/* Subtle shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#145d6a]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

      <div className="flex gap-3 items-start">
        {/* Screen thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 shadow-inner relative">
          {screen.image_path ? (
            <img src={screen.image_path} alt={screen.screen_name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Monitor className="w-6 h-6 text-gray-300" />
            </div>
          )}
          {/* Status dot */}
          <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${cfg.dot} border-2 border-white shadow`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-gray-900 truncate">{screen.screen_name}</p>
          <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${cfg.bg} ${cfg.text} ring-1 ${cfg.ring}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {cfg.label}
          </div>
          {screen.street && (
            <p className="text-[10px] text-gray-400 font-bold mt-1 truncate flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {screen.street.name}
              {screen.street.region ? ` · ${screen.street.region.name}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5 mt-2.5">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(screen); }}
          className="flex-1 py-1.5 text-[10px] font-black rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-[#145d6a] hover:text-white hover:border-[#145d6a] transition-all"
        >
          عرض الجداول
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex-1 py-1.5 text-[10px] font-black rounded-lg bg-[#145d6a]/8 text-[#145d6a] border border-[#145d6a]/20 hover:bg-[#145d6a] hover:text-white transition-all"
        >
          تعديل الموقع
        </button>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────
//  Cascading Select
// ─────────────────────────────────────────────────
const CascadeSelect = ({ label, value, onChange, options, placeholder, disabled, icon: Icon }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider px-0.5 flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none bg-white border border-gray-200 rounded-xl py-2.5 px-3 pr-8 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#145d6a]/20 focus:border-[#145d6a] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-right"
        dir="rtl"
      >
        <option value="">{placeholder}</option>
        {options.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────────
const ScreensPage = () => {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({ open: false, isEdit: false, screen: null });
  const [formLoading, setFormLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commandTarget, setCommandTarget] = useState(null);
  const [lookups, setLookups] = useState({ types: [], streets: [], owners: [] });
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsModal, setDetailsModal] = useState({ open: false, screen: null });
  const { can } = usePermission();
  const addToast = useToastStore(state => state.addToast);

  // Geographic filter state
  const [governorates, setGovernorates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  // Form Cascade State
  const [formGovId, setFormGovId] = useState('');
  const [formRegionId, setFormRegionId] = useState('');
  const [formRegions, setFormRegions] = useState([]);
  const [formStreets, setFormStreets] = useState([]);
  const [formGeoLoading, setFormGeoLoading] = useState(false);
  const [isNewLocation, setIsNewLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ governorate: '', region: '', street: '' });

  // Form state
  const [form, setForm] = useState({
    screen_name: '', mac_address: '', type_id: '', street_id: '',
    owner_id: '', status: 'Online', photo: null
  });

  // ── Fetch ──────────────────────────────────────
  useEffect(() => {
    fetchScreens();
    fetchLookups();
    fetchGovernorates();
  }, []);

  const fetchScreens = async () => {
    try {
      const res = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
      setScreens(res.data);
    } catch (e) {
      console.error(e);
      addToast('حدث خطأ أثناء جلب الشاشات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [types, streetsRes, owners] = await Promise.all([
        axiosClient.get(ENDPOINTS.LOOKUPS.SCREEN_TYPES),
        axiosClient.get(ENDPOINTS.LOOKUPS.STREETS),
        axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('ScreenOwner')),
      ]);
      setLookups({ types: types.data, streets: streetsRes.data, owners: owners.data });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGovernorates = async () => {
    try {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES);
      setGovernorates(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Cascading selects ──────────────────────────
  const handleGovChange = async (govId) => {
    setSelectedGov(govId);
    setSelectedRegion('');
    setSelectedStreet('');
    setRegions([]);
    setStreets([]);
    if (!govId) return;
    try {
      setGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
      setRegions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleRegionChange = async (regionId) => {
    setSelectedRegion(regionId);
    setSelectedStreet('');
    setStreets([]);
    if (!regionId) return;
    try {
      setGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId));
      setStreets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setGeoLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedGov('');
    setSelectedRegion('');
    setSelectedStreet('');
    setRegions([]);
    setStreets([]);
  };

  // ── Compute featured & filtered screens ───────
  const filteredByGeo = useMemo(() => {
    if (!screens.length) return [];
    return screens.filter(s => {
      if (selectedStreet) return String(s.street_id) === String(selectedStreet);
      if (selectedRegion) return String(s.street?.region_id) === String(selectedRegion);
      if (selectedGov)    return String(s.street?.region?.gov_id) === String(selectedGov);
      return true;
    });
  }, [screens, selectedGov, selectedRegion, selectedStreet]);

  // Top featured screens (by status priority: Online first, then by recency)
  const featuredScreens = useMemo(() => {
    const statusOrder = { Online: 0, Maintenance: 1, Offline: 2 };
    const base = [...filteredByGeo]
      .sort((a, b) => {
        const so = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        if (so !== 0) return so;
        return new Date(b.linked_at || 0) - new Date(a.linked_at || 0);
      });
    return base;
  }, [filteredByGeo]);

  // Table filtered by status tab
  const filteredScreens = useMemo(() => {
    const base = filteredByGeo;
    if (statusFilter === 'all') return base;
    return base.filter(s => s.status === statusFilter);
  }, [filteredByGeo, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total:       screens.length,
    online:      screens.filter(s => s.status === 'Online').length,
    offline:     screens.filter(s => s.status === 'Offline').length,
    maintenance: screens.filter(s => s.status === 'Maintenance').length,
  }), [screens]);

  // ── Form handlers ──────────────────────────────
  const fetchFormRegions = async (govId) => {
    try {
      setFormGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
      setFormRegions(res.data);
    } catch {
      setFormRegions([]);
    } finally {
      setFormGeoLoading(false);
    }
  };

  const fetchFormStreets = async (regionId) => {
    try {
      setFormGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId));
      setFormStreets(res.data);
    } catch {
      setFormStreets([]);
    } finally {
      setFormGeoLoading(false);
    }
  };

  const handleFormGovChange = (govId) => {
    setFormGovId(govId);
    setFormRegionId('');
    setForm(p => ({ ...p, street_id: '' }));
    setFormRegions([]);
    setFormStreets([]);
    if (govId) fetchFormRegions(govId);
  };

  const handleFormRegionChange = (regionId) => {
    setFormRegionId(regionId);
    setForm(p => ({ ...p, street_id: '' }));
    setFormStreets([]);
    if (regionId) fetchFormStreets(regionId);
  };

  const handleOpenModal = (isEdit = false, screen = null) => {
    if (isEdit && screen) {
      setForm({
        screen_name: screen.screen_name || '',
        mac_address: screen.mac_address || '',
        type_id: screen.type_id || '',
        street_id: screen.street_id || '',
        owner_id: screen.owner_id || '',
        status: screen.status || 'Online',
        photo: null,
      });

      const initialRegionId = screen.street?.region_id || '';
      const initialGovId = screen.street?.region?.gov_id || '';
      setFormGovId(initialGovId);
      setFormRegionId(initialRegionId);
      if (initialGovId) fetchFormRegions(initialGovId);
      if (initialRegionId) fetchFormStreets(initialRegionId);
    } else {
      setForm({ screen_name: '', mac_address: '', type_id: '', street_id: '', owner_id: '', status: 'Online', photo: null });
      setFormGovId('');
      setFormRegionId('');
      setFormRegions([]);
      setFormStreets([]);
    }
    setIsNewLocation(false);
    setNewLocation({ governorate: '', region: '', street: '' });
    setModalConfig({ open: true, isEdit, screen });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNewLocation && (!newLocation.governorate || !newLocation.region || !newLocation.street)) {
      addToast('الرجاء تعبئة بيانات الموقع الجديد بالكامل', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      let finalStreetId = form.street_id;

      if (isNewLocation) {
        const locRes = await axiosClient.post(ENDPOINTS.LOOKUPS.FULL_LOCATION, {
          governorate: newLocation.governorate,
          city: newLocation.region,
          street: newLocation.street
        });
        finalStreetId = locRes.data.data.street.street_id;
        fetchLookups();
        fetchGovernorates();
      }

      if (modalConfig.isEdit) {
        await axiosClient.put(ENDPOINTS.SCREENS.UPDATE(modalConfig.screen.screen_id), {
          screen_name: form.screen_name, type_id: form.type_id,
          street_id: finalStreetId, status: form.status,
        });
        addToast('تم تحديث بيانات الشاشة بنجاح', 'success');
      } else {
        const fd = new FormData();
        const payload = { ...form, street_id: finalStreetId };
        Object.entries(payload).forEach(([k, v]) => { if (v) fd.append(k, v); });
        await axiosClient.post(ENDPOINTS.SCREENS.ALL, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        addToast('تمت إضافة الشاشة الجديدة بنجاح', 'success');
      }
      setModalConfig({ open: false, isEdit: false, screen: null });
      fetchScreens();
    } catch (e) {
      addToast(e.response?.data?.message || 'تعذر إتمام العملية', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosClient.delete(ENDPOINTS.SCREENS.DELETE(deleteTarget));
      addToast('تم إسقاط الشاشة من الشبكة', 'success');
      setDeleteTarget(null);
      fetchScreens();
    } catch {
      addToast('فشلت عملية الحذف. قد تكون الشاشة مرتبطة بإعلانات نشطة', 'error');
    }
  };

  // ── Table columns ──────────────────────────────
  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#145d6a]/10 focus:border-[#145d6a] transition-all text-right";
  const labelClass = "text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 block px-1";

  const columns = [
    {
      key: 'screen_name', header: 'اسم الشاشة',
      cell: (row) => <span className="font-black text-gray-900 text-sm whitespace-nowrap">{row.screen_name}</span>
    },
    {
      key: 'mac_address', header: 'MAC Address',
      cell: (row) => <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-bold whitespace-nowrap">{row.mac_address}</span>
    },
    {
      key: 'pairing_code', header: 'كود الربط',
      cell: (row) => row.pairing_code
        ? <span className="font-mono text-xs font-bold text-gray-700 tracking-widest">{row.pairing_code}</span>
        : <span className="text-gray-400">—</span>
    },
    {
      key: 'status', header: 'الحالة',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'image', header: 'صورة',
      cell: (row) => row.image_path ? (
        <button onClick={(e) => { e.stopPropagation(); setShowImageModal(row.image_path); }}
          className="hover:scale-105 transition-transform overflow-hidden rounded-xl border border-gray-200 shadow-sm block w-10 h-10 relative group mx-auto shrink-0">
          <img src={row.image_path} className="w-full h-full object-cover" alt="thumb" loading="lazy" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-4 h-4 text-white" />
          </div>
        </button>
      ) : (
        <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mx-auto shrink-0">
          <ImageIcon className="w-4 h-4 text-gray-300" />
        </div>
      )
    },
    {
      key: 'type', header: 'النوع',
      cell: (row) => <span className="text-xs font-bold text-[#145d6a] bg-[#145d6a]/10 px-3 py-1.5 rounded-full border border-[#145d6a]/20 whitespace-nowrap">{row.type?.type_name || '—'}</span>
    },
    {
      key: 'owner', header: 'المالك',
      cell: (row) => <span className="text-xs font-bold text-gray-700 max-w-[120px] truncate block" title={row.owner?.full_name}>{row.owner?.full_name || '—'}</span>
    },
    {
      key: 'street', header: 'الموقع',
      cell: (row) => {
        const s = row.street;
        if (!s) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <div className="flex flex-col text-right">
            <span className="text-xs font-black text-gray-800 whitespace-nowrap">{s.name}</span>
            {s.region && <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{s.region.name}</span>}
          </div>
        );
      }
    },
    {
      key: 'linked_at', header: 'آخر اتصال',
      cell: (row) => row.linked_at
        ? <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{new Date(row.linked_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
        : <span className="text-gray-400">—</span>
    },
    {
      key: 'actions', header: 'إجراءات',
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, screen: row }); }}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-900 hover:text-white transition-all border border-gray-200 hover:border-gray-900" title="التفاصيل">
            <Eye className="w-4 h-4" />
          </button>
          {(can('manage_all') || can('manage_screens')) && (
            <button onClick={(e) => { e.stopPropagation(); setCommandTarget(row); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-[#145d6a] hover:text-white transition-all border border-gray-200 hover:border-[#145d6a]" title="التحكم">
              <TerminalSquare className="w-4 h-4" />
            </button>
          )}
          {(can('manage_all') || can('manage_screens')) && (
            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(true, row); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-600 hover:text-white transition-all border border-gray-200 hover:border-blue-600" title="تعديل">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {(can('manage_all') || can('manage_screens')) && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.screen_id); }}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 hover:border-rose-600" title="حذف">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    },
  ];

  // ── Render ─────────────────────────────────────
  return (
    <div className="space-y-6 pb-12 w-full max-w-[1600px] mx-auto font-sans" dir="rtl">
      {/* ── Page Header ── */}
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
              <Monitor className="w-6 h-6 text-[#145d6a]" />
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tight">الشاشات والأجهزة</span>
          </span>
        }
        description="مراقبة شاشات العرض جغرافياً، وتتبع حالتها التشغيلية الفورية."
        action={
          (can('manage_all') || can('manage_screens')) && (
            <button
              onClick={() => handleOpenModal(false)}
              className="bg-[#145d6a] hover:bg-[#0d4f5b] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2.5 text-sm transition-all shadow-[0_8px_16px_-4px_rgba(20,93,106,0.25)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
              <Plus className="w-5 h-5 text-yellow-300" />
              إضافة شاشة جديدة
            </button>
          )
        }
      />

      {/* ── Stats Row ── */}
      {!loading && (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="إجمالي الشاشات" value={stats.total} icon={Monitor}
            colorClass="bg-blue-50 text-blue-600" borderClass="border-blue-100" bgClass="bg-white" textClass="text-gray-900" />
          <StatCard title="متصلة الآن" value={stats.online} icon={Activity}
            colorClass="bg-emerald-50 text-emerald-600" borderClass="border-emerald-100" bgClass="bg-white" textClass="text-gray-900" />
          <StatCard title="مقطوعة الاتصال" value={stats.offline} icon={AlertCircle}
            colorClass="bg-red-50 text-red-600" borderClass="border-red-100" bgClass="bg-white" textClass="text-gray-900" />
          <StatCard title="تحت الصيانة" value={stats.maintenance} icon={TerminalSquare}
            colorClass="bg-amber-50 text-amber-600" borderClass="border-amber-100" bgClass="bg-white" textClass="text-gray-900" />
        </motion.div>
      )}

      {/* ── Map + Featured Screens Section ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#145d6a]/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#145d6a]" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">خريطة الشاشات التفاعلية</h2>
              <p className="text-[10px] text-gray-400 font-bold">اختر المحافظة ← المنطقة ← الشارع للتنقل</p>
            </div>
          </div>

          {/* Cascade Filters */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[150px]">
              <CascadeSelect
                label="المحافظة"
                icon={Navigation}
                value={selectedGov}
                onChange={handleGovChange}
                placeholder="— كافة المحافظات —"
                options={governorates.map(g => ({ value: g.gov_id, label: g.name }))}
              />
            </div>
            <div className="min-w-[150px]">
              <CascadeSelect
                label="المنطقة"
                icon={MapPin}
                value={selectedRegion}
                onChange={handleRegionChange}
                placeholder="— كافة المناطق —"
                options={regions.map(r => ({ value: r.region_id, label: r.name }))}
                disabled={!selectedGov || geoLoading}
              />
            </div>
            <div className="min-w-[150px]">
              <CascadeSelect
                label="الشارع"
                icon={MapPin}
                value={selectedStreet}
                onChange={setSelectedStreet}
                placeholder="— كافة الشوارع —"
                options={streets.map(s => ({ value: s.street_id, label: s.name }))}
                disabled={!selectedRegion || geoLoading}
              />
            </div>
            {(selectedGov || selectedRegion || selectedStreet) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-black text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Map + Side Panel */}
        <div className="flex flex-col lg:flex-row h-auto lg:h-[480px]">
          {/* Map */}
          <div className="flex-1 h-72 lg:h-full relative">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-[#145d6a]/30 border-t-[#145d6a] rounded-full animate-spin" />
                  <p className="text-sm font-bold text-gray-500">جاري تحميل الخريطة...</p>
                </div>
              </div>
            }>
              <ScreenMapView
                screens={screens}
                selectedGov={selectedGov}
                selectedRegion={selectedRegion}
                selectedStreet={selectedStreet}
                governorates={governorates}
                regions={regions}
                streets={streets}
              />
            </Suspense>
          </div>

          {/* Featured Screens Panel */}
          <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-r border-gray-100 flex flex-col" dir="rtl">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-black text-gray-700">
                  {selectedGov || selectedRegion || selectedStreet
                    ? 'شاشات النطاق المحدد'
                    : 'جميع الشاشات المتوفرة'}
                </span>
              </div>
              <span className="text-[10px] font-black text-white bg-green-600 px-2 py-0.5 rounded-full">
                {featuredScreens.length} شاشات
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {loading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                ))
              ) : featuredScreens.length > 0 ? (
                <motion.div
                  key={`${selectedGov}-${selectedRegion}-${selectedStreet}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {featuredScreens.map(screen => (
                    <FeaturedScreenCard
                      key={screen.screen_id}
                      screen={screen}
                      onClick={(s) => setDetailsModal({ open: true, screen: s })}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3 border border-gray-100">
                    <Monitor className="w-7 h-7 text-gray-200" />
                  </div>
                  <p className="text-xs font-bold text-gray-400">
                    {selectedGov ? 'لا توجد شاشات في هذا التحديد' : 'اختر منطقة لعرض الشاشات'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Screens Table ── */}
      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-gray-900">جدول الشاشات الكامل</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
              عرض {filteredScreens.length} شاشة
              {(selectedGov || selectedRegion || selectedStreet) ? ' في التحديد الجغرافي الحالي' : ' في المنظومة بأكملها'}
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar mb-3">
          {[
            { key: 'all',                label: 'الكل' },
            { key: 'Online',             label: '🟢 متصلة' },
            { key: 'Offline',            label: '🔴 غير متصلة' },
            { key: 'Maintenance',        label: '🟡 صيانة' },
            { key: 'pending_activation', label: '⏳ بانتظار التفعيل' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50/30 shadow-inner min-h-[380px]">
          <DataTable
            columns={columns}
            data={filteredScreens}
            loading={loading}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                  <Monitor className="w-9 h-9 text-gray-300" />
                </div>
                <h4 className="text-lg font-black text-gray-900 mb-1">لا توجد شاشات مسجلة</h4>
                <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium">
                  لا توجد بيانات تطابق معايير الفلترة الحالية.
                </p>
              </div>
            }
          />
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalConfig.open}
        onClose={() => setModalConfig({ open: false, isEdit: false, screen: null })}
        title={modalConfig.isEdit ? 'تحديث بيانات الشاشة' : 'تسجيل شاشة جديدة'}
      >
        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-gray-400" />
              <h4 className="text-xs font-black text-gray-700">المعلومات الأساسية</h4>
            </div>
            <div>
              <label className={labelClass}>اسم الشاشة <span className="text-red-500">*</span></label>
              <input type="text" required value={form.screen_name}
                onChange={(e) => setForm(p => ({ ...p, screen_name: e.target.value }))}
                placeholder="مثال: شاشة مول السعيد 1" className={inputClass} />
            </div>
            {!modalConfig.isEdit && (
              <div>
                <label className={labelClass}>MAC Address <span className="text-red-500">*</span></label>
                <input type="text" required value={form.mac_address}
                  onChange={(e) => setForm(p => ({ ...p, mac_address: e.target.value }))}
                  placeholder="AA:BB:CC:DD:EE:FF" className={inputClass} dir="ltr" />
              </div>
            )}
            {modalConfig.isEdit && (
              <div>
                <label className={labelClass}>الحالة التشغيلية</label>
                <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                  <option value="Online">متصلة (Online)</option>
                  <option value="Offline">غير متصلة (Offline)</option>
                  <option value="Maintenance">تحت الصيانة (Maintenance)</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-black text-gray-700">الموقع والتصنيف</h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 hover:border-[#145d6a]/30 transition-all shadow-sm">
                <input type="checkbox" checked={isNewLocation} onChange={(e) => setIsNewLocation(e.target.checked)} className="w-4 h-4 text-[#145d6a] rounded border-gray-300 focus:ring-[#145d6a] cursor-pointer" />
                <span className="text-[11px] font-bold text-gray-600">إضافة موقع جديد يدوياً</span>
              </label>
            </div>
            
            {isNewLocation ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="sm:col-span-3">
                  <p className="text-[11px] font-bold text-blue-600 mb-2">سيتم إضافة هذا الموقع تلقائياً لقاعدة البيانات ليصبح متاحاً مستقبلاً.</p>
                </div>
                <div>
                  <label className={labelClass}>اسم المحافظة</label>
                  <input type="text" value={newLocation.governorate} onChange={(e) => setNewLocation(p => ({ ...p, governorate: e.target.value }))} className={inputClass} placeholder="مثال: صنعاء" required={isNewLocation} />
                </div>
                <div>
                  <label className={labelClass}>اسم المنطقة / المديرية</label>
                  <input type="text" value={newLocation.region} onChange={(e) => setNewLocation(p => ({ ...p, region: e.target.value }))} className={inputClass} placeholder="مثال: السبعين" required={isNewLocation} />
                </div>
                <div>
                  <label className={labelClass}>اسم الشارع الرئيسي</label>
                  <input type="text" value={newLocation.street} onChange={(e) => setNewLocation(p => ({ ...p, street: e.target.value }))} className={inputClass} placeholder="مثال: شارع حدة" required={isNewLocation} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>المحافظة</label>
                  <select value={formGovId} onChange={(e) => handleFormGovChange(e.target.value)} className={inputClass} required={!isNewLocation}>
                    <option value="">-- اختر المحافظة --</option>
                    {governorates.map(g => <option key={g.gov_id} value={g.gov_id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>المنطقة</label>
                  <select value={formRegionId} onChange={(e) => handleFormRegionChange(e.target.value)} className={inputClass} disabled={formGeoLoading || (!formGovId && !formRegionId)} required={!isNewLocation}>
                    <option value="">-- اختر المنطقة --</option>
                    {formRegions.map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>الشارع / النطاق التفصيلي</label>
                  <select value={form.street_id} onChange={(e) => setForm(p => ({ ...p, street_id: e.target.value }))} className={inputClass} disabled={formGeoLoading || (!formRegionId && !form.street_id)} required={!isNewLocation}>
                    <option value="">-- اختر الشارع --</option>
                    {formStreets.map(s => <option key={s.street_id} value={s.street_id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className={labelClass}>طراز الشاشة</label>
                <select value={form.type_id} onChange={(e) => setForm(p => ({ ...p, type_id: e.target.value }))} className={inputClass}>
                  <option value="">-- اختر التصنيف --</option>
                  {lookups.types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                </select>
              </div>
            </div>
            {!modalConfig.isEdit && (
              <div>
                <label className={labelClass}>مالك الشاشة</label>
                <select value={form.owner_id} onChange={(e) => setForm(p => ({ ...p, owner_id: e.target.value }))} className={inputClass}>
                  <option value="">-- تعيين مالك --</option>
                  {lookups.owners.map(o => <option key={o.user_id} value={o.user_id}>{o.full_name}</option>)}
                </select>
              </div>
            )}
          </div>

          {!modalConfig.isEdit && (
            <div>
              <label className={labelClass}>صورة مرجعية <span className="text-red-500">*</span></label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all">
                <div className="flex flex-col items-center justify-center">
                  {form.photo ? (
                    <div className="flex flex-col items-center text-emerald-600">
                      <ImageIcon className="w-7 h-7 mb-1.5" />
                      <p className="text-sm font-bold truncate max-w-xs px-4">{form.photo.name}</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-gray-400 mb-1.5" />
                      <p className="text-sm text-gray-500"><span className="font-bold">انقر للرفع</span> أو اسحب هنا</p>
                      <p className="text-xs text-gray-400 font-bold">JPG · PNG · WEBP</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" required
                  onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))} />
              </label>
            </div>
          )}

          <button type="submit" disabled={formLoading}
            className="w-full bg-gray-900 hover:bg-black text-white font-black text-sm py-4 rounded-xl transition-all mt-4 shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {formLoading ? 'جاري التنفيذ...' : (modalConfig.isEdit ? 'اعتماد التحديثات' : 'حفظ وإضافة الشاشة')}
          </button>
        </form>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="إزالة الشاشة من الشبكة"
        message="هل أنت متأكد من حذف هذه الشاشة؟ سيؤدي ذلك إلى إيقاف كافة الحملات المرتبطة بشكل فوري."
        confirmText="نعم، تنفيذ الإسقاط"
      />

      <ScreenCommandModal isOpen={!!commandTarget} onClose={() => setCommandTarget(null)} screen={commandTarget} />

      {/* ── Details Modal ── */}
      <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, screen: null })} title="البطاقة التعريفية للشاشة">
        {detailsModal.screen && (
          <div className="space-y-4" dir="rtl">
            <div className="flex items-start justify-between bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
              <div>
                <h2 className="text-base font-black text-gray-900">{detailsModal.screen.screen_name}</h2>
                <p className="text-xs font-mono font-bold text-gray-500 tracking-widest">{detailsModal.screen.mac_address || 'Unregistered MAC'}</p>
              </div>
              <StatusBadge status={detailsModal.screen.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-200">
              {[
                { label: 'كود الربط', val: detailsModal.screen.pairing_code || '—' },
                { label: 'آخر نبضة', val: detailsModal.screen.linked_at ? new Date(detailsModal.screen.linked_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'لم تتصل بعد' },
                { label: 'طراز الشاشة', val: detailsModal.screen.type?.type_name || '—' },
                { label: 'المالك', val: detailsModal.screen.owner?.full_name || '—' },
              ].map(({ label, val }) => (
                <div key={label} className="space-y-0.5">
                  <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">{label}</span>
                  <span className="font-bold text-gray-800 text-sm">{val}</span>
                </div>
              ))}
              <div className="col-span-2 space-y-0.5 pt-2 border-t border-gray-200">
                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">الموقع الجغرافي</span>
                <span className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {detailsModal.screen.street?.name || '—'}
                  {detailsModal.screen.street?.region ? ` (${detailsModal.screen.street.region.name})` : ''}
                </span>
              </div>
            </div>
            {detailsModal.screen.image_path && (
              <div>
                <span className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-wider">الصورة المرجعية</span>
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                  <img src={detailsModal.screen.image_path} alt="Screen" className="max-h-52 w-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" onClick={() => setShowImageModal(detailsModal.screen.image_path)} loading="lazy" />
                </div>
              </div>
            )}
            <button onClick={() => setDetailsModal({ open: false, screen: null })}
              className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors">
              إغلاق البطاقة
            </button>
          </div>
        )}
      </Modal>

      {/* ── Image Preview Modal ── */}
      <Modal isOpen={!!showImageModal} onClose={() => setShowImageModal(null)} title="استعراض الصورة">
        <div className="flex justify-center bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
          {showImageModal && (
            <img src={showImageModal} alt="Preview" className="max-w-full h-auto object-contain max-h-[60vh]" />
          )}
        </div>
        <button onClick={() => setShowImageModal(null)}
          className="mt-4 w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors">
          إنهاء المعاينة
        </button>
      </Modal>
    </div>
  );
};

export default ScreensPage;

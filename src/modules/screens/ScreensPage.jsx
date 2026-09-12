import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  Monitor, Plus, Trash2, TerminalSquare, Edit2, Image as ImageIcon,
  Eye, Activity, Info, MapPin, UploadCloud, AlertCircle, Layers,
  ChevronDown, Wifi, WifiOff, Wrench, Navigation, Star, X, Building, Clock, Zap, RefreshCw, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import useToastStore from '../../store/useToastStore';
import ScreenCommandModal from './components/ScreenCommandModal';
import LocationPickerMap from './components/LocationPickerMap';
import usePermission from '../../hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { useScreens, useCreateScreen, useUpdateScreen, useDeleteScreen } from '../../hooks/api/useScreens';
import { useGovernorates, useScreenTypes, useStreets, useUsersByRole, useRoles } from '../../hooks/api/useLookups';
import { useQueryClient } from '@tanstack/react-query';
import echo from '../../core/api/echo';
import useTranslation from '../../i18n/useTranslation';

// Lazy load map mapping component
const ScreenMapView = lazy(() => import('./components/ScreenMapView'));

const getStatusCfg = (t) => ({
  Online: { label: t('screens.status_online'), dot: 'bg-[#166534]', text: 'text-[#166534]', ring: 'border-[#166534]', bg: 'bg-[#dcfce7]', icon: Wifi },
  Offline: { label: t('screens.status_offline'), dot: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', ring: 'border-[#ba1a1a]', bg: 'bg-[#ffdad6]', icon: WifiOff },
  Maintenance: { label: t('screens.status_maintenance'), dot: 'bg-[#eab308]', text: 'text-[#854d0e]', ring: 'border-[#eab308]', bg: 'bg-[#fef9c3]', icon: Wrench },
  pending_activation: { label: t('screens.tab_pending_activation'), dot: 'bg-[#9ca3af]', text: 'text-[#4b5563]', ring: 'border-[#9ca3af]', bg: 'bg-[#f3f4f6]', icon: Clock },
});

const CascadingSelect = ({ label, value, onChange, options, placeholder, disabled, icon: Icon = null }) => (
  <div className={`flex-1 bg-[#ffffff] border border-[#c3c6d7] rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm transition-all hover:border-[#004ac6] ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}>
    {Icon && <Icon className="w-5 h-5 text-[#004ac6] shrink-0" />}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-transparent border-none text-[15px] font-bold text-[#141b2b] focus:ring-0 cursor-pointer outline-none w-full truncate"
    >
      <option value="">{placeholder}</option>
      {options.map(op => (
        <option key={op.value} value={op.value}>{op.label}</option>
      ))}
    </select>
  </div>
);

const ScreensPage = () => {
  const { data: screens = [], isLoading: screensLoading, refetch: refetchScreens } = useScreens();
  const { data: governorates = [], isLoading: govLoading } = useGovernorates();
  const [geoLoading, setGeoLoading] = useState(false);
  const { data: types = [] } = useScreenTypes();
  const { data: ownersData = [] } = useUsersByRole(3); // 3 is the ScreenOwner role_id
  const { data: roles = [] } = useRoles();

  const { mutateAsync: createScreen } = useCreateScreen();
  const { mutateAsync: updateScreen } = useUpdateScreen();
  const { mutateAsync: deleteScreenAPI } = useDeleteScreen();

  const lookups = { types, owners: ownersData };

  const loading = screensLoading;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalConfig, setModalConfig] = useState({ open: false, isEdit: false, screen: null });
  const [formLoading, setFormLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [commandTarget, setCommandTarget] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { can } = usePermission();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToastStore(state => state.addToast);
  const { t, isRTL, dir } = useTranslation();
  const STATUS_CFG = useMemo(() => getStatusCfg(t), [t]);

  useEffect(() => {
    const channel = echo.private('admin.screens');
    channel.listen('ScreenUpdated', (e) => {
      queryClient.invalidateQueries(['screens']);
      if (e.screen) {
        addToast(`${t('common.refresh')}: ${e.screen.screen_name}`, 'info');
      }
    });

    return () => {
      echo.leave('admin.screens');
    };
  }, [queryClient, addToast]);

  // Geographic filter state
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

  // Peak Hours State
  const [peakSlots, setPeakSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    screen_name: '', mac_address: '', type_id: '', street_id: '',
    owner_id: '', status: 'Online', photo: null,
    base_price: '10', screen_size_inch: '55',
    latitude: null, longitude: null,
  });

  const [quickOwnerModal, setQuickOwnerModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [quickOwnerForm, setQuickOwnerForm] = useState({ full_name: '', email: '', phone: '' });
  const [quickOwnerLoading, setQuickOwnerLoading] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchScreens();
    setTimeout(() => setIsRefreshing(false), 600);
  };

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
      setRegions(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []));
    } catch (e) {
      setRegions([]);
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
      setStreets(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []));
    } catch (e) {
      setStreets([]);
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

  const filteredByGeo = useMemo(() => {
    if (!screens.length) return [];
    return screens.filter(s => {
      if (selectedStreet) return String(s.street_id) === String(selectedStreet);
      if (selectedRegion) return String(s.street?.region_id) === String(selectedRegion);
      if (selectedGov) return String(s.street?.region?.gov_id) === String(selectedGov);
      return true;
    });
  }, [screens, selectedGov, selectedRegion, selectedStreet]);

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

  const filteredScreens = useMemo(() => {
    let base = filteredByGeo;
    if (statusFilter !== 'all') {
      base = base.filter(s => (s.computed_status || s.status) === statusFilter || (statusFilter === 'pending_activation' && !(s.computed_status || s.status)));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      base = base.filter(s =>
        (s.screen_name && s.screen_name.toLowerCase().includes(q)) ||
        (s.mac_address && s.mac_address.toLowerCase().includes(q)) ||
        (s.street?.name && s.street.name.toLowerCase().includes(q)) ||
        (s.type?.type_name && s.type.type_name.toLowerCase().includes(q)) ||
        (s.owner?.full_name && s.owner.full_name.toLowerCase().includes(q))
      );
    }
    return base;
  }, [filteredByGeo, statusFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: screens.length,
    online: screens.filter(s => (s.computed_status || s.status) === 'Online').length,
    offline: screens.filter(s => (s.computed_status || s.status) === 'Offline').length,
    maintenance: screens.filter(s => (s.computed_status || s.status) === 'Maintenance').length,
  }), [screens]);

  const fetchFormRegions = async (govId) => {
    try {
      setFormGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
      setFormRegions(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []));
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
      setFormStreets(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []));
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

  const handleOpenModal = async (isEdit = false, screen = null) => {
    setPeakSlots([]); // Reset
    if (isEdit && screen) {
      setForm({
        screen_name: screen.screen_name || '',
        mac_address: screen.mac_address || '',
        type_id: screen.type_id || '',
        street_id: screen.street_id || '',
        owner_id: screen.owner_id || '',
        status: screen.status || 'Online',
        photo: null,
        base_price: screen.base_price ?? '10',
        screen_size_inch: screen.screen_size_inch ?? '55',
        latitude: screen.latitude ? parseFloat(screen.latitude) : null,
        longitude: screen.longitude ? parseFloat(screen.longitude) : null,
      });

      const initialRegionId = screen.street?.region_id || '';
      const initialGovId = screen.street?.region?.gov_id || '';
      setFormGovId(initialGovId);
      setFormRegionId(initialRegionId);
      if (initialGovId) fetchFormRegions(initialGovId);
      if (initialRegionId) fetchFormStreets(initialRegionId);

      setSlotsLoading(true);
      try {
        const slotsRes = await axiosClient.get(`${ENDPOINTS.SCREEN_PRICING.ALL}?screen_id=${screen.screen_id}`);
        const allSlots = Array.isArray(slotsRes.data) ? slotsRes.data : (Array.isArray(slotsRes.data?.data) ? slotsRes.data.data : []);
        setPeakSlots(allSlots.map(s => ({
          id: s.slot_id || s.id,
          start_time: s.start_time ? s.start_time.substring(0, 5) : '16:00',
          end_time: s.end_time ? s.end_time.substring(0, 5) : '22:00',
          price_multiplier: s.price_multiplier,
          isSaved: true
        })));
      } catch (e) {
        console.error('Failed to load slots', e);
      }
      setSlotsLoading(false);
    } else {
      setForm({ screen_name: '', mac_address: '', type_id: '', street_id: '', owner_id: '', status: 'Online', photo: null, base_price: '10', screen_size_inch: '55', latitude: null, longitude: null });
      setFormGovId('');
      setFormRegionId('');
      setFormRegions([]);
      setFormStreets([]);
    }
    setIsNewLocation(false);
    setNewLocation({ governorate: '', region: '', street: '' });
    setModalConfig({ open: true, isEdit, screen });
  };

  const handleAddSlot = () => {
    setPeakSlots([...(Array.isArray(peakSlots) ? peakSlots : []), { id: 'new_' + Date.now(), start_time: '16:00', end_time: '22:00', price_multiplier: '1.5', isSaved: false }]);
  };

  const handleUpdateSlot = (id, field, value) => {
    setPeakSlots((Array.isArray(peakSlots) ? peakSlots : []).map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleRemoveSlot = (id) => {
    setPeakSlots((Array.isArray(peakSlots) ? peakSlots : []).filter(s => s.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNewLocation && (!newLocation.governorate || !newLocation.region || !newLocation.street)) {
      addToast(t('common.required_fields'), 'warning');
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
        queryClient.invalidateQueries({ queryKey: ['governorates'] });
        queryClient.invalidateQueries({ queryKey: ['streets'] });
      }

      const fd = new FormData();
      const payload = { ...form, street_id: finalStreetId };
      Object.entries(payload).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') fd.append(k, v); });

      let screenIdStr = null;

      if (modalConfig.isEdit) {
        const res = await updateScreen({ id: modalConfig.screen.screen_id, payload: fd });
        screenIdStr = modalConfig.screen.screen_id;
      } else {
        const res = await createScreen(fd);
        screenIdStr = res?.data?.screen_id || res?.screen_id;
      }

      // Sync Peak Slots
      if (screenIdStr) {
        if (modalConfig.isEdit) {
          const slotsRes = await axiosClient.get(ENDPOINTS.SCREEN_PRICING.ALL);
          const allSlots = Array.isArray(slotsRes.data) ? slotsRes.data : (Array.isArray(slotsRes.data?.data) ? slotsRes.data.data : []);
          const oldScreenSlots = allSlots.filter(s => s.screen_id === modalConfig.screen.screen_id);

          for (const oldSlot of oldScreenSlots) {
            const stillExists = (Array.isArray(peakSlots) ? peakSlots : []).find(ps => ps.id === (oldSlot.slot_id || oldSlot.id));
            if (!stillExists) {
              await axiosClient.delete(ENDPOINTS.SCREEN_PRICING.DELETE(oldSlot.slot_id || oldSlot.id)).catch(() => { });
            }
          }
        }

        for (const slot of (Array.isArray(peakSlots) ? peakSlots : [])) {
          const payload = {
            screen_id: parseInt(screenIdStr),
            start_time: slot.start_time,
            end_time: slot.end_time,
            price_multiplier: parseFloat(slot.price_multiplier)
          };
          if (slot.isSaved && slot.id && String(slot.id).indexOf('new_') === -1) {
            await axiosClient.put(ENDPOINTS.SCREEN_PRICING.UPDATE(slot.id), payload).catch(() => { });
          } else {
            await axiosClient.post(ENDPOINTS.SCREEN_PRICING.ALL, payload).catch(() => { });
          }
        }
      }

      setModalConfig({ open: false, isEdit: false, screen: null });
    } catch (e) {
      addToast(e.response?.data?.message || t('common.error'), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleQuickAddOwner = async (e) => {
    e.preventDefault();
    setQuickOwnerLoading(true);
    try {
      const ownerRole = roles.find(r => r.role_id === 3);

      if (!ownerRole) throw new Error("ScreenOwner role not found");

      const payload = {
        ...quickOwnerForm,
        role_id: ownerRole.role_id,
        password: 'password123',
      };

      const res = await axiosClient.post(ENDPOINTS.USERS.ALL, payload);
      const newUser = res.data?.data || res.data?.user;

      addToast(t('users.user_saved'), 'success');

      queryClient.invalidateQueries({ queryKey: ['users', 'role', 'ScreenOwner'] });

      setForm(p => ({ ...p, owner_id: newUser.user_id }));
      setQuickOwnerModal(false);
      setQuickOwnerForm({ full_name: '', email: '', phone: '' });
    } catch (err) {
      addToast(err.response?.data?.message || err.message || t('common.error'), 'error');
    } finally {
      setQuickOwnerLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteScreenAPI(deleteTarget);
      setDeleteTarget(null);
    } catch {
      // Error is handled by mutation hook
    }
  };

  const statusTabs = [
    { key: 'all', label: t('screens.tab_all') },
    { key: 'Online', label: t('screens.tab_online') },
    { key: 'Offline', label: t('screens.tab_offline') },
    { key: 'Maintenance', label: t('screens.tab_maintenance') },
    { key: 'pending_activation', label: t('screens.tab_pending_activation') },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto p-[24px] space-y-[32px] font-sans text-right" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {/* ── Page Header ── */}
      <div className="text-right mb-6 pt-2">
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: '#141b2b',
          letterSpacing: '-0.02em',
          fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          margin: 0,
        }}>
          {t('screens.screens_and_devices')}
        </h1>
        <div style={{ width: '60px', height: '3px', background: '#004ac6', borderRadius: '99px', margin: '10px 0 0' }} />
      </div>

      {/* ── Add New Screen Action Button - Full Width above Stats Cards ── */}
      {(can('manage_all') || can('manage_screens')) && (
        <button
          onClick={() => handleOpenModal(false)}
          className="w-full flex items-center justify-center gap-2.5 bg-[#004ac6] text-[#ffffff] py-4 px-6 rounded-xl hover:bg-[#141b2b] transition-all shadow-md text-[18px] font-extrabold cursor-pointer border border-[#004ac6]"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
          <span>{t('screens.add_new_screen')}</span>
        </button>
      )}

      {/* ── Stats Row ── */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]">
          {/* Total */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl py-4 px-4 flex flex-col items-center justify-center text-center shadow-sm">
            <p className="text-lg md:text-xl font-black text-[#141b2b] mb-1">{t('screens.total_screens')}</p>
            <p className="text-base md:text-lg font-normal text-[#141b2b]">{stats.total}</p>
          </div>
          {/* Active */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl py-4 px-4 flex flex-col items-center justify-center text-center shadow-sm">
            <p className="text-lg md:text-xl font-black text-[#141b2b] mb-1">{t('screens.online_now')}</p>
            <p className="text-base md:text-lg font-normal text-[#166534]">{stats.online}</p>
          </div>
          {/* Disconnected */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl py-4 px-4 flex flex-col items-center justify-center text-center shadow-sm">
            <p className="text-lg md:text-xl font-black text-[#141b2b] mb-1">{t('screens.offline_now')}</p>
            <p className="text-base md:text-lg font-normal text-[#ba1a1a]">{stats.offline}</p>
          </div>
          {/* Maintenance */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl py-4 px-4 flex flex-col items-center justify-center text-center shadow-sm">
            <p className="text-lg md:text-xl font-black text-[#141b2b] mb-1">{t('screens.under_maintenance')}</p>
            <p className="text-base md:text-lg font-normal text-[#854d0e]">{stats.maintenance}</p>
          </div>
        </div>
      )}

      {/* ── Map & List Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] min-h-[600px] h-full lg:h-[600px]">
        {/* Screen List Sidebar */}
        <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl flex flex-col h-full overflow-hidden shadow-sm lg:col-span-1">
          <div className="p-[16px] border-b border-[#c3c6d7] bg-[#f1f3ff] flex justify-between items-center">
            <div className="flex items-center gap-[8px]">
              <h3 className="text-[20px] font-semibold text-[#141b2b]">{t('screens.all_available_screens')}</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-[8px] space-y-[8px] custom-scrollbar">
            {featuredScreens.length > 0 ? (
              featuredScreens.map(screen => {
                return (
                  <div key={screen.screen_id} className="border border-[#c3c6d7] rounded-lg p-[12px] bg-[#f9f9ff] hover:border-[#004ac6] transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/screens/${screen.screen_id}`)}>
                    <div className="flex justify-between items-center mb-[12px]">
                      <div className="min-w-0 pr-1 flex-1">
                        <h4 className="text-[20px] font-bold text-[#141b2b] truncate">{screen.screen_name}</h4>
                      </div>
                      <div className="w-16 h-12 bg-[#e1e8fd] rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                        {screen.image_path ? (
                          <img src={screen.image_path} alt={screen.screen_name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <ImageIcon className="text-[#c3c6d7] w-6 h-6" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-[8px]">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/screens/${screen.screen_id}`); }} className="flex-1 py-2 border border-[#004ac6] text-[#004ac6] rounded-lg text-[14px] font-bold hover:bg-[#004ac6] hover:text-[#ffffff] transition-colors">{t('screens.details_and_performance')}</button>
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(true, screen); }} className="flex-1 py-2 border border-[#c3c6d7] text-[#141b2b] rounded-lg text-[14px] font-bold hover:bg-[#e1e8fd] transition-colors">{t('screens.edit_location')}</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center opacity-50">
                <Monitor className="w-10 h-10 mb-2" />
                <p>{t('screens.no_screens_match')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-2 bg-[#ffffff] border border-[#E5E7EB] rounded-xl flex flex-col h-full overflow-hidden relative shadow-sm">
          {/* Filters Overlay */}
          <div className="p-3 border-b border-[#c3c6d7] bg-[#f9f9ff]/90 backdrop-blur-md absolute top-0 w-full z-10 flex gap-2 items-center">
            <CascadingSelect
              icon={Navigation}
              value={selectedGov}
              onChange={handleGovChange}
              placeholder={t('screens.all_governorates')}
              options={governorates.map(g => ({ value: g.gov_id, label: g.name }))}
            />
            <CascadingSelect
              icon={Building}
              value={selectedRegion}
              onChange={handleRegionChange}
              placeholder={t('screens.all_regions')}
              options={regions.map(r => ({ value: r.region_id, label: r.name }))}
              disabled={!selectedGov || geoLoading}
            />
            <CascadingSelect
              icon={MapPin}
              value={selectedStreet}
              onChange={setSelectedStreet}
              placeholder={t('screens.all_streets')}
              options={streets.map(s => ({ value: s.street_id, label: s.name }))}
              disabled={!selectedRegion || geoLoading}
            />
            {(selectedGov || selectedRegion || selectedStreet) && (
              <button
                onClick={clearFilters}
                className="bg-[#ffdad6] text-[#ba1a1a] px-3 py-2 rounded-lg text-[13px] font-bold hover:bg-[#ba1a1a] hover:text-white transition-colors flex items-center shrink-0">
                {t('screens.clear_filters')}
              </button>
            )}
          </div>

        <div className="flex-1 bg-[#e1e8fd] relative w-full h-full pt-12">
          <Suspense fallback={
            <div className="flex items-center justify-center w-full h-full">
              <p className="text-sm font-bold text-gray-500">{t('screens.loading_map')}</p>
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

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-[#ffffff] border border-[#E5E7EB] rounded-lg p-[8px] shadow-sm z-10">
        <p className="text-[12px] font-normal text-[#434655] mb-2">{t('screens.screens_status')}</p>
        <div className="flex items-center gap-[4px] text-[14px] mb-1">
          <div className="w-3 h-3 rounded-full bg-[#166534]"></div> <span>{t('screens.status_online')}</span>
        </div>
        <div className="flex items-center gap-[4px] text-[14px] mb-1">
          <div className="w-3 h-3 rounded-full bg-[#ba1a1a]"></div> <span>{t('screens.status_offline')}</span>
        </div>
        <div className="flex items-center gap-[4px] text-[14px]">
          <div className="w-3 h-3 rounded-full bg-[#eab308]"></div> <span>{t('screens.status_maintenance')}</span>
        </div>
      </div>
    </div>
        </div>
      </div>

  {/* ── Full Device Table ── */}
  <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col shadow-sm">
        {/* Title & Search Header */}
        <div className="p-[20px] bg-[#f9f9ff] text-center border-b border-[#E5E7EB] space-y-4">
          <div>
            <h3 className="text-[26px] font-extrabold text-[#141b2b] m-0">{t('screens.full_screens_table')}</h3>
            <div style={{ width: '50px', height: '3px', background: '#004ac6', borderRadius: '99px', margin: '8px auto 0' }} />
          </div>

          {/* Search Box - Full Width with Refresh Button at the End */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 flex items-center gap-2 bg-white border border-[#c3c6d7] rounded-xl px-4 py-2.5 shadow-sm focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-[#004ac6]/20 transition-all">
              <Search className="w-5 h-5 text-[#004ac6] shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.search') || 'بحث عن شاشة بالاسم، الرقم التسلسلي، أو المكان...'}
                className="w-full bg-transparent outline-none text-[16px] font-bold text-[#141b2b] placeholder-[#737686]"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={t('screens.update_data')}
              className="px-5 py-2.5 flex items-center gap-2 rounded-xl bg-white text-[#141b2b] border border-[#c3c6d7] hover:bg-[#e1e8fd] hover:text-[#004ac6] transition-all shadow-sm font-bold text-[15px] shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#2563eb]' : 'text-[#004ac6]'}`} />
              <span>{t('screens.update_data')}</span>
            </button>
          </div>
        </div>

        {/* Table Tabs - Stretched Full Width */}
        <div className="p-3 bg-[#f1f3ff] border-b border-[#c3c6d7]">
          <div className="flex w-full gap-2">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex-1 py-3 px-3 rounded-lg text-[15px] font-bold transition-all flex items-center justify-center whitespace-nowrap shadow-sm ${statusFilter === tab.key
                  ? 'bg-[#141b2b] text-[#ffffff] shadow-md'
                  : 'bg-white text-[#434655] hover:bg-[#e1e8fd] border border-[#c3c6d7]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[1000px]">
            <thead className="bg-[#F8FAFC] text-[#141b2b] text-[18px] font-extrabold border-b border-[#E5E7EB]">
              <tr>
                <th className="p-[14px] whitespace-nowrap font-extrabold">{t('screens.screen_name')}</th>
                <th className="p-[14px] whitespace-nowrap">{t('screens.screen_id_col')}</th>
                <th className="p-[14px] whitespace-nowrap">{t('screens.screen_size')}</th>
                <th className="p-[14px] whitespace-nowrap text-center">{t('screens.status')}</th>
                <th className="p-[14px] whitespace-nowrap text-center">{t('screens.image')}</th>
                <th className="p-[14px] whitespace-nowrap text-center">{t('screens.type')}</th>
                <th className="p-[14px] whitespace-nowrap text-center">{t('screens.owner')}</th>
                <th className="p-[14px] whitespace-nowrap text-center">{t('screens.location')}</th>
                <th className="p-[14px] whitespace-nowrap text-center">{t('screens.last_connection')}</th>
                <th className="p-[14px] whitespace-nowrap text-center">{t('screens.actions')}</th>
              </tr>
            </thead>
            <tbody className="text-[17px] text-[#141b2b] divide-y divide-[#c3c6d7] bg-[#ffffff]">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-[#434655] font-normal">{t('screens.updating')}</td>
                </tr>
              ) : filteredScreens.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-[#434655] font-normal">{t('screens.no_matching_data')}</td>
                </tr>
              ) : (
                filteredScreens.map((row) => (
                  <tr key={row.screen_id} className="hover:bg-[#f9f9ff] transition-colors">
                    <td className="p-[14px] font-bold text-[18px] text-[#141b2b] whitespace-nowrap">{row.screen_name}</td>
                    <td className="p-[14px] whitespace-nowrap font-normal">
                      <span className="text-[#434655] font-mono text-[15px] border border-[#c3c6d7] rounded px-2 py-0.5 inline-block font-normal">{row.mac_address}</span>
                    </td>
                    <td className="p-[14px] text-[#434655] font-mono text-[16px] font-normal">{row.screen_size_inch ? t('screens.n_inch').replace('{n}', row.screen_size_inch) : '—'}</td>
                    <td className="p-[14px] text-center font-normal">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f1f3ff] text-[#434655] text-[14px] font-bold border border-[#c3c6d7]">
                        {row.status ? STATUS_CFG[row.status]?.label || row.status : t('screens.tab_pending_activation')}
                        {row.status ? <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CFG[row.status]?.dot}`}></div> : <div className="w-2.5 h-2.5 rounded-full bg-[#737686]"></div>}
                      </span>
                    </td>
                    <td className="p-[14px] text-center font-normal">
                      <div className="w-10 h-8 bg-[#e1e8fd] rounded mx-auto flex items-center justify-center text-[#c3c6d7] overflow-hidden cursor-pointer hover:border-[#004ac6] border border-transparent" onClick={() => setShowImageModal(row.image_path)}>
                        {row.image_path ? <img src={row.image_path} className="w-full h-full object-cover" alt="img" /> : <ImageIcon className="w-[18px] h-[18px]" />}
                      </div>
                    </td>
                    <td className="p-[14px] text-center text-[#434655] font-normal text-[17px] whitespace-nowrap">{row.type?.type_name || '—'}</td>
                    <td className="p-[14px] text-center text-[#434655] font-normal text-[17px] truncate max-w-[120px]">{row.owner?.full_name || '—'}</td>
                    <td className="p-[14px] text-center text-[#434655] font-normal text-[17px]">
                      {row.street ? `${row.street.name}` : '—'}
                    </td>
                    <td className="p-[14px] text-center text-[#434655] font-normal text-[16px] whitespace-nowrap">
                      {row.linked_at ? new Date(row.linked_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="p-[14px] font-normal">
                      <div className="flex items-center justify-center gap-[6px]">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/screens/${row.screen_id}`); }} className="w-9 h-9 rounded-full flex items-center justify-center text-[#004ac6] bg-[#f1f3ff] hover:bg-[#2563eb] hover:text-[#ffffff] transition-colors" title={t('screens.view')}>
                          <Eye className="w-[18px] h-[18px]" />
                        </button>
                        {(can('manage_all') || can('manage_screens')) && (
                          <button onClick={(e) => { e.stopPropagation(); setCommandTarget(row); }} className="w-9 h-9 rounded-full flex items-center justify-center text-[#434655] bg-[#f1f3ff] hover:bg-[#e1e8fd] transition-colors" title={t('screens.settings')}>
                            <TerminalSquare className="w-[18px] h-[18px]" />
                          </button>
                        )}
                        {(can('manage_all') || can('manage_screens')) && (
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(true, row); }} className="w-9 h-9 rounded-full flex items-center justify-center text-[#434655] bg-[#f1f3ff] hover:bg-[#e1e8fd] transition-colors" title={t('screens.edit')}>
                            <Edit2 className="w-[18px] h-[18px]" />
                          </button>
                        )}
                        {(can('manage_all') || can('manage_screens')) && (
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.screen_id); }} className="w-9 h-9 rounded-full flex items-center justify-center text-[#ba1a1a] bg-[#ffdad6] hover:bg-[#ba1a1a] hover:text-[#ffffff] transition-colors" title={t('screens.delete')}>
                            <Trash2 className="w-[18px] h-[18px]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-[12px] border-t border-[#c3c6d7] bg-[#f1f3ff] text-center text-[15px] font-bold text-[#434655]">
          {t('screens.showing_n_of_total').replace('{n}', filteredScreens.length).replace('{total}', screens.length)}
        </div>
      </div>

  <Modal
    isOpen={modalConfig.open}
    onClose={() => setModalConfig({ open: false, isEdit: false, screen: null })}
    title={modalConfig.isEdit ? t('screens.update_screen_data') : t('screens.register_new_screen')}
    allowMaximize={true}
    maxWidth="max-w-[880px]"
  >
    <form onSubmit={handleSubmit} dir="rtl" className="modal-form-grid space-y-4" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* ══ SECTION 1: المعلومات الأساسية ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #f1f3ff 0%, #e9edff 100%)',
        border: '1px solid #c3c6d7',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#141b2b' }}>{t('screens.basic_info_title')}</h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: modalConfig.isEdit ? '1fr' : '1fr 1fr', gap: '16px' }}>
          {/* اسم الشاشة */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>
              {t('screens.screen_name')}
            </label>
            <input
              type="text" required value={form.screen_name}
              onChange={(e) => setForm(p => ({ ...p, screen_name: e.target.value }))}
              placeholder={t('screens.screen_name_placeholder')}
              style={{
                width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#004ac6'}
              onBlur={e => e.target.style.borderColor = '#c3c6d7'}
            />
          </div>

          {/* معرف الشاشة — إضافة فقط */}
          {!modalConfig.isEdit && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>
                {t('screens.screen_id_label')}
              </label>
              <input
                type="text" required value={form.mac_address}
                onChange={(e) => setForm(p => ({ ...p, mac_address: e.target.value }))}
                placeholder="SB-NEG543RR"
                dir="ltr"
                style={{
                  width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                  padding: '12px 14px', fontSize: '15px', fontWeight: 700, fontFamily: 'monospace',
                  color: '#141b2b', background: '#fff', outline: 'none', boxSizing: 'border-box',
                  letterSpacing: '0.08em', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#004ac6'}
                onBlur={e => e.target.style.borderColor = '#c3c6d7'}
              />
            </div>
          )}

          {/* الحالة — تعديل فقط */}
          {modalConfig.isEdit && (
            <div>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>{t('screens.operational_status')}</label>
              <select
                value={form.status}
                onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                style={{
                  width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                  padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                  background: '#fff', outline: 'none', boxSizing: 'border-box',
                }}
              >
                <option value="Online">🟢 {t('screens.status_online')}</option>
                <option value="Offline">🔴 {t('screens.status_offline')}</option>
                <option value="Maintenance">🟡 {t('screens.status_maintenance_long')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ══ SECTION 2: الموقع الجغرافي ══ */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #c3c6d7',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#141b2b' }}>{t('screens.geographic_location')}</h4>
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            background: isNewLocation ? '#dbe1ff' : '#f9f9ff',
            border: `2px solid ${isNewLocation ? '#004ac6' : '#c3c6d7'}`,
            borderRadius: '10px', padding: '8px 16px', transition: 'all 0.2s',
            boxShadow: isNewLocation ? '0 2px 8px rgba(0,74,198,0.2)' : 'none',
          }}>
            <input type="checkbox" checked={isNewLocation} onChange={(e) => setIsNewLocation(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#004ac6' }} />
            <span style={{ fontSize: '15px', fontWeight: 800, color: isNewLocation ? '#004ac6' : '#141b2b' }}>{t('screens.new_location')}</span>
          </label>
        </div>

        {isNewLocation ? (
          <div style={{ background: '#f1f3ff', borderRadius: '12px', padding: '20px', border: '1.5px dashed #adc6ff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {[
                { key: 'governorate', label: t('screens.governorate'), placeholder: t('screens.gov_placeholder') },
                { key: 'region', label: t('screens.region_district'), placeholder: t('screens.region_placeholder') },
                { key: 'street', label: t('screens.main_street'), placeholder: t('screens.street_placeholder') },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                  <input
                    type="text" value={newLocation[f.key]} required={isNewLocation}
                    placeholder={f.placeholder}
                    onChange={(e) => setNewLocation(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{
                      width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                      padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                      background: '#fff', outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#004ac6'}
                    onBlur={e => e.target.style.borderColor = '#c3c6d7'}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* المحافظة */}
            <div>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>{t('screens.governorate')}</label>
              <select
                value={formGovId} onChange={(e) => handleFormGovChange(e.target.value)} required={!isNewLocation}
                style={{
                  width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                  padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                  background: '#fff', outline: 'none', boxSizing: 'border-box',
                }}>
                <option value="">{t('screens.select_gov')}</option>
                {(Array.isArray(governorates) ? governorates : []).map(g => <option key={g.gov_id} value={g.gov_id}>{g.name}</option>)}
              </select>
            </div>
            {/* المنطقة */}
            <div>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>{t('screens.region')}</label>
              <select
                value={formRegionId} onChange={(e) => handleFormRegionChange(e.target.value)} required={!isNewLocation}
                disabled={!formGovId || formGeoLoading}
                style={{
                  width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                  padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                  background: formGeoLoading ? '#f1f3ff' : '#fff', outline: 'none', boxSizing: 'border-box',
                  opacity: formGeoLoading || (!formGovId && !formRegionId) ? 0.5 : 1,
                }}>
                <option value="">{t('screens.select_region')}</option>
                {(Array.isArray(formRegions) ? formRegions : []).map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
              </select>
            </div>
            {/* الشارع */}
            <div>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>{t('screens.street')}</label>
              <select
                value={form.street_id} onChange={(e) => setForm(p => ({ ...p, street_id: e.target.value }))} required={!isNewLocation}
                disabled={!formRegionId || formGeoLoading}
                style={{
                  width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                  padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                  background: formGeoLoading ? '#f1f3ff' : '#fff', outline: 'none', boxSizing: 'border-box',
                  opacity: formGeoLoading || (!formRegionId && !form.street_id) ? 0.5 : 1,
                }}>
                <option value="">{t('screens.select_street')}</option>
                {(Array.isArray(formStreets) ? formStreets : []).map(s => <option key={s.street_id} value={s.street_id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Map Picker UI */}
        <div style={{ marginTop: '16px', background: '#f9f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #c3c6d7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#141b2b' }}>{t('screens.map_coordinates')}</h5>
            <button
              type="button"
              onClick={() => setShowMapModal(true)}
              style={{
                background: '#004ac6', color: '#fff', border: 'none', padding: '10px 22px',
                borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,74,198,0.25)',
              }}
            >
              {t('screens.pick_on_map')}
            </button>
          </div>
        </div>
      </div>

      {/* ══ SECTION 3: التصنيف والملكية والتسعير ══ */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #c3c6d7',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#141b2b' }}>{t('screens.classification_ownership_pricing')}</h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          {/* طراز الشاشة */}
          <div>
            <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>{t('screens.screen_model')}</label>
            <select
              value={form.type_id} onChange={e => setForm(p => ({ ...p, type_id: e.target.value }))} required
              style={{
                width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}>
              <option value="">{t('screens.select_type')}</option>
              {(Array.isArray(lookups.types) ? lookups.types : []).map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
            </select>
          </div>

          {/* حجم الشاشة */}
          <div>
            <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>{t('screens.screen_size_inch')}</label>
            <select value={form.screen_size_inch} onChange={(e) => setForm(p => ({ ...p, screen_size_inch: e.target.value }))}
              style={{
                width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}>
              <option value="32">32 {t('screens.inch')} (1.0×)</option>
              <option value="43">43 {t('screens.inch')} (1.0×)</option>
              <option value="55">55 {t('screens.inch')} (1.0×)</option>
              <option value="65">65 {t('screens.inch')} (1.1×)</option>
              <option value="75">75 {t('screens.inch')} (1.2×)</option>
              <option value="86">86 {t('screens.inch')} (1.35×)</option>
              <option value="98">98 {t('screens.inch')} (1.5×)</option>
            </select>
          </div>

          {/* السعر الأساسي */}
          <div>
            <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>
              {t('screens.daily_base_price')}
            </label>
            <input
              type="number" min="0" step="0.5" required
              value={form.base_price}
              onChange={(e) => setForm(p => ({ ...p, base_price: e.target.value }))}
              placeholder={t('screens.price_placeholder')}
              style={{
                width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '10px',
                padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#004ac6'}
              onBlur={e => e.target.style.borderColor = '#c3c6d7'}
            />
          </div>

          {/* مالك الشاشة */}
          {can('manage_all') && (
            <div>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '6px' }}>
                {t('screens.screen_owner_optional')}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={form.owner_id || ''}
                  onChange={(e) => setForm(p => ({ ...p, owner_id: e.target.value }))}
                  style={{
                    flex: 1, border: '1.5px solid #c3c6d7', borderRadius: '10px',
                    padding: '12px 14px', fontSize: '16px', fontWeight: 600, color: '#141b2b',
                    background: '#fff', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#004ac6'}
                  onBlur={e => e.target.style.borderColor = '#c3c6d7'}
                >
                  <option value="">{t('screens.select_owner')}</option>
                  {(lookups.owners?.data || lookups.owners || []).map(o => (
                    <option key={o.user_id} value={o.user_id}>{o.full_name} ({o.email})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setQuickOwnerModal(true)}
                  style={{
                    width: '44px', height: '44px', backgroundColor: '#e1e8fd',
                    color: '#004ac6', borderRadius: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', border: 'none',
                    cursor: 'pointer', transition: '0.2s', padding: 0
                  }}
                  title={t('screens.add_owner_quick')}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#dbe1ff'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#e1e8fd'}
                >
                  <Plus style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ SECTION 4: أوقات الذروة ══ */}
      <div style={{
        background: '#fff',
        border: '1px solid #c3c6d7',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#141b2b' }}>{t('screens.peak_hours_pricing')}</h4>
          </div>
          <button type="button" onClick={handleAddSlot}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '8px 16px', borderRadius: '10px',
              border: '1.5px solid #004ac6', background: '#fff',
              color: '#004ac6', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e1e8fd'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            <Plus style={{ width: 16, height: 16 }} /> {t('screens.add_peak_slot')}
          </button>
        </div>

        {slotsLoading ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#737686', fontSize: '14px', fontWeight: 600 }}>{t('screens.loading_peak_slots')}</div>
        ) : peakSlots.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '20px', background: '#f9f9ff',
            borderRadius: '10px', border: '1px dashed #c3c6d7',
          }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#737686', margin: 0 }}>{t('screens.no_peak_slots')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {peakSlots.map((slot) => (
              <div key={slot.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 160px 36px',
                gap: '12px', alignItems: 'end',
                background: '#f9f9ff', padding: '14px', borderRadius: '12px',
                border: '1px solid #dce2f7',
              }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '5px' }}>{t('screens.start_time')}</label>
                  <input type="time" value={slot.start_time}
                    onChange={(e) => handleUpdateSlot(slot.id, 'start_time', e.target.value)} required
                    style={{
                      width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '8px',
                      padding: '8px 10px', fontSize: '15px', fontWeight: 600, color: '#141b2b',
                      background: '#fff', outline: 'none', boxSizing: 'border-box', cursor: 'pointer'
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '5px' }}>{t('screens.end_time')}</label>
                  <input type="time" value={slot.end_time}
                    onChange={(e) => handleUpdateSlot(slot.id, 'end_time', e.target.value)} required
                    style={{
                      width: '100%', border: '1.5px solid #c3c6d7', borderRadius: '8px',
                      padding: '8px 10px', fontSize: '15px', fontWeight: 600, color: '#141b2b',
                      background: '#fff', outline: 'none', boxSizing: 'border-box', cursor: 'pointer'
                    }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#141b2b', display: 'block', marginBottom: '5px' }}>
                    {t('screens.multiplier_price')}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="number" step="0.1" min="1.1"
                      value={slot.price_multiplier}
                      onChange={(e) => handleUpdateSlot(slot.id, 'price_multiplier', e.target.value)} required
                      style={{
                        width: '64px', border: '1.5px solid #eab308', borderRadius: '8px',
                        padding: '8px 8px', fontSize: '14px', fontWeight: 800,
                        color: '#854d0e', background: '#fef9c3', outline: 'none',
                      }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#434655', whiteSpace: 'nowrap' }}>
                      = ${(parseFloat(form.base_price || 0) * parseFloat(slot.price_multiplier || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => handleRemoveSlot(slot.id)}
                  style={{
                    width: 38, height: 38, borderRadius: '8px', border: 'none',
                    background: '#ffdad6', color: '#ba1a1a', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ba1a1a'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ffdad6'; e.currentTarget.style.color = '#ba1a1a'; }}
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ SECTION: صورة مرجعية (إضافة فقط) ══ */}
      {!modalConfig.isEdit && (
        <div style={{
          border: '2px dashed #004ac6', borderRadius: '14px',
          background: '#f1f3ff', marginBottom: '16px', overflow: 'hidden',
        }}>
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '24px', cursor: 'pointer',
          }}>
            {form.photo ? (
              <div style={{ textAlign: 'center', color: '#004ac6' }}>
                <ImageIcon style={{ width: 32, height: 32, marginBottom: '8px' }} />
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{form.photo.name}</p>
                <p style={{ fontSize: '12px', color: '#737686', margin: '4px 0 0' }}>{t('screens.click_to_change_image')}</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <UploadCloud style={{ width: 36, height: 36, color: '#004ac6', marginBottom: '8px' }} />
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#141b2b', margin: '0 0 4px' }}>{t('screens.reference_image')}</p>
                <p style={{ fontSize: '13px', color: '#737686', margin: 0 }}>{t('screens.upload_formats_desc')}</p>
              </div>
            )}
            <input type="file" accept="image/*" required style={{ display: 'none' }}
              onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))} />
          </label>
        </div>
      )}

      {/* ══ زر الحفظ ══ */}
      <button
        type="submit"
        disabled={formLoading}
        style={{
          width: '100%', padding: '16px',
          background: formLoading ? '#c3c6d7' : 'linear-gradient(135deg, #004ac6 0%, #2563eb 100%)',
          color: '#fff', border: 'none', borderRadius: '12px',
          fontSize: '18px', fontWeight: 800, cursor: formLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s', fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          boxShadow: formLoading ? 'none' : '0 4px 16px rgba(0,74,198,0.30)',
          letterSpacing: '0.01em',
        }}
      >
        {formLoading ? t('screens.processing') : (modalConfig.isEdit ? t('screens.apply_updates') : t('screens.save_add_screen'))}
      </button>
    </form>
  </Modal>



{/* ── Delete Confirm ── */ }
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('screens.remove_screen_title')}
        message={t('screens.remove_screen_confirm')}
        confirmText={t('screens.yes_remove')}
      />

      <ScreenCommandModal isOpen={!!commandTarget} onClose={() => setCommandTarget(null)} screen={commandTarget} />

{/* ── Map Picker Modal ── */ }
<Modal
  isOpen={showMapModal}
  onClose={() => setShowMapModal(false)}
  title={t('screens.pick_screen_location')}
  maxWidth="max-w-[950px]"
>
  {showMapModal && <LocationPickerMap
    initialLat={form.latitude}
    initialLng={form.longitude}
    onSelect={(lat, lng) => {
      setForm(p => ({ ...p, latitude: lat, longitude: lng }));
      setShowMapModal(false);
    }}
    onClose={() => setShowMapModal(false)} />}
</Modal>

{/* ── Image Preview Modal ── */ }
<Modal isOpen={!!showImageModal} onClose={() => setShowImageModal(null)} title={t('screens.preview_image')}>
  <div className="flex justify-center bg-[#f9f9ff] rounded-2xl border border-[#c3c6d7] overflow-hidden shadow-inner p-2">
    {showImageModal && (
      <img src={showImageModal} alt="Preview" className="max-w-full h-auto object-contain max-h-[60vh] rounded" />
    )}
  </div>
  <button onClick={() => setShowImageModal(null)}
    className="mt-4 w-full bg-[#f1f3ff] text-[#004ac6] font-semibold py-3 rounded-xl hover:bg-[#dce2f7] transition-colors border border-[#dce2f7]">
    {t('screens.end_preview')}
  </button>
</Modal>

{/* ── Quick Add Owner Modal ── */ }
<Modal
  isOpen={quickOwnerModal}
  onClose={() => setQuickOwnerModal(false)}
  title={`➕ ${t('screens.add_new_owner')}`}
>
  <form onSubmit={handleQuickAddOwner} dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }} className="flex flex-col gap-4">
    <div>
      <label className="block text-[#434655] text-[13px] mb-1 font-semibold">{t('screens.full_name')} *</label>
      <input required type="text" className="w-full border border-[#c3c6d7] rounded-lg px-3 py-2 outline-none focus:border-[#004ac6] transition-colors"
        value={quickOwnerForm.full_name} onChange={e => setQuickOwnerForm(p => ({ ...p, full_name: e.target.value }))} placeholder={t('screens.name_placeholder')} />
    </div>
    <div>
      <label className="block text-[#434655] text-[13px] mb-1 font-semibold">{t('screens.email')} *</label>
      <input required type="email" className="w-full border border-[#c3c6d7] rounded-lg px-3 py-2 outline-none focus:border-[#004ac6] transition-colors"
        value={quickOwnerForm.email} onChange={e => setQuickOwnerForm(p => ({ ...p, email: e.target.value }))} placeholder="example@email.com" />
    </div>
    <div>
      <label className="block text-[#434655] text-[13px] mb-1 font-semibold">{t('screens.phone')} *</label>
      <input required type="text" className="w-full border border-[#c3c6d7] rounded-lg px-3 py-2 outline-none focus:border-[#004ac6] transition-colors"
        value={quickOwnerForm.phone} onChange={e => setQuickOwnerForm(p => ({ ...p, phone: e.target.value }))} placeholder="05xxxxxxxx" />
    </div>
    <div className="bg-[#f1f3ff] text-[#004ac6] p-3 rounded-lg text-xs leading-relaxed border border-[#dbe1ff]">
      <strong>{t('screens.important_note')}</strong> <span dangerouslySetInnerHTML={{ __html: t('screens.default_password_note') }} />
    </div>
    <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-[#e5e7eb]">
      <button type="button" onClick={() => setQuickOwnerModal(false)} disabled={quickOwnerLoading} className="px-4 py-2 rounded-lg text-[#434655] bg-[#f8fafc] hover:bg-[#e1e8fd] font-medium transition-colors">
        {t('screens.cancel')}
      </button>
      <button type="submit" disabled={quickOwnerLoading} className="px-5 py-2 rounded-lg bg-[#004ac6] text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50">
        {quickOwnerLoading ? t('screens.saving') : t('screens.save_and_select_owner')}
      </button>
    </div>
  </form>
</Modal>
    </div>
  );
};

export default ScreensPage;



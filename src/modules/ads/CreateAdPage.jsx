import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, ArrowRight, Monitor, CheckSquare, Info, Calendar, Clock, DollarSign,
    Image as ImageIcon, FileText, CheckCircle2, ChevronDown, Layers, Crosshair,
    MapPin, Calculator, ShieldCheck, Activity, ChevronLeft, Flag, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import ScreenAvailabilityModal from './components/ScreenAvailabilityModal';
import usePermission from '../../hooks/usePermission';
import ScreenMapView from '../screens/components/ScreenMapView';
import useTranslation from '../../i18n/useTranslation';

const CreateAdPage = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [screens, setScreens] = useState([]);
    const [selectedScreens, setSelectedScreens] = useState([]);
    const [availabilityScreen, setAvailabilityScreen] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    const [form, setForm] = useState({
        title: '', start_date: '', end_date: '', target_start_time: '00:00', target_end_time: '23:59', daily_shift: '24h',
        total_cost: '', file: null,
        advertiser_id: '', video_duration_sec: 0
    });
    const [calculatedCost, setCalculatedCost] = useState(null);
    const [costDetails, setCostDetails] = useState(null);
    const [costLoading, setCostLoading] = useState(false);
    const [advertisers, setAdvertisers] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { can } = usePermission();
    const { t, dir } = useTranslation();

    // ── Step-3 search & geo filter state ─────────────────────────────────
    const [screenSearch, setScreenSearch] = useState('');
    const [filterGov, setFilterGov] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [filterStreet, setFilterStreet] = useState('');
    const [govList, setGovList] = useState([]);
    const [regionList, setRegionList] = useState([]);
    const [streetList, setStreetList] = useState([]);
    const [geoFilterLoading, setGeoFilterLoading] = useState(false);

    useEffect(() => {
        const fetchScreens = async () => {
            try {
                const res = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
                setScreens(res.data || []);
            } catch (e) { console.error(e); }
        };

        const fetchAdvertisers = async () => {
            if (!can('manage_all')) return;
            try {
                const res = await axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('Advertiser'));
                setAdvertisers(res.data || []);
            } catch (e) { console.error(e); }
        };

        const fetchGovs = async () => {
            try {
                const res = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES);
                setGovList(res.data || []);
            } catch (e) { console.error(e); }
        };

        fetchScreens();
        fetchAdvertisers();
        fetchGovs();

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, []);

    // ── Geo-filter cascade handlers ───────────────────────────────────────
    const handleFilterGovChange = async (govId) => {
        setFilterGov(govId);
        setFilterRegion('');
        setFilterStreet('');
        setRegionList([]);
        setStreetList([]);
        if (!govId) return;
        try {
            setGeoFilterLoading(true);
            const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
            setRegionList(res.data || []);
        } catch (e) { console.error(e); }
        finally { setGeoFilterLoading(false); }
    };

    const handleFilterRegionChange = async (regionId) => {
        setFilterRegion(regionId);
        setFilterStreet('');
        setStreetList([]);
        if (!regionId) return;
        try {
            setGeoFilterLoading(true);
            const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId));
            setStreetList(res.data || []);
        } catch (e) { console.error(e); }
        finally { setGeoFilterLoading(false); }
    };

    const clearGeoFilters = () => {
        setScreenSearch('');
        setFilterGov('');
        setFilterRegion('');
        setFilterStreet('');
        setRegionList([]);
        setStreetList([]);
    };

    // ── Derived: screens visible in Step 3 ───────────────────────────────
    const filteredScreensForAd = React.useMemo(() => {
        return screens.filter(s => {
            // text search (name, street, region)
            if (screenSearch.trim()) {
                const q = screenSearch.trim().toLowerCase();
                const hit =
                    s.screen_name?.toLowerCase().includes(q) ||
                    s.street?.name?.toLowerCase().includes(q) ||
                    s.street?.region?.name?.toLowerCase().includes(q);
                if (!hit) return false;
            }
            // cascading geo filter
            if (filterStreet) return String(s.street_id) === String(filterStreet);
            if (filterRegion) return String(s.street?.region_id) === String(filterRegion);
            if (filterGov) return String(s.street?.region?.gov_id) === String(filterGov);
            return true;
        });
    }, [screens, screenSearch, filterGov, filterRegion, filterStreet]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file && file.size > 50 * 1024 * 1024) {
            addToast(t('ads.file_size_exceeds_50mb'), 'error');
            e.target.value = null;
            return;
        }

        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Extract video duration if it's a video file
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.src = url;
                video.onloadedmetadata = () => {
                    const dur = Math.round(video.duration);
                    setForm(p => ({ ...p, file, video_duration_sec: dur }));
                };
                video.onerror = () => setForm(p => ({ ...p, file, video_duration_sec: 0 }));
            } else {
                // Image has no duration — treat as 10 sec by convention
                setForm(p => ({ ...p, file, video_duration_sec: 10 }));
            }
        } else {
            setPreviewUrl(null);
            setForm(p => ({ ...p, file: null, video_duration_sec: 0 }));
        }
    };

    const toggleScreen = (screenId) => {
        setSelectedScreens(prev =>
            prev.includes(screenId) ? prev.filter(id => id !== screenId) : [...prev, screenId]
        );
        if (calculatedCost !== null) {
            setCalculatedCost(null);
            setCostDetails(null);
            setForm(p => ({ ...p, total_cost: '' }));
        }
    };

    const addDays = (days) => {
        let startStr = form.start_date;
        if (!startStr) {
            startStr = new Date().toISOString().split('T')[0];
        }

        const start = new Date(startStr);
        start.setDate(start.getDate() + days - 1);

        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        const d = String(start.getDate()).padStart(2, '0');
        const formattedDate = `${y}-${m}-${d}`;

        setForm(p => ({ ...p, start_date: startStr, end_date: formattedDate }));
        if (calculatedCost) setCalculatedCost(null);
    };

    const handleCalculateCost = async () => {
        if (selectedScreens.length === 0 || !form.start_date || !form.end_date) {
            addToast(t('ads.fill_screens_and_dates_before_cost'), 'warning');
            return;
        }
        setCostLoading(true);
        try {
            let sd = '', ed = '';
            if (form.start_date) sd = form.start_date.split('T')[0];
            if (form.end_date) ed = form.end_date.split('T')[0];

            const payload = {
                screen_ids: selectedScreens,
                start_date: sd,
                target_start_time: form.target_start_time,
                end_date: ed,
                target_end_time: form.target_end_time,
                // interval_minutes تم إلغاؤه
                video_duration_sec: form.video_duration_sec || 30,
            };

            const res = await axiosClient.post(ENDPOINTS.ADS.CALCULATE_COST, payload);
            const data = res.data.data;
            setCalculatedCost(data.total_cost);
            setCostDetails(data);
            setForm(p => ({ ...p, total_cost: data.total_cost }));
            addToast(t('ads.cost_calculated_successfully'), 'success');
        } catch (e) {
            addToast(e.response?.data?.message || t('ads.cost_calculation_failed'), 'error');
        } finally {
            setCostLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedScreens.length === 0) {
            addToast(t('ads.assign_campaign_to_screen_required'), 'warning');
            return;
        }
        if (calculatedCost === null) {
            addToast(t('ads.calculate_cost_before_submit_required'), 'warning');
            return;
        }

        setLoading(true);
        setUploadProgress(0);
        const formData = new FormData();
        Object.entries(form).forEach(([key, val]) => {
            if (val !== '' && val !== null && !['start_date', 'end_date'].includes(key)) {
                if (['total_cost'].includes(key)) {
                    formData.append(key, Number(val));
                } else {
                    formData.append(key, val);
                }
            }
        });

        let sd = '', ed = '';
        if (form.start_date) sd = form.start_date.split('T')[0];
        if (form.end_date) ed = form.end_date.split('T')[0];

        formData.append('start_date', sd);
        formData.append('end_date', ed);

        formData.append('target_start_time', form.target_start_time);
        formData.append('target_end_time', form.target_end_time);

        selectedScreens.forEach(id => formData.append('screen_ids[]', id));

        try {
            await axiosClient.post(ENDPOINTS.ADS.CREATE, formData, {
                timeout: 180000,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            addToast(t('ads.campaign_uploaded_successfully_review'), 'success');
            navigate('/dashboard/ads');
        } catch (e) {
            console.error('API Error:', e.response?.data);
            const detailedErrors = e.response?.data?.errors;
            if (detailedErrors && typeof detailedErrors === 'object') {
                const firstError = Object.values(detailedErrors)[0]?.[0];
                if (firstError) {
                    addToast(firstError, 'error');
                    setLoading(false);
                    setUploadProgress(0);
                    return;
                }
            }
            addToast(e.response?.data?.message || t('ads.campaign_upload_failed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full border border-border-color rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors";
    const labelClass = "block font-label-md text-label-md text-on-background mb-2";

    const steps = [
        { id: 1, title: t('ads.step1_title'), subtitle: t('ads.step1_subtitle') },
        { id: 2, title: t('ads.step2_title'), subtitle: t('ads.step2_subtitle') },
        { id: 3, title: t('ads.step3_title'), subtitle: t('ads.step3_subtitle') },
        { id: 4, title: t('ads.step4_title'), subtitle: t('ads.step4_subtitle') },
        { id: 5, title: t('ads.step5_title'), subtitle: t('ads.step5_subtitle') }
    ];

    const nextStep = () => {
        if (currentStep === 1) {
            if (!form.title.trim()) {
                addToast(t('ads.please_write_campaign_title'), 'warning');
                return;
            }
        }
        if (currentStep === 2) {
            if (selectedScreens.length === 0) {
                addToast(t('ads.please_select_at_least_one_screen'), 'warning');
                return;
            }
        }
        if (currentStep === 3) {
            if (!form.start_date || !form.end_date) {
                addToast(t('ads.please_select_full_campaign_date'), 'warning');
                return;
            }
            if (!form.target_start_time || !form.target_end_time) {
                addToast(t('ads.please_select_daily_display_times'), 'warning');
                return;
            }
        }
        if (currentStep === 4) {
            if (!form.file) {
                addToast(t('ads.please_upload_visual_material'), 'warning');
                return;
            }
        }
        if (currentStep < 5) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const isStepDone = (stepNum) => currentStep > stepNum;
    const isStepCurrent = (stepNum) => currentStep === stepNum;

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-background rounded-2xl overflow-hidden shadow-sm border border-border-color">
            <header className="bg-surface/95 backdrop-blur-md border-b border-border-color sticky top-0 z-30">
                <div className="flex items-center justify-between px-5 md:px-6 h-13 gap-3" style={{ height: '52px' }}>
                    {/* Right: back + step dots */}
                    <div className="flex items-center gap-2.5">
                        <button onClick={() => navigate('/dashboard/ads')} className="group flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5" style={{ transform: dir === 'ltr' ? 'rotate(180deg)' : 'none' }}>arrow_forward</span>
                            <span className="hidden md:block font-label-md text-label-md">{t('ads.title')}</span>
                        </button>
                        <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>
                        <div className="hidden sm:flex items-center gap-1">
                            {steps.map(s => (
                                <div key={s.id} className={`transition-all duration-300 rounded-full ${s.id < currentStep ? 'w-4 h-1.5 bg-secondary' :
                                    s.id === currentStep ? 'w-6 h-1.5 bg-primary' :
                                        'w-1.5 h-1.5 bg-outline-variant'
                                    }`} />
                            ))}
                        </div>
                    </div>
                    {/* Center: title */}
                    <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>campaign</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold hidden sm:block">{t('ads.launch_campaign')}</span>
                        <span className="font-caption text-caption text-outline hidden md:block">· {steps[currentStep - 1]?.title}</span>
                    </div>
                    {/* Left: KPI badges */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-border-color">
                            <span className="material-symbols-outlined text-[14px] text-outline">payments</span>
                            <span className="font-label-md text-label-md text-on-surface font-bold" dir="ltr">{calculatedCost ? `$${(calculatedCost ? Number(calculatedCost).toFixed(2) : "0.00")}` : '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-border-color">
                            <span className="material-symbols-outlined text-[14px] text-outline">desktop_windows</span>
                            <span className="font-label-md text-label-md text-on-surface font-bold">{selectedScreens.length}</span>
                        </div>
                    </div>
                </div>
                {/* Animated gradient progress bar */}
                <div className="h-[2px] w-full bg-outline-variant/20 relative overflow-hidden">
                    <motion.div
                        className="absolute top-0 right-0 h-full bg-gradient-to-l from-primary via-primary/80 to-secondary rounded-full"
                        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                    />
                </div>
            </header>

            <main className="flex-1 p-3 md:p-5 w-full font-sans" dir={dir}>
                {/* Slim compact title row */}
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-primary/20 text-primary flex items-center justify-center border border-primary/10 shadow-sm flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>campaign</span>
                        </div>
                        <div>
                            <h2 className="font-title-md text-title-md text-on-background font-bold leading-snug">{t('ads.launch_new_campaign')}</h2>
                            <p className="font-caption text-caption text-on-surface-variant">{steps[currentStep - 1]?.title} · {t('ads.step')} {currentStep} {t('ads.of')} {steps.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/ads')}
                        className="group flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-error-container/20 border border-border-color hover:border-error/30 text-error rounded-xl transition-all font-label-md shadow-sm flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-[17px] transition-transform group-hover:translate-x-0.5" style={{ transform: dir === 'ltr' ? 'rotate(180deg)' : 'none' }}>arrow_forward</span>
                        <span className="hidden sm:block">{t('common.cancel')}</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* MAIN FORM CARD - Left side */}
                    <div className="flex-1 flex flex-col gap-4 order-2 lg:order-2 min-w-0">
                        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 md:p-7 flex flex-col gap-6 flex-1 shadow-sm">
                            <form onSubmit={handleSubmit} className="relative">
                                <AnimatePresence mode="wait">

                                    {/* STEP 1: CAMPAIGN INFORMATION */}
                                    {currentStep === 1 && (
                                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                            <div className="mb-8">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                                                    <h3 className="font-title-lg text-title-lg text-on-background">{t('ads.basic_info_title')}</h3>
                                                </div>
                                                <p className="font-body-md text-body-md text-on-surface-variant">{t('ads.basic_info_desc')}</p>
                                            </div>

                                            <div className="space-y-6">
                                                {can('manage_all') && (
                                                    <div className="bg-surface-container-low p-6 rounded-xl border border-border-color">
                                                        <label className="font-label-md text-label-md text-primary mb-3 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined">admin_panel_settings</span> {t('ads.assign_to_advertiser')}
                                                        </label>
                                                        <div className="relative">
                                                            <select value={form.advertiser_id} onChange={(e) => setForm(p => ({ ...p, advertiser_id: e.target.value }))} className="w-full bg-white border border-border-color rounded-lg py-3 px-4 text-on-background focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors cursor-pointer shadow-sm appearance-none font-body-md">
                                                                <option value="">-- {t('ads.issue_under_admin')} --</option>
                                                                {advertisers.map(adv => <option key={adv.user_id} value={adv.user_id}>{adv.full_name}</option>)}
                                                            </select>

                                                            <span className={`material-symbols-outlined absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-outline pointer-events-none`}>expand_content</span>
                                                        </div>
                                                        <p className="font-caption text-caption text-on-surface-variant mt-2 px-1">{t('ads.assign to advertiser note')}</p>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 gap-8">
                                                    <div>
                                                        <label className={labelClass}>{t('ads.campaign_title_label')} <span className="text-error">*</span></label>
                                                        <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t('ads.campaign_title_placeholder')} className={inputClass} />
                                                        <p className="font-caption text-caption text-on-surface-variant mt-1.5 px-1">{t('ads.campaign_title_note')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* STEP 3: SCHEDULING & FREQUENCY (Was Step 2) */}
                                    {currentStep === 3 && (
                                        <motion.div
                                            key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                            className="bg-white rounded-2xl border border-border-color p-6 md:p-8 shadow-sm"
                                        >
                                            <div className="mb-8">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                                                    <h3 className="font-title-lg text-title-lg text-on-background">{t('ads.scheduling_density_title')}</h3>
                                                </div>
                                                <p className="font-body-md text-body-md text-on-surface-variant">{t('ads.scheduling_density_desc')}</p>
                                            </div>

                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10 bg-surface-container-low/50 p-6 rounded-2xl border border-border-color">
                                                <div>
                                                    <label className="block font-title-sm text-title-sm text-on-background mb-3">
                                                        {t('ads.start date')} <span className="text-error">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="date"
                                                            value={form.start_date}
                                                            onChange={(e) => { setForm(p => ({ ...p, start_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }}
                                                            className="w-full border border-border-color bg-white rounded-xl px-5 py-4 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-14 text-left shadow-sm"
                                                            dir="ltr"
                                                            min={new Date().toISOString().split('T')[0]}
                                                        />
                                                        <span className={`material-symbols-outlined text-[26px] absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-primary pointer-events-none`}>calendar_month</span>
                                                    </div>
                                                    <p className="font-caption text-caption text-on-surface-variant mt-2 px-1">{t('ads.start_date_desc')}</p>
                                                </div>
                                                <div>
                                                    <label className="block font-title-sm text-title-sm text-on-background mb-3 flex items-center justify-between">
                                                        <span>{t('ads.end_date')} <span className="text-error">*</span></span>
                                                        {form.start_date && (
                                                            <span className="font-caption text-caption text-primary bg-primary/10 px-2 py-0.5 rounded-md">{t('ads.quick_option_available')}</span>
                                                        )}
                                                    </label>
                                                    <div className="relative mb-5">
                                                        <input
                                                            type="date"
                                                            value={form.end_date}
                                                            onChange={(e) => { setForm(p => ({ ...p, end_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }}
                                                            className="w-full border border-border-color bg-white rounded-xl px-5 py-4 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-14 text-left shadow-sm"
                                                            dir="ltr"
                                                            min={form.start_date || new Date().toISOString().split('T')[0]}
                                                        />
                                                        <span className={`material-symbols-outlined text-[26px] absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-error pointer-events-none`}>event_busy</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                                        <button type="button" onClick={() => addDays(7)}
                                                            className="group relative py-4 px-5 bg-gradient-to-br from-primary-container/40 to-primary/10 hover:from-primary hover:to-primary/80 text-primary hover:text-white text-[15px] font-extrabold rounded-2xl transition-all duration-200 border-2 border-primary/25 hover:border-primary shadow-md hover:shadow-primary/30 hover:shadow-lg hover:-translate-y-0.5 flex flex-col items-center gap-1">
                                                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">date_range</span>
                                                            {t('common.week')}
                                                            <span className="text-[11px] font-normal opacity-70">7 {t('common.days')}</span>
                                                        </button>
                                                        <button type="button" onClick={() => addDays(14)}
                                                            className="group relative py-4 px-5 bg-gradient-to-br from-primary-container/40 to-primary/10 hover:from-primary hover:to-primary/80 text-primary hover:text-white text-[15px] font-extrabold rounded-2xl transition-all duration-200 border-2 border-primary/25 hover:border-primary shadow-md hover:shadow-primary/30 hover:shadow-lg hover:-translate-y-0.5 flex flex-col items-center gap-1">
                                                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">view_week</span>
                                                            {t('common.two_weeks')}
                                                            <span className="text-[11px] font-normal opacity-70">14 {t('common.day')}</span>
                                                        </button>
                                                        <button type="button" onClick={() => addDays(30)}
                                                            className="group relative py-4 px-5 bg-gradient-to-br from-primary-container/40 to-primary/10 hover:from-primary hover:to-primary/80 text-primary hover:text-white text-[15px] font-extrabold rounded-2xl transition-all duration-200 border-2 border-primary/25 hover:border-primary shadow-md hover:shadow-primary/30 hover:shadow-lg hover:-translate-y-0.5 flex flex-col items-center gap-1">
                                                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">calendar_month</span>
                                                            {t('common.month')}
                                                            <span className="text-[11px] font-normal opacity-70">30 {t('common.day')}</span>
                                                        </button>
                                                        <button type="button" onClick={() => addDays(60)}
                                                            className="group relative py-4 px-5 bg-gradient-to-br from-primary-container/40 to-primary/10 hover:from-primary hover:to-primary/80 text-primary hover:text-white text-[15px] font-extrabold rounded-2xl transition-all duration-200 border-2 border-primary/25 hover:border-primary shadow-md hover:shadow-primary/30 hover:shadow-lg hover:-translate-y-0.5 flex flex-col items-center gap-1">
                                                            <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">event_note</span>
                                                            {t('common.two_months')}
                                                            <span className="text-[11px] font-normal opacity-70">60 {t('common.day')}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Target Timing (Replaces rigid shift packages) */}
                                            <div className="bg-surface-container-low border border-border-color rounded-2xl p-6 mb-10 text-center shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                                                <h4 className="font-title-sm text-title-sm text-on-background mb-2 flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                                    {t('ads.target_timing_daily')}
                                                </h4>
                                                <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                                                    {t('ads.target_timing_desc')}
                                                    <br />
                                                    <span className="text-primary text-[13px] font-bold mt-1 inline-block">{t('ads.peak_hours_note')}</span>
                                                </p>

                                                <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                                                    <button type="button"
                                                        onClick={() => { setForm(p => ({ ...p, target_start_time: '00:00', target_end_time: '23:59', daily_shift: 'all' })); if (calculatedCost) setCalculatedCost(null); }}
                                                        className={`px-5 py-3 rounded-xl border flex items-center gap-2 transition-all shadow-sm ${form.daily_shift === 'all' || (form.target_start_time === '00:00' && form.target_end_time === '23:59') ? 'bg-primary text-white border-primary ring-2 ring-primary/20' : 'bg-white text-on-surface-variant border-border-color hover:bg-primary-container/20 hover:text-primary hover:border-primary/40'}`}>
                                                        <span className="material-symbols-outlined text-[20px]">all_inclusive</span>
                                                        <span className="font-bold text-[14px]">{t('ads.all_day_24h')}</span>
                                                    </button>
                                                    <button type="button"
                                                        onClick={() => { setForm(p => ({ ...p, daily_shift: 'custom' })); if (calculatedCost) setCalculatedCost(null); }}
                                                        className={`px-5 py-3 rounded-xl border flex items-center gap-2 transition-all shadow-sm ${form.daily_shift !== 'all' && (form.target_start_time !== '00:00' || form.target_end_time !== '23:59') ? 'bg-primary text-white border-primary ring-2 ring-primary/20' : 'bg-white text-on-surface-variant border-border-color hover:bg-primary-container/20 hover:text-primary hover:border-primary/40'}`}>
                                                        <span className="material-symbols-outlined text-[20px]">tune</span>
                                                        <span className="font-bold text-[14px]">{t('ads.custom_times')}</span>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto pt-4 border-t border-border-color/50">
                                                    <div>
                                                        <label className={`block font-title-sm text-title-sm text-on-background mb-3 text-${dir === 'rtl' ? 'right' : 'left'}`}>{t('ads.start_time')} <span className="text-error">*</span></label>
                                                        <div className="relative">
                                                            <input
                                                                type="time"
                                                                value={form.target_start_time}
                                                                onChange={(e) => { setForm(p => ({ ...p, target_start_time: e.target.value, daily_shift: 'custom' })); if (calculatedCost) setCalculatedCost(null); }}
                                                                className="w-full border border-border-color bg-white rounded-xl px-4 py-3.5 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left shadow-sm"
                                                                style={{ paddingRight: dir === 'rtl' ? '48px' : '16px', paddingLeft: dir === 'ltr' ? '48px' : '16px' }}
                                                                dir="ltr"
                                                            />
                                                            <span className={`material-symbols-outlined text-[24px] absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-primary pointer-events-none`}>schedule</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className={`block font-title-sm text-title-sm text-on-background mb-3 text-${dir === 'rtl' ? 'right' : 'left'}`}>{t('ads.end_time')} <span className="text-error">*</span></label>
                                                        <div className="relative">
                                                            <input
                                                                type="time"
                                                                value={form.target_end_time}
                                                                onChange={(e) => { setForm(p => ({ ...p, target_end_time: e.target.value, daily_shift: 'custom' })); if (calculatedCost) setCalculatedCost(null); }}
                                                                className="w-full border border-border-color bg-white rounded-xl px-4 py-3.5 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left shadow-sm"
                                                                style={{ paddingRight: dir === 'rtl' ? '48px' : '16px', paddingLeft: dir === 'ltr' ? '48px' : '16px' }}
                                                                dir="ltr"
                                                            />
                                                            <span className={`material-symbols-outlined text-[24px] absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-error pointer-events-none`}>schedule</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </motion.div>
                                    )}

                                    {/* STEP 2: SCREEN TARGETING (Was Step 3) */}
                                    {currentStep === 2 && (
                                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                            {/* Header */}
                                            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                                                        <h3 className="font-title-lg text-title-lg text-on-background">{t('ads.spatial_targeting')}</h3>
                                                    </div>
                                                    <p className="font-body-md text-body-md text-on-surface-variant">{t('ads.spatial_targeting_desc')}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {selectedScreens.length > 0 && (
                                                        <span className="bg-primary text-white font-label-md text-label-md px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                                                            {selectedScreens.length} {t('ads.screens_selected')}
                                                        </span>
                                                    )}
                                                    <div className="bg-surface-container-low border border-border-color text-on-surface-variant font-label-md px-4 py-2 rounded-lg flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                                                        {filteredScreensForAd.length} / {screens.length}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ── Search + Geo Filters ── */}
                                            <div className="bg-surface-container-low border border-border-color rounded-2xl p-4 mb-4 flex flex-col gap-3">
                                                {/* Text search */}
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">search</span>
                                                    <input
                                                        type="text"
                                                        value={screenSearch}
                                                        onChange={e => setScreenSearch(e.target.value)}
                                                        placeholder={t('ads.search_screen_placeholder')}
                                                        className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
                                                    />
                                                    {screenSearch && (
                                                        <button type="button" onClick={() => setScreenSearch('')}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-outline hover:text-error transition-colors">
                                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Cascade dropdowns */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {/* المحافظة */}
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">map</span>
                                                        <select
                                                            value={filterGov}
                                                            onChange={e => handleFilterGovChange(e.target.value)}
                                                            className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors appearance-none cursor-pointer"
                                                        >
                                                            <option value="">{t('ads.all_governorates')}</option>
                                                            {govList.map(g => <option key={g.gov_id} value={g.gov_id}>{g.name}</option>)}
                                                        </select>
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">expand_more</span>
                                                    </div>

                                                    {/* المنطقة */}
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">location_city</span>
                                                        <select
                                                            value={filterRegion}
                                                            onChange={e => handleFilterRegionChange(e.target.value)}
                                                            disabled={!filterGov || geoFilterLoading}
                                                            className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="">{geoFilterLoading ? t('common.loading') : t('ads.all_regions')}</option>
                                                            {regionList.map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
                                                        </select>
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">expand_more</span>
                                                    </div>

                                                    {/* الشارع */}
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">fork_right</span>
                                                        <select
                                                            value={filterStreet}
                                                            onChange={e => setFilterStreet(e.target.value)}
                                                            disabled={!filterRegion || geoFilterLoading}
                                                            className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="">{geoFilterLoading ? t('common.loading') : t('ads.all_streets')}</option>
                                                            {streetList.map(s => <option key={s.street_id} value={s.street_id}>{s.name}</option>)}
                                                        </select>
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">expand_more</span>
                                                    </div>
                                                </div>

                                                {/* Clear filters */}
                                                {(screenSearch || filterGov || filterRegion || filterStreet) && (
                                                    <button type="button" onClick={clearGeoFilters}
                                                        className="self-start flex items-center gap-1.5 text-error font-label-md text-label-md hover:bg-error-container/20 px-3 py-1.5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                                                        {t('ads.clear_all_filters')}
                                                    </button>
                                                )}
                                            </div>

                                            {/* ── Screens Layout (Map + Cards) ── */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                                {/* Map View */}
                                                <div className="lg:col-span-2 h-[450px] lg:h-[500px] w-full bg-surface-container-lowest border border-border-color rounded-xl overflow-hidden shadow-sm relative z-0">
                                                    <ScreenMapView
                                                        screens={screens}
                                                        selectedGov={filterGov}
                                                        selectedRegion={filterRegion}
                                                        selectedStreet={filterStreet}
                                                        governorates={govList}
                                                        regions={regionList}
                                                        streets={streetList}
                                                    />
                                                </div>

                                                {/* Screen Cards Grid */}
                                                <div className="lg:col-span-1 h-[450px] bg-surface-container-lowest border border-border-color rounded-xl overflow-hidden p-4 shadow-sm flex flex-col">
                                                    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                                                        {screens.length === 0 ? (
                                                            <div className="text-center py-16">
                                                                <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">desktop_windows</span>
                                                                <p className="font-title-lg text-title-lg text-on-surface-variant mb-2">{t('ads.no_screens_available')}</p>
                                                                <p className="font-body-md text-body-md text-outline">{t('ads.please_add_screens')}</p>
                                                            </div>
                                                        ) : filteredScreensForAd.length === 0 ? (
                                                            <div className="text-center py-16">
                                                                <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">search_off</span>
                                                                <p className="font-title-md text-title-md text-on-surface-variant mb-1">{t('ads.no_matching_screens')}</p>
                                                                <p className="font-body-md text-body-md text-outline">{t('ads.try_adjusting_filters')}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-3 p-2">
                                                                {filteredScreensForAd.map(screen => {
                                                                    const isSelected = selectedScreens.includes(screen.screen_id);
                                                                    const currentStatus = screen.computed_status || screen.status;
                                                                    const statusColorClass = currentStatus === 'Online' ? 'bg-green-500' : currentStatus === 'Offline' ? 'bg-red-500' : currentStatus === 'Maintenance' ? 'bg-yellow-500' : 'bg-gray-400';
                                                                    const statusLabel = currentStatus === 'Online' ? t('common.online') : currentStatus === 'Offline' ? t('common.offline') : currentStatus === 'Maintenance' ? t('common.maintenance') : currentStatus;

                                                                    return (
                                                                        <div key={screen.screen_id}
                                                                            onClick={() => toggleScreen(screen.screen_id)}
                                                                            className={`flex flex-col p-3 rounded-xl border transition-all cursor-pointer relative aspect-square
                                                                    ${isSelected ? 'border-primary-container bg-primary-container/5 shadow-sm ring-1 ring-primary-container' : 'border-border-color bg-white hover:border-primary-container/40 hover:shadow-sm'}`}>

                                                                            {/* Status Dot & Info Icon */}
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <span className="flex items-center gap-1.5 bg-surface-container-low px-1.5 py-0.5 rounded-full">
                                                                                    <span className={`w-2 h-2 rounded-full ${statusColorClass}`}></span>
                                                                                    <span className="text-[10px] text-on-surface-variant font-bold truncate">{statusLabel}</span>
                                                                                </span>
                                                                                <span title={t('ads.targeted_screen')}>
                                                                                    {isSelected && <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>campaign</span>}
                                                                                </span>
                                                                            </div>

                                                                            {/* Main Info */}
                                                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                                <h5 className={`font-bold text-[13px] leading-tight mb-1.5 truncate ${isSelected ? 'text-primary' : 'text-on-background'}`} title={screen.screen_name}>
                                                                                    {screen.screen_name}
                                                                                </h5>
                                                                                <p className="font-caption text-[10px] text-outline flex items-center gap-1 truncate mb-0.5">
                                                                                    <span className="material-symbols-outlined text-[12px]">map</span>
                                                                                    {screen.street?.region?.name || t('ads.region_not_specified')}
                                                                                </p>
                                                                                <p className="font-caption text-[10px] text-on-surface-variant flex items-center gap-1 truncate">
                                                                                    <span className="material-symbols-outlined text-[12px]">fork_right</span>
                                                                                    {screen.street?.name || t('ads.location_not_specified')}
                                                                                </p>
                                                                            </div>

                                                                            {/* Footer (Price & Selection state) */}
                                                                            <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-border-color/50">
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <span className="text-[11px] font-bold text-on-surface-variant">
                                                                                        {screen.price ? `$${screen.price}/${t('common.day')}` : t('ads.offer')}
                                                                                    </span>
                                                                                    {/* Button to check peak times explicitly */}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => { e.stopPropagation(); setAvailabilityScreen(screen); }}
                                                                                        className={`text-[9px] flex items-center gap-1 font-bold px-1.5 py-0.5 rounded transition-colors
                                                                                            ${isSelected ? 'bg-primary border border-primary/20 text-white' : 'bg-surface-container text-primary hover:bg-primary/10'}`}
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-[10px]">analytics</span>
                                                                                        {t('ads.peak_hours')}
                                                                                    </button>
                                                                                </div>
                                                                                {isSelected ? (
                                                                                    <span className="flex items-center gap-0.5 font-bold text-[10px] text-primary">
                                                                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="font-bold text-[10px] text-outline flex items-center gap-1">
                                                                                        <span className="material-symbols-outlined text-[14px]">add_circle</span>
                                                                                        {t('common.select')}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* STEP 4: MEDIA UPLOAD EXPERIENCE */}
                                    {currentStep === 4 && (
                                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                            <div className="mb-8">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="material-symbols-outlined text-primary text-xl">image</span>
                                                    <h3 className="font-title-lg text-title-lg text-on-background">{t('ads.ad_production')}</h3>
                                                </div>
                                                <p className="font-body-md text-body-md text-on-surface-variant">{t('ads.ad_production_desc')}</p>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="font-label-md text-label-md font-bold text-on-background mb-3 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[18px] text-primary">upload</span> {t('ads.ad_material')} <span className="text-error">*</span>
                                                        </label>
                                                        <div className="relative group">
                                                            <input type="file" accept="video/*,image/*" onChange={handleFileChange}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                            <div className={`p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center transition-all bg-surface-container-lowest 
                                                        ${form.file ? 'border-primary ring-1 ring-primary bg-primary-container/10' : 'border-outline group-hover:border-primary group-hover:bg-surface-container-low'}`}>
                                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                                                            ${form.file ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant group-hover:bg-primary-container group-hover:text-primary'}`}>
                                                                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                                                                </div>
                                                                <p className="font-title-md text-title-md text-on-background mb-1 font-bold">
                                                                    {form.file ? form.file.name : t('ads.click_or_drag_file')}
                                                                </p>
                                                                <p className="font-caption text-caption text-outline">MP4, MOV, JPEG, PNG ({t('ads.max_size_50mb')})</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Receipt Upload moved to Step 5 (Pricing & Submission) */}
                                                </div>

                                                {/* Media Preview Box */}
                                                <div className="rounded-2xl bg-surface-container-low overflow-hidden flex items-center justify-center relative min-h-[300px] border border-border-color shadow-sm group">
                                                    {previewUrl ? (
                                                        <>
                                                            {form.file?.type.startsWith('video/') ? (
                                                                <video src={previewUrl} controls className="w-full h-full object-contain absolute inset-0 z-0 bg-black" autoPlay muted loop />
                                                            ) : (
                                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain absolute inset-0 z-0 bg-surface-container-lowest" />
                                                            )}
                                                            <div className={`absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} z-10 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-color shadow-sm`}>
                                                                <span className="font-caption text-caption font-bold text-on-background flex items-center gap-1.5">
                                                                    <span className="material-symbols-outlined text-[14px] text-primary">visibility</span> {t('ads.preview_display')}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center p-6 z-10 bg-surface-container-lowest w-full h-full flex flex-col items-center justify-center rounded-2xl">
                                                            <span className="material-symbols-outlined text-6xl text-surface-container mb-4">image</span>
                                                            <p className="font-label-md text-label-md font-bold text-outline">{t('ads.live_preview_window')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* STEP 5: COST REVIEW & SUBMISSION */}
                                    {currentStep === 5 && (
                                        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                            className="bg-surface-container border border-border-color rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
                                            <div className="mb-8 flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
                                                <div>
                                                    <h2 className="font-headline-sm text-headline-sm text-on-background font-bold">{t('ads.pricing_and_approval')}</h2>
                                                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">{t('ads.pricing_desc')}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                                <div className="space-y-6 z-10">

                                                    {!calculatedCost && (() => {
                                                        const sd = form.start_date ? new Date(form.start_date) : null;
                                                        const ed = form.end_date ? new Date(form.end_date) : null;
                                                        const days = sd && ed && !isNaN(sd) && !isNaN(ed) ? Math.max(1, Math.ceil((ed - sd) / (1000 * 60 * 60 * 24)) + 1) : 0;

                                                        let basePriceSum = 0;
                                                        const selectedScreensData = screens.filter(s => selectedScreens.includes(s.screen_id));

                                                        selectedScreensData.forEach(s => {
                                                            const base = Number(s.base_price) || 10;
                                                            const sizeInch = Number(s.screen_size_inch) || 55;
                                                            let sizeMultiplier = 1.0;
                                                            if (sizeInch >= 98) sizeMultiplier = 1.5;
                                                            else if (sizeInch >= 86) sizeMultiplier = 1.35;
                                                            else if (sizeInch >= 75) sizeMultiplier = 1.2;
                                                            else if (sizeInch >= 65) sizeMultiplier = 1.1;
                                                            basePriceSum += (base * sizeMultiplier);
                                                        });

                                                        const estimatedBaseCost = (basePriceSum * days).toFixed(2);

                                                        return (
                                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary-container/20 border border-primary/20 p-5 rounded-2xl shadow-sm">
                                                                <h4 className="font-label-md text-label-md font-bold text-primary mb-3 flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-[20px]">analytics</span>
                                                                    {t('ads.initial_indicators')}
                                                                </h4>

                                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                                    <div className="bg-surface rounded-xl p-3 text-center border border-primary/10">
                                                                        <span className="block font-caption text-caption text-outline mb-1">{t('common.duration')}</span>
                                                                        <span className="font-headline-sm text-headline-sm text-primary font-bold">{days > 0 ? `${days} ${t('common.day')}` : '-'}</span>
                                                                    </div>
                                                                    <div className="bg-surface rounded-xl p-3 text-center border border-primary/10">
                                                                        <span className="block font-caption text-caption text-outline mb-1">{t('common.screens')}</span>
                                                                        <span className="font-headline-sm text-headline-sm text-primary font-bold">{selectedScreens.length > 0 ? selectedScreens.length : '-'}</span>
                                                                    </div>
                                                                    <div className="bg-surface rounded-xl p-3 text-center border border-primary/10">
                                                                        <span className="block font-caption text-caption text-outline mb-1">{t('ads.expected_cost')}</span>
                                                                        <span className="font-headline-sm text-headline-sm text-primary font-bold" dir="ltr">{days > 0 && selectedScreens.length > 0 ? `$${estimatedBaseCost}` : '-'}</span>
                                                                    </div>
                                                                </div>

                                                                <p className="font-caption text-caption text-on-surface-variant leading-relaxed mb-3">
                                                                    {t('ads.estimated_cost_note')}
                                                                </p>

                                                                <div className="bg-surface border border-primary/10 rounded-xl p-3 flex items-start gap-3">
                                                                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">info</span>
                                                                    <p className="font-caption text-caption text-outline">
                                                                        {t('ads.calculate_cost_note')}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })()}

                                                    <button type="button" onClick={handleCalculateCost} disabled={costLoading}
                                                        className="w-full bg-surface hover:bg-surface-container-low border border-border-color text-on-background font-label-lg py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group outline-none">
                                                        <span className="material-symbols-outlined text-primary">calculate</span>
                                                        {costLoading ? t('ads.simulating') : t('ads.calculate_total_cost')}
                                                    </button>

                                                    <AnimatePresence>
                                                        {calculatedCost !== null && costDetails && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                                                                <div className="bg-surface p-6 rounded-2xl border border-border-color shadow-sm">
                                                                    <div className="flex justify-between items-center mb-6 border-b border-border-color pb-4">
                                                                        <span className="font-label-md text-label-md text-outline">{t('ads.final_deducted_total')}:</span>
                                                                        <span className="font-display-sm text-display-sm text-primary font-bold tracking-tighter" dir="ltr">${(calculatedCost ? Number(calculatedCost).toFixed(2) : "0.00")}</span>
                                                                    </div>

                                                                    {costDetails.discount_multiplier < 1.0 && (
                                                                        <div className="mb-6 bg-green-50/50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
                                                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                                                <span className="material-symbols-outlined text-green-600">celebration</span>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="font-label-md text-label-md font-bold text-green-800 mb-1">{t('ads.long_duration_reward')}</h4>
                                                                                <p className="font-caption text-caption text-green-700">{t('ads.discount_applied')} <strong>{costDetails.discount_label}</strong> {t('ads.for_long_duration')}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                                                        <div className="bg-surface-container-lowest rounded-xl p-3 text-center border border-border-color">
                                                                            <span className="block font-caption text-caption text-outline mb-1">{t('ads.fees')}</span>
                                                                            <span className="font-headline-sm text-headline-sm text-on-background font-bold" dir="ltr">${costDetails.base_price}</span>
                                                                        </div>
                                                                        <div className="bg-surface-container-lowest rounded-xl p-3 text-center border border-border-color">
                                                                            <span className="block font-caption text-caption text-outline mb-1">{t('common.duration')}</span>
                                                                            <span className="font-headline-sm text-headline-sm text-on-background font-bold">{costDetails.days} {t('common.day')}</span>
                                                                        </div>
                                                                        <div className="bg-surface-container-lowest rounded-xl p-3 text-center border border-border-color">
                                                                            <span className="block font-caption text-caption text-outline mb-1">{t('ads.spread')}</span>
                                                                            <span className="font-headline-sm text-headline-sm text-on-background font-bold">{costDetails.screens?.length} {t('ads.location')}</span>
                                                                        </div>
                                                                    </div>

                                                                    {costDetails.screens && costDetails.screens.length > 0 && (
                                                                        <div className="max-h-40 overflow-y-auto custom-scrollbar border border-border-color rounded-xl bg-surface-container-lowest p-2 space-y-1">
                                                                            {costDetails.screens.map(s => (
                                                                                <div key={s.screen_id} className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-surface hover:bg-surface-container transition-colors">
                                                                                    <span className="font-label-md text-label-md text-on-background font-bold truncate" title={s.screen_name}>{s.screen_name}</span>
                                                                                    <div className="flex items-center gap-3 shrink-0">
                                                                                        <span className="font-caption text-caption text-outline bg-surface-container px-2 py-1 rounded-md">{s.multiplier}x {t('ads.multiplier')}</span>
                                                                                        <span className="font-label-md text-label-md text-primary bg-primary-container/20 px-2 py-1 rounded-md" dir="ltr">${s.screen_total}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}


                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <div className="z-10 bg-surface-container-low p-6 rounded-2xl border border-border-color flex flex-col justify-between h-full">
                                                    {/* Upload Progress Display */}
                                                    {loading && uploadProgress > 0 && (
                                                        <div className="bg-surface border border-secondary/30 rounded-xl p-5 shadow-sm mb-6">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="font-label-md text-label-md text-secondary flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-[18px] animate-bounce">cloud_upload</span> {t('ads.encoding_and_uploading')}
                                                                </span>
                                                                <span className="font-label-md text-label-md text-on-background bg-secondary/10 px-2 py-1 rounded-lg font-bold">{uploadProgress}%</span>
                                                            </div>
                                                            <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden border border-border-color shadow-inner">
                                                                <div
                                                                    className="bg-secondary h-full rounded-full transition-all duration-300 ease-out"
                                                                    style={{ width: `${uploadProgress}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="text-center mb-6 flex-1 flex flex-col items-center justify-center min-h-[140px]">
                                                        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border-color relative shadow-sm">
                                                            <span className="material-symbols-outlined text-3xl text-outline">verified_user</span>
                                                            {calculatedCost !== null && (
                                                                <div className="absolute -bottom-1 -right-1 bg-secondary w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center shadow-sm">
                                                                    <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>check</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="font-body-md text-body-md text-outline">{t('ads.must_calculate_cost_first')}</p>
                                                    </div>

                                                    <button type="submit" disabled={loading || calculatedCost === null}
                                                        className="w-full bg-primary hover:bg-on-primary-fixed-variant text-white font-label-lg py-4 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group outline-none">
                                                        {loading ? (
                                                            <>
                                                                <span className="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
                                                                <span>{t('ads.processing')} {uploadProgress > 0 ? `(${uploadProgress}%)` : ''}</span>
                                                            </>
                                                        ) : (
                                                            <>{t('ads.submit_ad_for_review')} <span className={`material-symbols-outlined text-[20px] ${dir === 'rtl' ? 'rotate-180' : ''}`} style={{ fontVariationSettings: '"FILL" 1' }}>send</span></>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Navigation Buttons Footer */}
                                {/* Footer Navigation - التالي left, السابقة right (Stitch layout) */}
                                <div className="flex items-center justify-between pt-4 border-t border-outline-variant mt-6">
                                    {/* التالي - LEFT side (primary action) */}
                                    {currentStep < 5 ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="bg-on-background text-white font-label-md text-label-md px-8 py-3 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-colors shadow-sm"
                                        >
                                            {t('common.next')} <span className={`material-symbols-outlined text-[18px] ${dir === 'rtl' ? '' : 'rotate-180'}`}>arrow_back</span>
                                        </button>
                                    ) : (
                                        <div className="px-8 py-3 w-1 opacity-0"></div>
                                    )}

                                    {/* الخطوة السابقة - RIGHT side */}
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={currentStep === 1 || loading}
                                        className="bg-surface-container-lowest border border-outline-variant text-on-background font-label-md text-label-md px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('common.previous')} <span className={`material-symbols-outlined text-[18px] ${dir === 'rtl' ? '' : 'rotate-180'}`}>arrow_forward</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* CAMPAIGN STEPPER - Right side (glued to sidebar) */}
                    <aside className="w-full lg:w-[340px] xl:w-[360px] flex-shrink-0 order-1 lg:order-1">
                        <div className="bg-surface/70 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-lg sticky top-[62px] p-7 relative overflow-hidden">
                            {/* Decorative glows */}
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-secondary/6 rounded-full blur-2xl pointer-events-none"></div>

                            <h3 className="font-title-xl text-[18px] font-bold text-on-surface border-b-2 border-border-color pb-5 mb-7 flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-container to-primary/20 flex items-center justify-center border border-primary/20 text-primary shadow-sm">
                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>flag</span>
                                </div>
                                <span>{t('ads.campaign_path')}</span>
                            </h3>

                            <div className="relative z-10">
                                {/* Static connector line */}
                                <div className="absolute right-[19px] top-5 bottom-5 w-[2px] bg-outline-variant/40 rounded-full -z-10"></div>

                                {/* Animated progress fill */}
                                <div className="absolute right-[19px] top-5 w-[2px] -z-10 overflow-hidden rounded-full" style={{ height: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}>
                                    <motion.div
                                        className="w-full h-full bg-gradient-to-b from-primary via-primary/80 to-secondary"
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        style={{ transformOrigin: 'top' }}
                                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    />
                                </div>

                                <ul className="space-y-6">
                                    {steps.map((step) => {
                                        const current = isStepCurrent(step.id);
                                        const done = isStepDone(step.id);
                                        return (
                                            <li
                                                key={step.id}
                                                onClick={() => { if (step.id < currentStep || done) setCurrentStep(step.id); }}
                                                className={`flex items-center gap-5 cursor-pointer transition-all duration-300 group rounded-2xl px-3 py-3
                                                    ${current ? 'bg-surface shadow-md border border-border-color scale-[1.02]' : 'hover:bg-surface-container/60'}
                                                    ${!current && !done ? 'opacity-55 hover:opacity-100' : ''}`}
                                            >
                                                <div className="flex-shrink-0 relative">
                                                    {done ? (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform text-white">
                                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>check</span>
                                                        </div>
                                                    ) : current ? (
                                                        <>
                                                            <div className="absolute inset-0 bg-primary/25 rounded-full animate-ping"></div>
                                                            <div className="w-10 h-10 rounded-full border-[2.5px] border-primary bg-surface flex items-center justify-center shadow-lg relative z-10 text-primary">
                                                                <span className="text-[16px] font-extrabold">{step.id}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full border-2 border-outline-variant bg-surface-container-lowest flex items-center justify-center text-outline group-hover:border-primary group-hover:text-primary transition-colors">
                                                            <span className="text-[15px] font-bold">{step.id}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-${dir === 'rtl' ? 'right' : 'left'} flex-1 min-w-0`}>
                                                    <h4 className={`text-[15px] font-bold truncate transition-colors leading-tight ${current ? 'text-primary' : done ? 'text-on-surface' : 'text-outline group-hover:text-on-surface'
                                                        }`}>
                                                        {step.title}
                                                    </h4>
                                                    <p className="text-[13px] text-on-surface-variant mt-0.5 truncate leading-snug">{step.subtitle}</p>
                                                </div>
                                                {current && (
                                                    <span className={`material-symbols-outlined text-primary text-[18px] shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`} style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Summary stats at bottom */}
                                <div className="mt-8 pt-6 border-t border-border-color grid grid-cols-2 gap-3">
                                    <div className="bg-surface-container-low rounded-xl p-3 text-center border border-border-color">
                                        <span className="material-symbols-outlined text-primary text-[18px] mb-1 block">desktop_windows</span>
                                        <span className="text-[18px] font-extrabold text-on-background block">{selectedScreens.length}</span>
                                        <span className="text-[11px] text-on-surface-variant">{t('ads.screens_selected')}</span>
                                    </div>
                                    <div className="bg-surface-container-low rounded-xl p-3 text-center border border-border-color">
                                        <span className="material-symbols-outlined text-primary text-[18px] mb-1 block">payments</span>
                                        <span className="text-[15px] font-extrabold text-on-background block" dir="ltr">{calculatedCost ? `$${(calculatedCost ? Number(calculatedCost).toFixed(2) : "0.00")}` : '—'}</span>
                                        <span className="text-[11px] text-on-surface-variant">{t('ads.cost')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                <ScreenAvailabilityModal
                    isOpen={!!availabilityScreen}
                    onClose={() => setAvailabilityScreen(null)}
                    screen={availabilityScreen}
                    selectedDate={form.start_date}
                />
            </main>
        </div>
    );
};

export default CreateAdPage;

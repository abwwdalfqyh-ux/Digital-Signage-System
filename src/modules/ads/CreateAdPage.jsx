import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, Monitor, CheckSquare, Info } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import ScreenAvailabilityModal from './components/ScreenAvailabilityModal';
import usePermission from '../../hooks/usePermission';

const CreateAdPage = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);
    const [loading, setLoading] = useState(false);
    const [screens, setScreens] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedScreens, setSelectedScreens] = useState([]);
    const [availabilityScreen, setAvailabilityScreen] = useState(null);

    const [form, setForm] = useState({
        title: '', category_id: '', duration: '', start_date: '', end_date: '',
        target_start_time: '', target_end_time: '',
        interval_minutes: '', total_cost: '', package_name: '', file: null, receipt: null,
        advertiser_id: ''
    });
    const [calculatedCost, setCalculatedCost] = useState(null);
    const [costDetails, setCostDetails] = useState(null);
    const [costLoading, setCostLoading] = useState(false);
    const [frequencyPackages, setFrequencyPackages] = useState([]);
    const [advertisers, setAdvertisers] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { can } = usePermission();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [screensRes, categoriesRes, freqRes, advRes] = await Promise.all([
                    axiosClient.get(ENDPOINTS.SCREENS.ALL),
                    axiosClient.get(ENDPOINTS.LOOKUPS.CATEGORIES),
                    axiosClient.get(ENDPOINTS.FREQUENCY_PACKAGES.ALL),
                    can('manage_all') ? axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('Advertiser')) : Promise.resolve({ data: [] })
                ]);
                setScreens(screensRes.data || []);
                setCategories(categoriesRes.data || []);
                setFrequencyPackages(freqRes.data?.data || freqRes.data || []);
                setAdvertisers(advRes.data || []);
            } catch (e) { console.error(e); }
        };
        fetchData();
        
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setForm(p => ({ ...p, file }));
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const toggleScreen = (screenId) => {
        setSelectedScreens(prev =>
            prev.includes(screenId) ? prev.filter(id => id !== screenId) : [...prev, screenId]
        );
    };

    const handleCalculateCost = async () => {
        if (!form.category_id || selectedScreens.length === 0 || !form.start_date || !form.end_date || !form.interval_minutes) {
            addToast('يرجى تعبئة الحقول الأساسية (التصنيف، الشاشات، التواريخ، باقة التكرار) لحساب التكلفة', 'warning');
            return;
        }
        setCostLoading(true);
        try {
            const payload = {
                category_id: form.category_id,
                screen_ids: selectedScreens,
                start_date: form.start_date,
                end_date: form.end_date,
                interval_minutes: form.interval_minutes
            };
            if (form.target_start_time) payload.target_start_time = form.target_start_time;
            if (form.target_end_time) payload.target_end_time = form.target_end_time;

            const res = await axiosClient.post(ENDPOINTS.ADS.CALCULATE_COST, payload);
            const data = res.data.data;
            setCalculatedCost(data.total_cost);
            setCostDetails(data);
            setForm(p => ({ ...p, total_cost: data.total_cost }));
            addToast('تم حساب التكلفة بنجاح', 'success');
        } catch (e) {
            addToast(e.response?.data?.message || 'فشل حساب التكلفة', 'error');
        } finally {
            setCostLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedScreens.length === 0) {
            addToast('يرجى اختيار شاشة واحدة على الأقل', 'warning');
            return;
        }
        if (calculatedCost === null) {
            addToast('يرجى حساب التكلفة أولاً قبل رفع الإعلان', 'warning');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        Object.entries(form).forEach(([key, val]) => { 
            if (val !== '' && val !== null) formData.append(key, val); 
        });
        selectedScreens.forEach(id => formData.append('screen_ids[]', id));

        try {
            await axiosClient.post(ENDPOINTS.ADS.CREATE, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            addToast('تم رفع الإعلان بنجاح!', 'success');
            navigate('/dashboard/ads');
        } catch (e) {
            addToast(e.response?.data?.message || 'فشل رفع الإعلان', 'error');
        } finally { setLoading(false); }
    };

    const inputClass = "w-full bg-white border-[1.5px] border-[var(--color-dark-turquoise)] rounded-xl py-3 px-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-turquoise)]/30 text-right transition-all";
    const labelClass = "text-xs font-bold text-[var(--color-dark-turquoise)] mb-1.5 block px-1";

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12" dir="rtl">
            <div>
                <button onClick={() => navigate('/dashboard/ads')} className="text-[var(--color-dark-turquoise)] hover:opacity-80 text-sm font-bold flex items-center gap-1 mb-4 transition-opacity">
                    <ArrowRight className="w-4 h-4 rotate-180" /> العودة للإعلانات
                </button>
                <PageHeader
                    title={
                        <span className="flex items-center gap-3">
                            <Upload className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> رفع إعلان جديد
                        </span>
                    }
                    description="أنشئ حملتك الإعلانية واختر الشاشات المستهدفة"
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-sm font-black text-[var(--color-dark-turquoise)] mb-4 border-b pb-2">معلومات الإعلان</h3>
                    {can('manage_all') && (
                        <div>
                            <label className={labelClass}>اختر المعلن (للمديرين فقط)</label>
                            <select value={form.advertiser_id} onChange={(e) => setForm(p => ({ ...p, advertiser_id: e.target.value }))} className={inputClass}>
                                <option value="">نفسك (الافتراضي)</option>
                                {advertisers.map(adv => <option key={adv.user_id} value={adv.user_id}>{adv.full_name} ({adv.email})</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className={labelClass}>عنوان الإعلان *</label>
                        <input type="text" required value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: إعلان بيبسي رمضان" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>التصنيف</label>
                            <select value={form.category_id} onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))} className={inputClass}>
                                <option value="">اختر التصنيف</option>
                                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name} - ${c.price}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>المدة (ثانية) *</label>
                            <input type="number" required min="1" value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="15" className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>تاريخ البدء *</label>
                            <input type="date" required value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>تاريخ الانتهاء *</label>
                            <input type="date" required value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>وقت البدء المستهدف (اختياري)</label>
                            <input type="time" value={form.target_start_time} onChange={(e) => setForm(p => ({ ...p, target_start_time: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>وقت الانتهاء المستهدف (اختياري)</label>
                            <input type="time" value={form.target_end_time} onChange={(e) => setForm(p => ({ ...p, target_end_time: e.target.value }))} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>باقة التكرار *</label>
                            <select required value={form.interval_minutes} onChange={(e) => setForm(p => ({ ...p, interval_minutes: e.target.value }))} className={inputClass}>
                                <option value="">اختر باقة التكرار</option>
                                {frequencyPackages.map(pkg => <option key={pkg.id || pkg.display_interval} value={pkg.display_interval}>{pkg.name} (كل {pkg.display_interval} دقيقة)</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>اسم الباقة المقترحة</label>
                            <input type="text" value={form.package_name} onChange={(e) => setForm(p => ({ ...p, package_name: e.target.value }))} placeholder="اختياري" className={inputClass} />
                        </div>
                        <div className="flex flex-col justify-end">
                            <button type="button" onClick={handleCalculateCost} disabled={costLoading} className="bg-gray-50 hover:bg-gray-100 border-2 border-[var(--color-dark-turquoise)] text-[var(--color-dark-turquoise)] font-bold py-[10.5px] px-4 rounded-xl transition-all h-[46px]">
                                {costLoading ? 'جاري الحساب...' : 'حساب التكلفة'}
                            </button>
                        </div>
                    </div>
                    {calculatedCost !== null && costDetails && (
                        <div className="bg-[var(--color-dark-turquoise)]/5 p-5 rounded-2xl border border-[var(--color-dark-turquoise)]/30 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span className="font-bold text-[var(--color-dark-turquoise)]">التكلفة الإجمالية المقدرة:</span>
                                <span className="font-black text-2xl text-[var(--color-gold)]">${calculatedCost.toFixed(2)}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div className="bg-white p-2 rounded-lg text-center border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] text-gray-500 font-bold">السعر الأساسي</span>
                                    <span className="font-bold text-gray-800">${costDetails.base_price}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg text-center border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] text-gray-500 font-bold">الأيام</span>
                                    <span className="font-bold text-gray-800">{costDetails.days} يوم</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg text-center border border-gray-100 shadow-sm">
                                    <span className="block text-[10px] text-gray-500 font-bold">الشاشات</span>
                                    <span className="font-bold text-gray-800">{costDetails.screens?.length} شاشة</span>
                                </div>
                            </div>
                            
                            {costDetails.screens && costDetails.screens.length > 0 && (
                                <div className="pt-2 border-t border-[var(--color-dark-turquoise)]/20">
                                    <span className="block text-xs font-bold text-gray-600 mb-2">تفصيل التكلفة لكل شاشة:</span>
                                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                        {costDetails.screens.map(s => (
                                            <div key={s.screen_id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                                <span className="font-bold text-gray-700 truncate min-w-0" title={s.screen_name}>{s.screen_name} <span className="text-[10px] text-gray-500">(مضاعف: {s.multiplier}x)</span></span>
                                                <span className="font-bold text-gray-900 shrink-0">${s.screen_total}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* File Upload */}
                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-sm font-black text-[var(--color-dark-turquoise)] mb-4 border-b pb-2">ملف الإعلان</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>ملف الإعلان (فيديو أو صورة) *</label>
                                <input type="file" required accept="video/*,image/*" onChange={handleFileChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-[1.5px] file:border-[var(--color-dark-turquoise)] file:text-sm file:font-bold file:bg-[var(--color-dark-turquoise)]/10 file:text-[var(--color-dark-turquoise)] hover:file:bg-[var(--color-dark-turquoise)]/20 cursor-pointer" />
                                <p className="text-[10px] text-gray-500 mt-1">يدعم: MP4, MOV, AVI, JPEG, PNG (حد أقصى 50MB)</p>
                            </div>
                            
                            <div>
                                <label className={labelClass}>إيصال الدفع (اختياري)</label>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => setForm(p => ({ ...p, receipt: e.target.files[0] }))}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-[1.5px] file:border-[#2E7D32] file:text-sm file:font-bold file:bg-[#2E7D32]/10 file:text-[#2E7D32] hover:file:bg-[#2E7D32]/20 cursor-pointer" />
                            </div>
                        </div>

                        {previewUrl && (
                            <div className="border-[1.5px] border-dashed border-[var(--color-dark-turquoise)]/50 rounded-xl flex items-center justify-center p-2 bg-gray-50 h-[178px]">
                                {form.file?.type.startsWith('video/') ? (
                                    <video src={previewUrl} controls className="max-h-full max-w-full rounded-lg" />
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Screen Selection */}
                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-[var(--color-dark-turquoise)] mb-4 flex items-center gap-2 border-b pb-2">
                        <Monitor className="w-5 h-5 text-[var(--color-gold)]" />
                        اختيار الشاشات ({selectedScreens.length} مختارة)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pl-2">
                        {screens.map((screen) => (
                            <div 
                                key={screen.screen_id} 
                                onClick={() => toggleScreen(screen.screen_id)}
                                className={`flex items-center justify-between p-3 rounded-xl border-[1.5px] text-right transition-all cursor-pointer ${selectedScreens.includes(screen.screen_id)
                                        ? 'border-[var(--color-dark-turquoise)] bg-[var(--color-dark-turquoise)]/10'
                                        : 'border-gray-200 bg-gray-50 hover:border-[var(--color-dark-turquoise)]/50'
                                    }`}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <CheckSquare className={`w-5 h-5 shrink-0 ${selectedScreens.includes(screen.screen_id) ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-400'}`} />
                                    <div className="min-w-0 flex-1 text-right">
                                        <p className={`text-sm font-bold truncate ${selectedScreens.includes(screen.screen_id) ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-700'}`}>{screen.screen_name}</p>
                                        <p className="text-[10px] text-gray-500">{screen.street?.name || 'موقع غير محدد'}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setAvailabilityScreen(screen); }}
                                    className="p-1.5 ml-1 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-[var(--color-dark-turquoise)] hover:border-[var(--color-dark-turquoise)] transition-all z-10 shrink-0 shadow-sm"
                                    title="فحص سعات الشاشة"
                                >
                                    <Info className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                    className="w-full bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-black py-4 rounded-full shadow-sm transition-all disabled:opacity-50 text-lg">
                    {loading ? 'جاري الرفع...' : 'رفع الإعلان'}
                </button>
            </form>

            <ScreenAvailabilityModal 
                isOpen={!!availabilityScreen} 
                onClose={() => setAvailabilityScreen(null)} 
                screen={availabilityScreen} 
                selectedDate={form.start_date}
            />
        </div>
    );
};

export default CreateAdPage;

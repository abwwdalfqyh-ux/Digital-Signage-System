import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, Monitor, CheckSquare } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';

const CreateAdPage = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);
    const [loading, setLoading] = useState(false);
    const [screens, setScreens] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedScreens, setSelectedScreens] = useState([]);

    const [form, setForm] = useState({
        title: '', category_id: '', duration: '', start_date: '', end_date: '',
        daily_frequency: 1, interval_minutes: 60, total_cost: '', package_name: '', file: null, receipt: null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [screensRes, categoriesRes] = await Promise.all([
                    axiosClient.get('/screens'),
                    axiosClient.get('/lookups/categories'),
                ]);
                setScreens(screensRes.data || []);
                setCategories(categoriesRes.data || []);
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    const toggleScreen = (screenId) => {
        setSelectedScreens(prev =>
            prev.includes(screenId) ? prev.filter(id => id !== screenId) : [...prev, screenId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedScreens.length === 0) {
            addToast('يرجى اختيار شاشة واحدة على الأقل', 'warning');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        Object.entries(form).forEach(([key, val]) => { if (val) formData.append(key, val); });
        selectedScreens.forEach(id => formData.append('screen_ids[]', id));

        try {
            await axiosClient.post('/ads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
                    <div>
                        <label className={labelClass}>عنوان الإعلان *</label>
                        <input type="text" required value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder="مثال: إعلان بيبسي رمضان" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>التصنيف</label>
                            <select value={form.category_id} onChange={(e) => setForm(p => ({...p, category_id: e.target.value}))} className={inputClass}>
                                <option value="">اختر التصنيف</option>
                                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name} - ${c.price}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>المدة (ثانية) *</label>
                            <input type="number" required min="1" value={form.duration} onChange={(e) => setForm(p => ({...p, duration: e.target.value}))} placeholder="15" className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>تاريخ البدء *</label>
                            <input type="date" required value={form.start_date} onChange={(e) => setForm(p => ({...p, start_date: e.target.value}))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>تاريخ الانتهاء *</label>
                            <input type="date" required value={form.end_date} onChange={(e) => setForm(p => ({...p, end_date: e.target.value}))} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>التكرار اليومي *</label>
                            <input type="number" required min="1" value={form.daily_frequency} onChange={(e) => setForm(p => ({...p, daily_frequency: e.target.value}))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>الفاصل الزمني (بالدقائق) *</label>
                            <input type="number" required min="1" value={form.interval_minutes} onChange={(e) => setForm(p => ({...p, interval_minutes: e.target.value}))} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>التكلفة الإجمالية *</label>
                            <input type="number" required step="0.01" value={form.total_cost} onChange={(e) => setForm(p => ({...p, total_cost: e.target.value}))} placeholder="0.00" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>اسم الباقة</label>
                            <input type="text" value={form.package_name} onChange={(e) => setForm(p => ({...p, package_name: e.target.value}))} placeholder="اختياري" className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* File Upload */}
                <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-2xl p-6 space-y-4 shadow-sm">
                    <h3 className="text-sm font-black text-[var(--color-dark-turquoise)] mb-4 border-b pb-2">ملف الإعلان</h3>
                    <div>
                        <label className={labelClass}>ملف الإعلان (فيديو أو صورة) *</label>
                        <input type="file" required accept="video/*,image/*" onChange={(e) => setForm(p => ({...p, file: e.target.files[0]}))}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-[1.5px] file:border-[var(--color-dark-turquoise)] file:text-sm file:font-bold file:bg-[var(--color-dark-turquoise)]/10 file:text-[var(--color-dark-turquoise)] hover:file:bg-[var(--color-dark-turquoise)]/20 cursor-pointer" />
                        <p className="text-[10px] text-gray-500 mt-1">يدعم: MP4, MOV, AVI, JPEG, PNG (حد أقصى 50MB)</p>
                    </div>
                    <div>
                        <label className={labelClass}>إيصال الدفع (اختياري)</label>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setForm(p => ({...p, receipt: e.target.files[0]}))}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-[1.5px] file:border-[#2E7D32] file:text-sm file:font-bold file:bg-[#2E7D32]/10 file:text-[#2E7D32] hover:file:bg-[#2E7D32]/20 cursor-pointer" />
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
                            <button key={screen.screen_id} type="button" onClick={() => toggleScreen(screen.screen_id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-[1.5px] text-right transition-all ${
                                    selectedScreens.includes(screen.screen_id)
                                        ? 'border-[var(--color-dark-turquoise)] bg-[var(--color-dark-turquoise)]/10'
                                        : 'border-gray-200 bg-gray-50 hover:border-[var(--color-dark-turquoise)]/50'
                                }`}>
                                <CheckSquare className={`w-5 h-5 shrink-0 ${selectedScreens.includes(screen.screen_id) ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-400'}`} />
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm font-bold truncate ${selectedScreens.includes(screen.screen_id) ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-700'}`}>{screen.screen_name}</p>
                                    <p className="text-[10px] text-gray-500">{screen.street?.name || 'موقع غير محدد'}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading}
                    className="w-full bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-black py-4 rounded-full shadow-sm transition-all disabled:opacity-50 text-lg">
                    {loading ? 'جاري الرفع...' : 'رفع الإعلان'}
                </button>
            </form>
        </div>
    );
};

export default CreateAdPage;

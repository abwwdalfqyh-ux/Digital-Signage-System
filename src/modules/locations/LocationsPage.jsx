import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, Globe, Map, Navigation, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';

/**
 * Locations Management Page
 * Hierarchical CRUD: Governorates → Regions → Streets
 */
const LocationsPage = () => {
    const [govs, setGovs] = useState([]);
    const [regions, setRegions] = useState([]);
    const [streets, setStreets] = useState([]);
    const [selectedGov, setSelectedGov] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ type: '', open: false, data: null });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: null });
    const [formName, setFormName] = useState('');
    const addToast = useToastStore(s => s.addToast);

    useEffect(() => { fetchGovs(); }, []);
    useEffect(() => { if (selectedGov) fetchRegions(selectedGov); else setRegions([]); }, [selectedGov]);
    useEffect(() => { if (selectedRegion) fetchStreets(selectedRegion); else setStreets([]); }, [selectedRegion]);

    const fetchGovs = async () => { try { const r = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES); setGovs(r.data); } catch(e){} finally { setLoading(false); } };
    const fetchRegions = async (govId) => { try { const r = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId)); setRegions(r.data); } catch(e){} };
    const fetchStreets = async (regionId) => { try { const r = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId)); setStreets(r.data); } catch(e){} };

    const handleSave = async () => {
        if (!formName.trim()) {
            addToast('يرجى إدخال اسم صحيح', 'warning');
            return;
        }
        const { type, data } = modal;
        try {
            if (type === 'add-gov') { await axiosClient.post(ENDPOINTS.LOOKUPS.GOVERNORATES, { name: formName }); fetchGovs(); }
            else if (type === 'edit-gov') { await axiosClient.put(ENDPOINTS.LOOKUPS.GOVERNORATE(data.gov_id), { name: formName }); fetchGovs(); }
            else if (type === 'add-region') { await axiosClient.post(ENDPOINTS.LOOKUPS.REGIONS, { name: formName, gov_id: selectedGov }); fetchRegions(selectedGov); }
            else if (type === 'edit-region') { await axiosClient.put(ENDPOINTS.LOOKUPS.REGION(data.region_id), { name: formName, gov_id: selectedGov }); fetchRegions(selectedGov); }
            else if (type === 'add-street') { await axiosClient.post(ENDPOINTS.LOOKUPS.STREETS, { name: formName, region_id: selectedRegion }); fetchStreets(selectedRegion); }
            else if (type === 'edit-street') { await axiosClient.put(ENDPOINTS.LOOKUPS.STREET(data.street_id), { name: formName, region_id: selectedRegion }); fetchStreets(selectedRegion); }
            addToast('تمت العملية بنجاح', 'success');
            setModal({ type: '', open: false, data: null }); setFormName('');
        } catch (e) { addToast('فشلت العملية، تأكد من صحة البيانات', 'error'); }
    };

    const handleDelete = async () => {
        const { type, id } = deleteDialog;
        try {
            if (type === 'gov') { await axiosClient.delete(ENDPOINTS.LOOKUPS.GOVERNORATE(id)); fetchGovs(); setSelectedGov(null); }
            else if (type === 'region') { await axiosClient.delete(ENDPOINTS.LOOKUPS.REGION(id)); fetchRegions(selectedGov); setSelectedRegion(null); }
            else if (type === 'street') { await axiosClient.delete(ENDPOINTS.LOOKUPS.STREET(id)); fetchStreets(selectedRegion); }
            addToast('تم الحذف بنجاح', 'success');
        } catch (e) { addToast('فشل الحذف، قد يكون العنصر مرتبطاً ببيانات أخرى', 'error'); }
        setDeleteDialog({ open: false, type: '', id: null });
    };

    const ListItem = ({ name, isSelected, onClick, onEdit, onDelete }) => (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                isSelected 
                ? 'border-blue-600 bg-blue-600/5 shadow-md shadow-blue-600/10' 
                : 'border-gray-200 bg-white hover:border-blue-400/50 hover:bg-slate-50'
            }`}
        >
            <span className={`text-sm font-black transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>{name}</span>
            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                    className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors shadow-sm"
                    title="تعديل"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                    className="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors shadow-sm"
                    title="حذف"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );

    const SummaryCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass }) => (
        <div className={`bg-white rounded-3xl p-6 border ${borderClass} shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex items-center justify-between overflow-hidden relative group`}>
            <div className={`absolute top-0 left-0 w-16 h-16 rounded-br-[40px] opacity-20 ${bgClass}`}></div>
            <div className="relative z-10">
                <p className="text-[11px] uppercase font-black text-gray-500 mb-1 tracking-wider">{title}</p>
                {loading ? (
                    <div className="h-8 w-16 bg-gray-100 animate-pulse rounded my-1"></div>
                ) : (
                    <h4 className="text-3xl font-black text-gray-900">{value}</h4>
                )}
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm relative z-10 transition-transform group-hover:scale-110 ${bgClass} ${colorClass}`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
    );

    const inputClass = "w-full bg-slate-50 border-2 border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-blue-600 transition-colors text-right";

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans" dir="rtl">
            <div className="sticky top-0 bg-slate-50/90 z-20 pt-6 pb-4 border-b border-gray-200/50 mb-8 backdrop-blur-xl">
                <PageHeader 
                    title={
                        <span className="flex items-center gap-3">
                            <span className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-2.5 rounded-xl shadow-lg ring-4 ring-blue-600/10">
                                <Globe className="w-6 h-6 shrink-0" />
                            </span>
                            <span className="text-3xl font-black tracking-tight text-gray-900">هيكلة المواقع الجغرافية</span>
                        </span>
                    }
                    description="إدارة التقسيم الإداري للشاشات، بدءاً من المحافظات وحتى نقاط العرض الدقيقة."
                />
            </div>

            {/* DASHBOARD SUMMARY CARDS */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title="إجمالي المحافظات" value={govs.length} icon={Globe} colorClass="text-blue-600" borderClass="border-blue-100" bgClass="bg-blue-50" />
                <SummaryCard title="المناطق المُسجلة" value={regions.length} icon={Map} colorClass="text-purple-600" borderClass="border-purple-100" bgClass="bg-purple-50" />
                <SummaryCard title="نقاط الشوارع" value={streets.length} icon={Navigation} colorClass="text-emerald-600" borderClass="border-emerald-100" bgClass="bg-emerald-50" />
            </motion.div>

            {/* HIERARCHICAL LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* 1. Governorates */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center font-black">1</span> المحافظات
                            </h3>
                            <p className="text-[10px] uppercase font-black text-gray-500 mt-1">التقسيم الإداري الأكبر</p>
                        </div>
                        <button 
                            onClick={() => { setModal({ type: 'add-gov', open: true, data: null }); setFormName(''); }}
                            className="bg-blue-600/10 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="إضافة محافظة"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>)
                        ) : govs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                                <Globe className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-bold">لا توجد أية محافظات.</p>
                                <p className="text-xs">اضغط على زر الإضافة للبدء.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {govs.map(g => (
                                    <ListItem key={g.gov_id} name={g.name} isSelected={selectedGov === g.gov_id}
                                        onClick={() => { setSelectedGov(g.gov_id); setSelectedRegion(null); }}
                                        onEdit={() => { setModal({ type: 'edit-gov', open: true, data: g }); setFormName(g.name); }}
                                        onDelete={() => setDeleteDialog({ open: true, type: 'gov', id: g.gov_id })} />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>

                {/* 2. Regions */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] flex flex-col h-[600px] relative">
                    {!selectedGov && <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] rounded-3xl z-10 flex flex-col items-center justify-center text-gray-500 border border-gray-200"><Map className="w-12 h-12 mb-3 opacity-30" /><p className="text-sm font-black">يرجى تحديد محافظة أولاً</p></div>}
                    
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center font-black">2</span> المناطق
                            </h3>
                            <p className="text-[10px] uppercase font-black text-gray-500 mt-1">المحور الحضري الداخلي</p>
                        </div>
                        <button 
                            disabled={!selectedGov}
                            onClick={() => { setModal({ type: 'add-region', open: true, data: null }); setFormName(''); }}
                            className="bg-blue-600/10 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="إضافة منطقة"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-0">
                        {regions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                                <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-bold">لا توجد أية مناطق هنا.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {regions.map(r => (
                                    <ListItem key={r.region_id} name={r.name} isSelected={selectedRegion === r.region_id}
                                        onClick={() => setSelectedRegion(r.region_id)}
                                        onEdit={() => { setModal({ type: 'edit-region', open: true, data: r }); setFormName(r.name); }}
                                        onDelete={() => setDeleteDialog({ open: true, type: 'region', id: r.region_id })} />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>

                {/* 3. Streets */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] flex flex-col h-[600px] relative">
                    {!selectedRegion && <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] rounded-3xl z-10 flex flex-col items-center justify-center text-gray-500 border border-gray-200"><Navigation className="w-12 h-12 mb-3 opacity-30" /><p className="text-sm font-black">يرجى تحديد منطقة أولاً</p></div>}
                    
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <span className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center font-black">3</span> الشوارع / المواقع
                            </h3>
                            <p className="text-[10px] uppercase font-black text-gray-500 mt-1">تحديد الشاشات الجغرافية</p>
                        </div>
                        <button 
                            disabled={!selectedRegion}
                            onClick={() => { setModal({ type: 'add-street', open: true, data: null }); setFormName(''); }}
                            className="bg-blue-600/10 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="إضافة شارع"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-0">
                        {streets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                                <MapPin className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-bold">لم تُسجل شوارع حتى الآن.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {streets.map(s => (
                                    <ListItem key={s.street_id} name={s.name} isSelected={false} onClick={() => {}}
                                        onEdit={() => { setModal({ type: 'edit-street', open: true, data: s }); setFormName(s.name); }}
                                        onDelete={() => setDeleteDialog({ open: true, type: 'street', id: s.street_id })} />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Add/Edit Modal Wrapper */}
            <Modal isOpen={modal.open} onClose={() => setModal({ type: '', open: false, data: null })} title={(modal.type || '').includes('add') ? 'إنشاء نطاق جغرافي' : 'تعديل السجل الجغرافي'} size="sm">
                {modal.open && (
                    <div className="space-y-6 overflow-hidden relative pb-2" dir="rtl">
                        <div className="pt-2">
                            {(() => {
                                const type = modal.type || '';
                                const isGov = type.includes('gov');
                                const isRegion = type.includes('region');
                                const Icon = isGov ? Globe : isRegion ? ShieldCheck : Navigation;
                                const colorClass = isGov ? 'text-blue-600' : isRegion ? 'text-purple-600' : 'text-emerald-600';
                                const bgClass = isGov ? 'bg-blue-100' : isRegion ? 'bg-purple-100' : 'bg-emerald-100';
                                const ringClass = isGov ? 'ring-blue-100' : isRegion ? 'ring-purple-100' : 'ring-emerald-100';
                                const labelText = isGov ? 'محافظة' : isRegion ? 'منطقة' : 'شارع / موقع محدد';
                                const actionText = type.includes('add') ? 'إنشاء' : 'تحديث بيانات';
                                
                                return (
                                    <div className="flex items-center gap-4 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-gray-200">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass} ring-4 ${ringClass} shadow-sm`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-gray-900">{actionText} {labelText}</h4>
                                            <p className="text-[11px] font-bold text-gray-500 mt-1 tracking-wide">الرجاء إدخال اسم النطاق الرسمي لضمان تطابق البيانات.</p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        
                        <div className="bg-white">
                            <label className="text-[12px] font-black text-gray-700 uppercase tracking-wider block px-1 mb-2">الاسم المعتمد <span className="text-red-500">*</span></label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-500 group-focus-within:text-blue-600 transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    value={formName} 
                                    onChange={e => setFormName(e.target.value)} 
                                    placeholder="اكتب اسم النطاق هنا..." 
                                    className="w-full bg-slate-50 border-2 border-gray-200 rounded-xl py-3.5 pr-11 pl-4 text-[15px] font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-right shadow-sm group-hover:border-gray-300" 
                                    autoFocus 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSave();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-200">
                            <button 
                                type="button" 
                                onClick={() => setModal({ type: '', open: false, data: null })} 
                                className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-black text-sm hover:bg-slate-50 hover:border-gray-300 transition-all active:scale-95"
                            >
                                التراجع وإلغاء
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {modal.type?.includes('add') ? <Plus className="w-5 h-5" /> : <Edit2 className="w-4 h-4 mr-1" />}
                                <span className="mr-1">{(modal.type || '').includes('add') ? 'اعتماد النطاق' : 'حفظ التحديثات'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Secure Delete Confirm Dialog */}
            <ConfirmDialog 
                isOpen={deleteDialog.open} 
                onClose={() => setDeleteDialog({ open: false, type: '', id: null })}
                onConfirm={handleDelete} 
                title="تأكيد الحذف الأمني" 
                message="أنت على وشك حذف هذا النطاق الجغرافي. هذا الإجراء قد يتسبب في تعطيل أو إخفاء الشاشات المرتبطة به. هل ترغب بالاستمرار؟" 
                confirmText="حذف نهائي" 
            />
        </div>
    );
};

export default LocationsPage;

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, Globe } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import useToastStore from '../../store/useToastStore';

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

    const fetchGovs = async () => { try { const r = await axiosClient.get('/lookups/governorates'); setGovs(r.data); } catch(e){} finally { setLoading(false); } };
    const fetchRegions = async (govId) => { try { const r = await axiosClient.get(`/lookups/governorates/${govId}/regions`); setRegions(r.data); } catch(e){} };
    const fetchStreets = async (regionId) => { try { const r = await axiosClient.get(`/lookups/regions/${regionId}/streets`); setStreets(r.data); } catch(e){} };

    const handleSave = async () => {
        const { type, data } = modal;
        try {
            if (type === 'add-gov') { await axiosClient.post('/lookups/governorates', { name: formName }); fetchGovs(); }
            else if (type === 'edit-gov') { await axiosClient.put(`/lookups/governorates/${data.gov_id}`, { name: formName }); fetchGovs(); }
            else if (type === 'add-region') { await axiosClient.post('/lookups/regions', { name: formName, gov_id: selectedGov }); fetchRegions(selectedGov); }
            else if (type === 'edit-region') { await axiosClient.put(`/lookups/regions/${data.region_id}`, { name: formName, gov_id: selectedGov }); fetchRegions(selectedGov); }
            else if (type === 'add-street') { await axiosClient.post('/lookups/streets', { name: formName, region_id: selectedRegion }); fetchStreets(selectedRegion); }
            else if (type === 'edit-street') { await axiosClient.put(`/lookups/streets/${data.street_id}`, { name: formName, region_id: selectedRegion }); fetchStreets(selectedRegion); }
            addToast('تمت العملية بنجاح', 'success');
            setModal({ type: '', open: false, data: null }); setFormName('');
        } catch (e) { addToast('فشلت العملية', 'error'); }
    };

    const handleDelete = async () => {
        const { type, id } = deleteDialog;
        try {
            if (type === 'gov') { await axiosClient.delete(`/lookups/governorates/${id}`); fetchGovs(); setSelectedGov(null); }
            else if (type === 'region') { await axiosClient.delete(`/lookups/regions/${id}`); fetchRegions(selectedGov); setSelectedRegion(null); }
            else if (type === 'street') { await axiosClient.delete(`/lookups/streets/${id}`); fetchStreets(selectedRegion); }
            addToast('تم الحذف بنجاح', 'success');
        } catch (e) { addToast('فشل الحذف', 'error'); }
        setDeleteDialog({ open: false, type: '', id: null });
    };

    const ListItem = ({ name, isSelected, onClick, onEdit, onDelete }) => (
        <div onClick={onClick}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all group ${
                isSelected ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}>
            <span className={`text-sm font-bold ${isSelected ? 'text-indigo-400' : 'text-gray-400'}`}>{name}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-gray-600 hover:text-white p-1 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-600 hover:text-red-400 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>
    );

    const inputClass = "w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-right";

    return (
        <div className="space-y-6" dir="rtl">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3"><MapPin className="w-7 h-7 text-indigo-400" /> إدارة المواقع</h1>
                <p className="text-sm text-gray-500 font-bold mt-1">إدارة المحافظات والمناطق والشوارع</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Governorates */}
                <div className="bg-[#121215]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-white flex items-center gap-2"><Globe className="w-4 h-4 text-purple-400" /> المحافظات</h3>
                        <button onClick={() => { setModal({ type: 'add-gov', open: true, data: null }); setFormName(''); }}
                            className="bg-indigo-500/10 text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {govs.map(g => (
                            <ListItem key={g.gov_id} name={g.name} isSelected={selectedGov === g.gov_id}
                                onClick={() => { setSelectedGov(g.gov_id); setSelectedRegion(null); }}
                                onEdit={() => { setModal({ type: 'edit-gov', open: true, data: g }); setFormName(g.name); }}
                                onDelete={() => setDeleteDialog({ open: true, type: 'gov', id: g.gov_id })} />
                        ))}
                        {govs.length === 0 && <p className="text-center text-gray-600 text-xs py-8">لا توجد محافظات</p>}
                    </div>
                </div>

                {/* Regions */}
                <div className="bg-[#121215]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-white">المناطق</h3>
                        {selectedGov && <button onClick={() => { setModal({ type: 'add-region', open: true, data: null }); setFormName(''); }}
                            className="bg-indigo-500/10 text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-4 h-4" /></button>}
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {!selectedGov ? <p className="text-center text-gray-600 text-xs py-8">اختر محافظة أولاً</p> :
                            regions.length === 0 ? <p className="text-center text-gray-600 text-xs py-8">لا توجد مناطق</p> :
                            regions.map(r => (
                                <ListItem key={r.region_id} name={r.name} isSelected={selectedRegion === r.region_id}
                                    onClick={() => setSelectedRegion(r.region_id)}
                                    onEdit={() => { setModal({ type: 'edit-region', open: true, data: r }); setFormName(r.name); }}
                                    onDelete={() => setDeleteDialog({ open: true, type: 'region', id: r.region_id })} />
                            ))}
                    </div>
                </div>

                {/* Streets */}
                <div className="bg-[#121215]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-white">الشوارع</h3>
                        {selectedRegion && <button onClick={() => { setModal({ type: 'add-street', open: true, data: null }); setFormName(''); }}
                            className="bg-indigo-500/10 text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/20 transition-all"><Plus className="w-4 h-4" /></button>}
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {!selectedRegion ? <p className="text-center text-gray-600 text-xs py-8">اختر منطقة أولاً</p> :
                            streets.length === 0 ? <p className="text-center text-gray-600 text-xs py-8">لا توجد شوارع</p> :
                            streets.map(s => (
                                <ListItem key={s.street_id} name={s.name} isSelected={false} onClick={() => {}}
                                    onEdit={() => { setModal({ type: 'edit-street', open: true, data: s }); setFormName(s.name); }}
                                    onDelete={() => setDeleteDialog({ open: true, type: 'street', id: s.street_id })} />
                            ))}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal.open} onClose={() => setModal({ type: '', open: false, data: null })} title={modal.type?.includes('add') ? 'إضافة' : 'تعديل'} size="sm">
                <div className="space-y-4" dir="rtl">
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="الاسم..." className={inputClass} autoFocus />
                    <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all">حفظ</button>
                </div>
            </Modal>

            <ConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: '', id: null })}
                onConfirm={handleDelete} title="تأكيد الحذف" message="هل أنت متأكد؟ سيتم حذف كل البيانات التابعة." confirmText="حذف" />
        </div>
    );
};

export default LocationsPage;

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, Globe, Map, Navigation, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import useTranslation from '../../i18n/useTranslation';

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
    const { t, dir } = useTranslation();

    useEffect(() => { fetchGovs(); }, []);
    useEffect(() => { if (selectedGov) fetchRegions(selectedGov); else setRegions([]); }, [selectedGov]);
    useEffect(() => { if (selectedRegion) fetchStreets(selectedRegion); else setStreets([]); }, [selectedRegion]);

    const fetchGovs = async () => { try { const r = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES); setGovs(Array.isArray(r.data) ? r.data : Object.values(r.data || {})); } catch(e){} finally { setLoading(false); } };
    const fetchRegions = async (govId) => { try { const r = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId)); setRegions(Array.isArray(r.data) ? r.data : Object.values(r.data || {})); } catch(e){} };
    const fetchStreets = async (regionId) => { try { const r = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId)); setStreets(Array.isArray(r.data) ? r.data : Object.values(r.data || {})); } catch(e){} };

    const handleSave = async () => {
        if (!formName.trim()) {
            addToast(t('locations.invalid_name_toast'), 'warning');
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
            addToast(t('common.success'), 'success');
            setModal({ type: '', open: false, data: null }); setFormName('');
        } catch (e) { addToast(t('locations.operation_failed'), 'error'); }
    };

    const handleDelete = async () => {
        const { type, id } = deleteDialog;
        try {
            if (type === 'gov') { await axiosClient.delete(ENDPOINTS.LOOKUPS.GOVERNORATE(id)); fetchGovs(); setSelectedGov(null); }
            else if (type === 'region') { await axiosClient.delete(ENDPOINTS.LOOKUPS.REGION(id)); fetchRegions(selectedGov); setSelectedRegion(null); }
            else if (type === 'street') { await axiosClient.delete(ENDPOINTS.LOOKUPS.STREET(id)); fetchStreets(selectedRegion); }
            addToast(t('common.deleted_success'), 'success');
        } catch (e) { addToast(t('locations.delete_failed'), 'error'); }
        setDeleteDialog({ open: false, type: '', id: null });
    };    const ListItem = ({ name, isSelected, onClick, onEdit, onDelete }) => (
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
            <span className={`text-base sm:text-lg font-bold transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>{name}</span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                    className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors shadow-sm"
                    title={t('common.edit')}
                >
                    <Edit2 className="w-5 h-5" />
                </button>
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                    className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors shadow-sm"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );

    const SummaryCard = ({ title, value }) => (
        <div className="bg-white rounded-2xl py-3 px-4 border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center gap-1.5">
            <p className="text-base sm:text-lg font-bold text-gray-700">{title}</p>
            {loading ? (
                <div className="h-5 w-14 bg-gray-100 animate-pulse rounded"></div>
            ) : (
                <h4 className="text-lg sm:text-xl font-bold text-gray-900">{value}</h4>
            )}
        </div>
    );

    const inputClass = "w-full bg-slate-50 border-2 border-gray-200 rounded-xl py-3 px-4 text-base font-bold text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-blue-600 transition-colors text-right";

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans" dir={dir}>
            <div className="sticky top-0 bg-slate-50/90 z-20 pt-6 pb-4 border-b border-gray-200/50 mb-8 backdrop-blur-xl">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('locations.page_title')}</h2>
            </div>

            {/* DASHBOARD SUMMARY CARDS */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard title={t('locations.total_govs')} value={govs.length} />
                <SummaryCard title={t('locations.total_regions')} value={regions.length} />
                <SummaryCard title={t('locations.total_streets')} value={streets.length} />
            </motion.div>

            {/* HIERARCHICAL LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* 1. Governorates */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="bg-blue-100 text-blue-600 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg">1</span> 
                            {t('locations.govs')}
                        </h3>
                        <button 
                            onClick={() => { setModal({ type: 'add-gov', open: true, data: null }); setFormName(''); }}
                            className="bg-blue-600/10 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title={t('locations.add_gov')}
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
                                <p className="text-base font-bold">{t('locations.no_govs')}</p>
                                <p className="text-xs">{t('locations.click_add_start')}</p>
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
                    {!selectedGov && <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] rounded-3xl z-10 flex flex-col items-center justify-center text-gray-500 border border-gray-200"><Map className="w-12 h-12 mb-3 opacity-30" /><p className="text-base font-bold">{t('locations.select_gov_first')}</p></div>}
                    
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="bg-purple-100 text-purple-600 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg">2</span> 
                            {t('locations.regions')}
                        </h3>
                        <button 
                            disabled={!selectedGov}
                            onClick={() => { setModal({ type: 'add-region', open: true, data: null }); setFormName(''); }}
                            className="bg-blue-600/10 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('locations.add_region')}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-0">
                        {regions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                                <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-base font-bold">{t('locations.no_regions')}</p>
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
                    {!selectedRegion && <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[2px] rounded-3xl z-10 flex flex-col items-center justify-center text-gray-500 border border-gray-200"><Navigation className="w-12 h-12 mb-3 opacity-30" /><p className="text-base font-bold">{t('locations.select_region_first')}</p></div>}
                    
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="bg-emerald-100 text-emerald-600 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg">3</span> 
                            {t('locations.streets_locations')}
                        </h3>
                        <button 
                            disabled={!selectedRegion}
                            onClick={() => { setModal({ type: 'add-street', open: true, data: null }); setFormName(''); }}
                            className="bg-blue-600/10 text-blue-600 p-2.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('locations.add_street')}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-0">
                        {streets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
                                <MapPin className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-bold">{t('locations.no_streets')}</p>
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
            <Modal isOpen={modal.open} onClose={() => setModal({ type: '', open: false, data: null })} title={(modal.type || '').includes('add') ? t('locations.modal_add_title') : t('locations.modal_edit_title')} size="sm">
                {modal.open && (
                    <div className="space-y-6 overflow-hidden relative pb-2" dir={dir}>
                        <div className="pt-2">
                            {(() => {
                                const type = modal.type || '';
                                const isGov = type.includes('gov');
                                const isRegion = type.includes('region');
                                const labelText = isGov ? t('locations.gov') : isRegion ? t('locations.region') : t('locations.street');
                                const actionText = type.includes('add') ? t('locations.create') : t('locations.update_data');
                                
                                return (
                                    <div className="mb-6 bg-slate-50/50 p-4 rounded-2xl border border-gray-200">
                                        <h4 className="text-xl sm:text-2xl font-bold text-gray-900">{actionText} {labelText}</h4>
                                    </div>
                                );
                            })()}
                        </div>
                        
                        <div className="bg-white">
                            <label className="text-sm sm:text-base font-bold text-gray-700 block px-1 mb-2">{t('locations.approved_name')}</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-500 group-focus-within:text-blue-600 transition-colors">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input 
                                    type="text" 
                                    value={formName} 
                                    onChange={e => setFormName(e.target.value)} 
                                    placeholder={t('locations.name_placeholder')} 
                                    className="w-full bg-slate-50 border-2 border-gray-200 rounded-xl py-3.5 pr-11 pl-4 text-base sm:text-lg font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-right shadow-sm group-hover:border-gray-300" 
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
                                className="px-6 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-base hover:bg-slate-50 hover:border-gray-300 transition-all active:scale-95"
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-base"
                            >
                                {modal.type?.includes('add') ? <Plus className="w-5 h-5" /> : <Edit2 className="w-4 h-4 mr-1" />}
                                <span className="mr-1">{(modal.type || '').includes('add') ? t('locations.approve_domain') : t('locations.save_updates')}</span>
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
                title={t('locations.confirm_delete_title')}
                message={t('locations.confirm_delete_desc')}
                confirmText={t('locations.delete_final')}
            />
        </div>
    );
};

export default LocationsPage;

import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';
import { useTranslation } from 'react-i18next'; // We use custom hook or i18next depending on the project.
// Wait, in this project useTranslation is a custom hook.
import useTranslationCustom from '../../i18n/useTranslation';

const DefaultContentPage = () => {
    const { t, dir } = useTranslationCustom();
    const addToast = useToastStore(state => state.addToast);
    
    const [contents, setContents] = useState([]);
    const [screens, setScreens] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        duration: 15,
        screen_id: '',
        is_active: false,
        file: null
    });

    useEffect(() => {
        fetchContents();
        fetchScreens();
    }, []);

    const fetchContents = async () => {
        try {
            const res = await axiosClient.get('/default-contents');
            setContents(res.data.data);
        } catch (error) {
            console.error('Error fetching default contents', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchScreens = async () => {
        try {
            const res = await axiosClient.get('/screens');
            setScreens(res.data.data);
        } catch (error) {
            console.error('Error fetching screens', error);
        }
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, file: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const data = new FormData();
        data.append('title', formData.title);
        data.append('duration', formData.duration);
        data.append('is_active', formData.is_active);
        if (formData.screen_id) {
            data.append('screen_id', formData.screen_id);
        }
        if (formData.file) {
            data.append('file', formData.file);
        }

        try {
            await axiosClient.post('/default-contents', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast(t('defaultContent.success_add'), 'success');
            setIsModalOpen(false);
            setFormData({ title: '', duration: 15, screen_id: '', is_active: false, file: null });
            fetchContents();
        } catch (error) {
            console.error('Upload error', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleActive = async (id) => {
        try {
            await axiosClient.post(`/default-contents/${id}/activate`);
            addToast(t('defaultContent.success_activate'), 'success');
            fetchContents();
        } catch (error) {
            console.error('Activation error', error);
        }
    };

    const deleteContent = async (id) => {
        if (!window.confirm(t('defaultContent.confirm_delete'))) return;
        try {
            await axiosClient.delete(`/default-contents/${id}`);
            addToast(t('defaultContent.success_delete'), 'success');
            fetchContents();
        } catch (error) {
            console.error('Deletion error', error);
        }
    };

    return (
        <div className="p-6" dir={dir}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('defaultContent.title')}</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition"
                >
                    + {t('defaultContent.add_new')}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">{t('defaultContent.loading')}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contents.map(content => (
                        <div key={content.content_id} className={`bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-2 ${content.is_active ? 'border-green-500' : 'border-transparent'}`}>
                            {content.file_type === 'video' ? (
                                <video src={content.file_path} className="w-full h-48 object-cover rounded-lg mb-4" controls muted />
                            ) : (
                                <img src={content.file_path} className="w-full h-48 object-cover rounded-lg mb-4" alt="default content" />
                            )}
                            
                            <h3 className="text-lg font-bold mb-2">{content.title}</h3>
                            <p className="text-sm text-gray-500 mb-1">{t('defaultContent.duration')}: {content.duration} {t('defaultContent.seconds')}</p>
                            <p className="text-sm text-gray-500 mb-4">
                                {t('defaultContent.target')}: {content.screen ? content.screen.screen_name : t('defaultContent.general_target')}
                            </p>
                            
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button 
                                    onClick={() => toggleActive(content.content_id)}
                                    disabled={content.is_active}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold ${content.is_active ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                >
                                    {content.is_active ? t('defaultContent.active') : t('defaultContent.activate')}
                                </button>
                                
                                <button 
                                    onClick={() => deleteContent(content.content_id)}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                                >
                                    {t('defaultContent.delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {contents.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            {t('defaultContent.no_content')}
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">{t('defaultContent.add_title')}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('defaultContent.content_title')}</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.title} 
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('defaultContent.content_duration')}</label>
                                    <input 
                                        type="number" 
                                        min="1"
                                        required
                                        value={formData.duration} 
                                        onChange={e => setFormData({...formData, duration: e.target.value})}
                                        className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('defaultContent.target_screen')}</label>
                                    <select 
                                        value={formData.screen_id}
                                        onChange={e => setFormData({...formData, screen_id: e.target.value})}
                                        className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    >
                                        <option value="">{t('defaultContent.general_target')}</option>
                                        {screens.map(s => (
                                            <option key={s.screen_id} value={s.screen_id}>{s.screen_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('defaultContent.file')}</label>
                                    <input 
                                        type="file" 
                                        required
                                        accept="video/*,image/*"
                                        onChange={handleFileChange}
                                        className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.is_active}
                                        onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                        className="w-5 h-5 rounded border-gray-300"
                                    />
                                    <span className="text-sm font-medium">{t('defaultContent.activate_now')}</span>
                                </label>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                                    >
                                        {t('defaultContent.cancel')}
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50"
                                    >
                                        {isSubmitting ? t('defaultContent.uploading') : t('defaultContent.save_content')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefaultContentPage;

import React, { useRef } from 'react';
import { X, Printer, Download, MapPin, Calendar, Clock, Monitor, CheckCircle, CreditCard, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslation from '../../../i18n/useTranslation';

const AdInvoiceModal = ({ open, onClose, ad }) => {
    const printRef = useRef(null);
    const { t, dir } = useTranslation();

    if (!open || !ad) return null;

    const handlePrint = () => {
        const printContent = printRef.current;
        const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
        
        windowPrint.document.write(`
            <html>
                <head>
                    <title>${t('ads.invoice_title_window')} - ${ad.title}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
                        body { 
                            font-family: 'IBM Plex Sans Arabic', sans-serif; 
                            direction: ${dir}; 
                            padding: 40px; 
                            color: #1f2937;
                            background: white;
                        }
                        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
                        .logo { font-size: 24px; font-weight: bold; color: #004ac6; }
                        .invoice-title { font-size: 28px; color: #1f2937; margin: 0; }
                        .meta-info { display: flex; justify-content: space-between; margin-bottom: 40px; }
                        .meta-box { background: #f9fafb; padding: 15px; border-radius: 8px; width: 45%; }
                        .meta-box h4 { margin: 0 0 10px 0; color: #6b7280; font-size: 14px; }
                        .meta-box p { margin: 0; font-weight: 600; font-size: 16px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #f3f4f6; padding: 12px; text-align: right; color: #4b5563; font-size: 14px; }
                        td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
                        .total-section { display: flex; justify-content: flex-end; }
                        .total-box { width: 300px; background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe; }
                        .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                        .total-row.final { font-size: 20px; font-weight: bold; color: #004ac6; border-top: 2px solid #bfdbfe; padding-top: 10px; margin-bottom: 0; }
                        .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                        @media print {
                            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="logo">SabaControl</div>
                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${t('ads.smart_screens_system')}</p>
                        </div>
                        <div style="text-align: ${dir === 'rtl' ? 'left' : 'right'};">
                            <h1 class="invoice-title">${t('ads.ad_invoice')}</h1>
                            <p style="margin: 5px 0 0 0; color: #6b7280;">#INV-AD-${ad.ad_id.toString().padStart(5, '0')}</p>
                        </div>
                    </div>

                    <div class="meta-info">
                        <div class="meta-box">
                            <h4>${t('ads.advertiser_info')}</h4>
                            <p>${ad.advertiser?.name || t('common.unavailable')}</p>
                            <p style="font-weight: normal; color: #4b5563; font-size: 14px; margin-top: 5px;">${ad.advertiser?.email || ''}</p>
                            <p style="font-weight: normal; color: #4b5563; font-size: 14px; margin-top: 5px;">${ad.advertiser?.phone || ''}</p>
                        </div>
                        <div class="meta-box">
                            <h4>${t('ads.invoice_details')}</h4>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #6b7280; font-weight: normal;">${t('ads.issue_date')}:</span>
                                <span>${new Date(ad.created_at || ad.uploaded_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: #6b7280; font-weight: normal;">${t('ads.payment_status')}:</span>
                                <span style="color: #059669;">${t('ads.paid_completed')}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280; font-weight: normal;">${t('ads.broadcast_package')}:</span>
                                <span>${ad.package_name || t('ads.free_customization')}</span>
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>${t('ads.ad_campaign_details')}</th>
                                <th>${t('ads.start_date')}</th>
                                <th>${t('ads.end_date')}</th>
                                <th>${t('ads.screens_count')}</th>
                                <th>${t('ads.media_length')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong style="display: block; margin-bottom: 4px;">${ad.title}</strong>
                                    <span style="color: #6b7280; font-size: 12px;">${t('ads.category')}: ${ad.category?.category_name || t('ads.general')}</span>
                                </td>
                                <td><span dir="ltr">${ad.start_date || '—'}</span></td>
                                <td><span dir="ltr">${ad.end_date || '—'}</span></td>
                                <td>${ad.screens?.length || 0} ${t('ads.screen_word')}</td>
                                <td>${ad.duration} ${t('common.seconds')}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-box">
                            <div class="total-row">
                                <span style="color: #4b5563;">${t('ads.subtotal')}</span>
                                <span>$${ad.total_cost || '0.00'}</span>
                            </div>
                            <div class="total-row">
                                <span style="color: #4b5563;">${t('ads.taxes_0')}</span>
                                <span>$0.00</span>
                            </div>
                            <div class="total-row final">
                                <span>${t('ads.final_total')}</span>
                                <span>$${ad.total_cost || '0.00'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>${t('ads.thank_you_sabacontrol')}</p>
                        <p>${t('ads.electronic_invoice_note')}</p>
                    </div>
                </body>
            </html>
        `);
        
        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => {
            windowPrint.print();
            windowPrint.close();
        }, 250);
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir={dir} style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white w-full max-w-3xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Printer className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{t('ads.ad_invoice')}</h2>
                                    <p className="text-sm text-gray-500 font-mono">INV-AD-{ad.ad_id.toString().padStart(5, '0')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-[#004ac6] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <Printer className="w-4 h-4" />
                                    {t('ads.print_invoice')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Invoice Content Preview */}
                        <div className="p-8 overflow-y-auto bg-gray-100 flex-1">
                            {/* This is the preview that looks like a paper */}
                            <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 mx-auto max-w-2xl relative" ref={printRef}>
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                    <Layers className="w-96 h-96" />
                                </div>

                                {/* Header */}
                                <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-8">
                                    <div>
                                        <h1 className="text-3xl font-black text-[#004ac6] tracking-tight">SabaControl</h1>
                                        <p className="text-gray-500 text-sm mt-1">{t('ads.smart_screens_system')}</p>
                                    </div>
                                    <div className={`text-${dir === 'rtl' ? 'left' : 'right'}`}>
                                        <h2 className="text-2xl font-bold text-gray-800">{t('ads.digital_invoice')}</h2>
                                        <p className="text-gray-500 font-mono mt-1">#INV-AD-{ad.ad_id.toString().padStart(5, '0')}</p>
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('ads.advertiser_info')}</h3>
                                        <p className="text-base font-bold text-gray-900">{ad.advertiser?.name || t('common.unavailable')}</p>
                                        <p className="text-sm text-gray-600 mt-1">{ad.advertiser?.email}</p>
                                        <p className="text-sm text-gray-600 mt-1" dir="ltr">{ad.advertiser?.phone}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('ads.payment_details')}</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('ads.issue_date')}:</span>
                                                <span className="font-semibold text-gray-900">{new Date(ad.created_at || ad.uploaded_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('ads.payment_status')}:</span>
                                                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" /> {t('ads.paid_female')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">{t('ads.broadcast_package')}:</span>
                                                <span className="font-semibold text-gray-900">{ad.package_name || t('ads.free_customization')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('ads.ad_campaign_details')}</h3>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-sm text-right" dir={dir}>
                                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold text-start">{t('ads.description')}</th>
                                                    <th className="px-4 py-3 font-semibold text-center">{t('ads.date')}</th>
                                                    <th className="px-4 py-3 font-semibold text-center">{t('ads.screens')}</th>
                                                    <th className="px-4 py-3 font-semibold text-center">{t('ads.duration')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                <tr className="bg-white">
                                                    <td className="px-4 py-4 text-start">
                                                        <div className="font-bold text-gray-900">{ad.title}</div>
                                                        <div className="text-gray-500 text-xs mt-1">{t('ads.category')}: {ad.category?.category_name || t('ads.general')}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-gray-600" dir="ltr">
                                                        <div className="text-xs">{ad.start_date || '—'}</div>
                                                        <div className="text-xs text-gray-400">{t('ads.to')}</div>
                                                        <div className="text-xs">{ad.end_date || '—'}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium text-xs">
                                                            <Monitor className="w-3 h-3" />
                                                            {ad.screens?.length || 0} {t('ads.screens')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-gray-600">
                                                        {ad.duration} {t('common.seconds')}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className={`flex justify-${dir === 'rtl' ? 'end' : 'start'} mb-12`}>
                                    <div className="w-72 bg-blue-50/50 rounded-xl border border-blue-100 p-5">
                                        <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                                            <span>{t('ads.subtotal')}</span>
                                            <span className="font-semibold text-gray-900">${ad.total_cost || '0.00'}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                                            <span>{t('ads.taxes_0')}</span>
                                            <span className="font-semibold text-gray-900">$0.00</span>
                                        </div>
                                        <div className="pt-4 border-t-2 border-blue-200 flex justify-between items-center">
                                            <span className="font-bold text-gray-900 text-lg">{t('ads.total')}</span>
                                            <span className="font-black text-blue-600 text-xl">${ad.total_cost || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="text-center pt-8 border-t border-gray-100 text-gray-400 text-xs">
                                    <p className="mb-1">{t('ads.thank_you_sabacontrol')}</p>
                                    <p>{t('ads.electronic_invoice_note_no_stamp')}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AdInvoiceModal;

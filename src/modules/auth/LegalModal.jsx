import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText } from 'lucide-react';

const LegalModal = ({ isOpen, onClose, type }) => {
    const isPrivacy = type === 'privacy';
    const title = isPrivacy ? 'سياسة الخصوصية' : 'شروط الاستخدام';
    const Icon = isPrivacy ? ShieldCheck : FileText;

    const privacyContent = (
        <div className="space-y-4 text-sm text-[#4b5563] leading-relaxed font-medium">
            <p>في شبكة سبأ بوست، نولي أهمية قصوى لحماية خصوصيتك وبياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك عند استخدامك لمنصتنا.</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">1. المعلومات التي نجمعها</h4>
            <p>نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل، مثل الاسم، البريد الإلكتروني، ورقم الهاتف. بالإضافة إلى معلومات حول كيفية استخدامك للنظام.</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">2. استخدام المعلومات</h4>
            <p>نستخدم معلوماتك لتقديم وتحسين خدماتنا، ومعالجة المدفوعات للإعلانات، وتوفير دعم فني متخصص، وللتواصل معك بشأن التحديثات المهمة.</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">3. أمان البيانات</h4>
            <p>نحن نستخدم إجراءات أمنية متقدمة وتشفير عالي المستوى لحماية معلوماتك من الوصول غير المصرح به أو التعديل أو الإفصاح.</p>
            <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">آخر تحديث: يوليو 2026</p>
        </div>
    );

    const termsContent = (
        <div className="space-y-4 text-sm text-[#4b5563] leading-relaxed font-medium">
            <p>مرحباً بك في منصة سبأ بوست. باستخدامك لمنصتنا، فإنك توافق على الالتزام بشروط الاستخدام التالية. يرجى قراءتها بعناية.</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">1. شروط استخدام النظام</h4>
            <p>يُمنع استخدام النظام لأي أغراض غير قانونية أو رفع محتوى إعلاني يخالف الآداب العامة أو القوانين المعمول بها. تحتفظ الإدارة بالحق في رفض أي إعلان دون إبداء الأسباب.</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">2. عمليات الدفع والاسترداد</h4>
            <p>جميع المبالغ المدفوعة للحملات الإعلانية المعتمدة غير قابلة للاسترداد. في حال تم رفض الإعلان من قبل الإدارة قبل عرضه، سيتم إعادة المبلغ لرصيدك في المنصة.</p>
            <h4 className="text-[#111827] font-bold mt-4 text-base">3. إخلاء المسؤولية</h4>
            <p>المنصة غير مسؤولة عن أي أضرار غير مباشرة أو خسائر في الأرباح ناتجة عن استخدام أو عدم القدرة على استخدام خدماتنا.</p>
            <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">آخر تحديث: يوليو 2026</p>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
                    {/* الخلفية المظلمة */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
                    />

                    {/* نافذة المحتوى */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#14506b]">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black text-[#111827]">{title}</h3>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200/60 text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="px-6 py-6 overflow-y-auto">
                            {isPrivacy ? privacyContent : termsContent}
                        </div>

                        {/* Footer Button */}
                        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
                            <button 
                                onClick={onClose}
                                className="w-full py-3 bg-[#14506b] hover:bg-[#0f3c50] text-white rounded-xl font-bold text-sm shadow-md shadow-[#14506b]/20 transition-all hover:-translate-y-0.5"
                            >
                                قرأت ذلك وموافق
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LegalModal;

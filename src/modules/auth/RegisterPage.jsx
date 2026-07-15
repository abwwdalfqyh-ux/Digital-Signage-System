import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, LayoutDashboard, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import LegalModal from './LegalModal';

/* ──────────────────────────────────────────────
   Reusable Input – vertical layout, bilingual labels
   matching the Stitsh reference image exactly
   ────────────────────────────────────────────── */
const PremiumInput = ({
    icon: Icon,
    englishLabel,
    arabicLabel,
    type = 'text',
    value,
    onChange,
    isPassword,
    isObscure,
    onToggleObscure,
    required,
}) => {
    const isLtrField = type === 'email' || type === 'tel' || isPassword;

    return (
        <div className="input-group flex flex-col w-full group">
            {/* Bilingual label row */}
            <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="block text-sm font-bold text-[#111827] transition-colors">
                    {arabicLabel}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
                <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold" dir="ltr">
                    {englishLabel}{required ? ' *' : ''}
                </span>
            </div>

            {/* Input wrapper */}
            <div className="relative">
                {/* Right icon */}
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Icon className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-[#14506b]" />
                </div>

                <input
                    type={isPassword ? (isObscure ? 'password' : 'text') : type}
                    value={value}
                    onChange={onChange}
                    placeholder={arabicLabel}
                    className={`block w-full pr-12 ${isPassword ? 'pl-12' : 'pl-4'} py-3.5 border border-[#E5E7EB] rounded-xl text-[14px] font-bold focus:outline-none focus:ring-[3px] focus:ring-[#14506b]/10 focus:border-[#14506b] transition-all bg-white text-[#111827] placeholder-gray-400 shadow-sm ${isLtrField ? 'text-left' : 'text-right'}`}
                    dir={isLtrField ? 'ltr' : 'rtl'}
                    required={required}
                />

                {/* Password toggle */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={onToggleObscure}
                        tabIndex="-1"
                        className="absolute inset-y-0 left-0 pl-4 flex items-center cursor-pointer focus:outline-none"
                    >
                        {isObscure
                            ? <EyeOff className="w-5 h-5 text-gray-400 hover:text-[#111827] transition-colors" />
                            : <Eye className="w-5 h-5 text-[#14506b] transition-colors" />
                        }
                    </button>
                )}
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────
   Register Page
   ────────────────────────────────────────────── */
const RegisterPage = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isObscure, setIsObscure] = useState(true);
    const [legalModalConfig, setLegalModalConfig] = useState({ isOpen: false, type: 'privacy' });

    const handleChange = (e, field) => {
        setForm({ ...form, [field]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!form.full_name.trim() || !form.email.trim() || !form.password) {
            addToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const res = await axiosClient.post(ENDPOINTS.AUTH.REGISTER, form);
            if (res.data.success || res.status === 201) {
                addToast('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success');
                navigate('/login');
            } else {
                addToast(res.data.message || 'فشل إنشاء الحساب', 'error');
            }
        } catch (error) {
            // Error is already handled and toasted by axiosClient global interceptor
            console.error('Registration failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] font-sans p-4 md:p-8" dir="rtl">
            {/* Main Container */}
            <main className="w-full max-w-[1400px] min-h-[85vh] bg-[#f4f6f8] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative">

                {/* Subtle background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#f8ece6] to-transparent opacity-60 pointer-events-none" />

                {/* ===== LEFT: Form Panel ===== */}
                <section className="w-full md:w-[45%] lg:w-[42%] bg-[#FFFFFF] flex flex-col justify-center px-8 md:px-14 lg:px-20 py-10 relative z-0 rounded-l-[2rem] md:rounded-l-none md:rounded-r-[2.5rem] m-4 md:m-0 md:my-8 md:-ml-6 shadow-md h-auto md:min-h-[calc(85vh-4rem)]">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-center mb-8 mt-2"
                    >
                        <h1 className="text-4xl lg:text-[42px] font-black text-[#111827] mb-3">إنشاء حساب جديد</h1>
                        <p className="text-[#6B7280] text-[15px] font-bold">انضم إلى شبكة سبأ بوست لإدارة إعلاناتك بذكاء</p>
                    </motion.div>

                    {/* Form — vertical stacked fields */}
                    <form onSubmit={handleRegister} className="space-y-5">

                        {/* Full Name */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <PremiumInput
                                icon={User}
                                englishLabel="FULL NAME"
                                arabicLabel="الاسم الكامل"
                                value={form.full_name}
                                onChange={(e) => handleChange(e, 'full_name')}
                                required
                            />
                        </motion.div>

                        {/* Email */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <PremiumInput
                                icon={Mail}
                                englishLabel="EMAIL ADDRESS"
                                arabicLabel="البريد الإلكتروني"
                                type="email"
                                value={form.email}
                                onChange={(e) => handleChange(e, 'email')}
                                required
                            />
                        </motion.div>

                        {/* Phone */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <PremiumInput
                                icon={Phone}
                                englishLabel="PHONE NUMBER"
                                arabicLabel="رقم الجوال"
                                type="tel"
                                value={form.phone}
                                onChange={(e) => handleChange(e, 'phone')}
                            />
                        </motion.div>

                        {/* Location */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <PremiumInput
                                icon={MapPin}
                                englishLabel="LOCATION"
                                arabicLabel="الموقع / المحافظة"
                                value={form.location}
                                onChange={(e) => handleChange(e, 'location')}
                            />
                        </motion.div>

                        {/* Password */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <PremiumInput
                                icon={Lock}
                                englishLabel="PASSWORD"
                                arabicLabel="كلمة المرور"
                                value={form.password}
                                onChange={(e) => handleChange(e, 'password')}
                                isPassword
                                isObscure={isObscure}
                                onToggleObscure={() => setIsObscure(!isObscure)}
                                required
                            />
                            {/* Password hint */}
                            <div className="flex justify-between mt-1.5 px-1 text-[11px] text-[#9ca3af] font-medium">
                                <span>مطلوب</span>
                                <span>يجب أن تحتوي على 8 أحرف على الأقل</span>
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="pt-4"
                        >
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-[0_8px_16px_rgba(20,80,107,0.15)] hover:shadow-[0_12px_24px_rgba(20,80,107,0.2)] text-[15px] font-bold text-white bg-[#14506b] hover:bg-[#0f3c50] hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#14506b]/20 transition-all disabled:opacity-75 disabled:hover:translate-y-0 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite]" />

                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>جاري التسجيل...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="relative z-10"
                                        >
                                            إنشاء حساب
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    </form>

                    {/* Login Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        className="mt-8 text-center text-[13px] font-bold text-[#111827]"
                    >
                        <span>لديك حساب بالفعل؟ </span>
                        <Link to="/login" className="text-[#14506b] hover:text-[#0f3c50] hover:underline underline-offset-4 transition-colors">
                            تسجيل الدخول
                        </Link>
                    </motion.div>

                </section>
                {/* ===== END: Form Panel ===== */}

                {/* ===== RIGHT: Branding Panel ===== */}
                <section className="hidden md:flex w-[55%] lg:w-[58%] bg-[#14506b] rounded-[2.5rem] flex-col relative overflow-hidden z-10 shadow-2xl">

                    {/* Top Nav */}
                    <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-20">
                        {/* Logo */}
                        <div className="flex items-center flex-col">
                            <div className="mb-1 flex items-center justify-center drop-shadow-md">
                                <img
                                    src="/Main_app_logo.png"
                                    alt="SabaPost Logo"
                                    className="w-[140px] h-auto object-contain brightness-0 invert"
                                />
                            </div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-full px-5 py-2 backdrop-blur-md shadow-sm">
                            <span className="text-white text-[11px] font-bold tracking-widest uppercase">ENTERPRISE V2.0</span>
                        </div>
                    </div>

                    {/* Center Content */}
                    <div className="flex-grow flex flex-col items-center justify-center z-10 pt-10">

                            {/* Logo with floating elements */}
                            <div className="mb-10 relative">
                                {/* Core Logo Background/Container */}
                                <div className="w-56 h-56 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_60px_rgba(255,255,255,0.15)] relative z-10">
                                    <img src="/Main_app_logo.png" alt="SabaPost Logo" className="w-48 h-48 object-contain drop-shadow-2xl brightness-0 invert" />
                                </div>

                                {/* Floating element – top right */}
                                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white text-[#14506b] rounded-full flex items-center justify-center shadow-lg transform rotate-12 z-20">
                                    <LayoutDashboard className="w-5 h-5" />
                                </div>

                                {/* Floating element – bottom left */}
                                <div className="absolute -bottom-3 -left-4 w-12 h-12 bg-[#d9a05b] text-white rounded-full flex items-center justify-center shadow-lg transform -rotate-12 opacity-90 z-20">
                                    <Zap className="w-6 h-6" />
                                </div>
                            </div>

                        {/* Typography */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center px-12 max-w-xl"
                            dir="rtl"
                        >
                            <h2 className="text-4xl lg:text-[52px] font-black text-white mb-4 leading-tight drop-shadow-md">
                                انضم إلى شبكة
                                <span className="block text-[#d9a05b] mt-3">الوكلاء والمعلنين</span>
                            </h2>
                            <p className="text-white/80 text-[14px] leading-relaxed mt-4 font-medium px-4">
                                ابدأ في إدارة شاشاتك الإعلانية أو إنشاء حملاتك بكل سهولة عبر منصة متخصصة تلبي كافة احتياجاتك.
                            </p>
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-center z-20 text-[12px] text-white/60 font-medium">
                        <div className="flex gap-6">
                            <button type="button" onClick={() => setLegalModalConfig({ isOpen: true, type: 'privacy' })} className="hover:text-white transition-colors cursor-pointer">سياسة الخصوصية</button>
                            <button type="button" onClick={() => setLegalModalConfig({ isOpen: true, type: 'terms' })} className="hover:text-white transition-colors cursor-pointer">شروط الاستخدام</button>
                        </div>
                        <div className="tracking-widest">
                            SABAPOST SECURE 2026 ©
                        </div>
                    </div>

                    {/* Decorative blur blobs */}
                    <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-[#d9a05b] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none" />
                    <div className="absolute bottom-[15%] left-[5%] w-[500px] h-[500px] bg-[#2563EB] rounded-full mix-blend-multiply filter blur-[120px] opacity-20 pointer-events-none" />

                    {/* Decorative rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                        <div className="w-[26rem] h-[26rem] rounded-full border border-dashed border-white/40 absolute" />
                        <div className="w-[36rem] h-[36rem] rounded-full border border-dashed border-white/25 absolute" />
                        <div className="w-[48rem] h-[48rem] rounded-full border border-dashed border-white/10 absolute" />
                    </div>
                </section>
                {/* ===== END: Branding Panel ===== */}

            </main>

            {/* Modal */}
            <LegalModal 
                isOpen={legalModalConfig.isOpen} 
                onClose={() => setLegalModalConfig({ ...legalModalConfig, isOpen: false })} 
                type={legalModalConfig.type} 
            />
        </div>
    );
};

export default RegisterPage;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, MonitorPlay, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import LegalModal from './LegalModal';

const PremiumInput = ({ icon: Icon, englishLabel, arabicLabel, type = "text", value, onChange, isPassword, isObscure, onToggleObscure }) => {
    return (
        <div className="input-group flex flex-col w-full mb-2 group">
            <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="block text-sm font-bold text-[#111827] transition-colors">{arabicLabel}</label>
                <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold">{englishLabel}</span>
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Icon className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-[#14506b]" />
                </div>
                
                <input
                    type={isPassword ? (isObscure ? 'password' : 'text') : type}
                    value={value}
                    onChange={onChange}
                    placeholder={arabicLabel}
                    className="block w-full pl-4 pr-12 py-3.5 border border-[#E5E7EB] rounded-xl text-[14px] font-bold focus:outline-none focus:ring-[3px] focus:ring-[#14506b]/10 focus:border-[#14506b] transition-all text-right bg-white text-[#111827] placeholder-gray-400 shadow-sm"
                    dir="rtl"
                    required
                />

                {isPassword && (
                    <button 
                        type="button" 
                        onClick={onToggleObscure} 
                        tabIndex="-1"
                        className="absolute inset-y-0 left-0 pl-4 flex items-center cursor-pointer focus:outline-none"
                    >
                        {isObscure ? <EyeOff className="w-5 h-5 text-gray-400 hover:text-[#111827] transition-colors" /> : <Eye className="w-5 h-5 text-[#14506b] transition-colors" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const LoginPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);
    const addToast = useToastStore(state => state.addToast);

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isObscure, setIsObscure] = useState(true);
    const [rememberMe, setRememberMe] = useState(false);
    const [legalModalConfig, setLegalModalConfig] = useState({ isOpen: false, type: 'privacy' });

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginId.trim() || !password) {
            addToast('يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, {
                login_id: loginId.trim(),
                password: password,
                device_name: 'Web Browser'
            });

            if (res.data.token) {
                const { token, user } = res.data;
                login(user, token);
                addToast(`مرحباً بك مجدداً، ${user.full_name}! 👋`, 'success');
                navigate('/dashboard');
            } else {
                addToast(res.data.message || 'فشل تسجيل الدخول', 'error');
            }
        } catch (error) {
            // Error is already handled and toasted by axiosClient global interceptor
            console.error('Login failed', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] font-sans p-4 md:p-8" dir="rtl">
            <style>
                {`
                .orbit-container {
                  position: relative;
                  width: 350px;
                  height: 350px;
                  margin: 0 auto;
                }
                .orbit-circle-1, .orbit-circle-2 {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  border-radius: 50%;
                  border: 1px dashed rgba(255, 255, 255, 0.2);
                }
                .orbit-circle-1 {
                  width: 280px;
                  height: 280px;
                  animation: spin 30s linear infinite;
                }
                .orbit-circle-2 {
                  width: 380px;
                  height: 380px;
                  animation: spin-reverse 45s linear infinite;
                }
                @keyframes spin {
                  100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes spin-reverse {
                  100% { transform: translate(-50%, -50%) rotate(-360deg); }
                }
                
                .floating-icon {
                  position: absolute;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                
                .icon-1 { top: 10%; right: 10%; width: 36px; height: 36px; background: white; color: #14506b; }
                .icon-2 { bottom: 10%; left: 20%; width: 42px; height: 42px; background: #d9a05b; color: white; }
                `}
            </style>

            {/* BEGIN: Main Container - Enlarged as requested max-w-[1400px] & min-h-[85vh] */}
            <main className="w-full max-w-[1400px] min-h-[85vh] bg-[#f4f6f8] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative">
                
                {/* Background subtle gradient globally */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#f8ece6] to-transparent opacity-60 pointer-events-none"></div>

                {/* BEGIN: Form Section */}
                <section className="w-full md:w-[45%] lg:w-[42%] bg-[#FFFFFF] flex flex-col justify-center px-8 md:px-14 lg:px-20 py-12 relative z-0 rounded-l-[2rem] md:rounded-l-none md:rounded-r-[2.5rem] m-4 md:m-0 md:my-8 md:-ml-6 shadow-md h-auto md:min-h-[calc(85vh-4rem)]">
                    
                    {/* Header */}
                    <div className="text-center mb-12 mt-4">
                        <h1 className="text-4xl lg:text-[42px] font-black text-[#111827] mb-3">تسجيل الدخول</h1>
                        <p className="text-[#6B7280] text-[15px] font-bold">مرحباً بك مجدداً في منصة سبأ بوست</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        
                        <PremiumInput 
                            icon={User}
                            englishLabel="Email or Phone"
                            arabicLabel="البريد الإلكتروني أو رقم الهاتف"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                        />

                        <PremiumInput 
                            icon={Lock}
                            englishLabel="Password"
                            arabicLabel="كلمة المرور"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            isPassword={true}
                            isObscure={isObscure}
                            onToggleObscure={() => setIsObscure(!isObscure)}
                        />

                        {/* Options */}
                        <div className="flex items-center justify-between mt-6 px-1">
                            <div className="flex items-center">
                                <input 
                                    id="remember-me" 
                                    name="remember-me" 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                    className="h-4 w-4 text-[#14506b] focus:ring-2 focus:ring-[#14506b] border-[#E5E7EB] rounded-[4px] cursor-pointer accent-[#14506b] transition-all" 
                                />
                                <label htmlFor="remember-me" className="mr-2.5 block text-[13px] text-[#111827] cursor-pointer font-bold select-none">
                                    تذكرني
                                </label>
                            </div>
                            <div>
                                <Link to="/forgot-password" className="text-[13px] font-bold text-[#14506b] hover:text-[#0f3c50] transition-colors underline-offset-4 hover:underline">
                                    هل نسيت كلمة المرور؟
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
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
                                            <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>جاري...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.span 
                                            key="active"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="relative z-10"
                                        >
                                            تسجيل الدخول
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </form>

                    {/* Footer Link */}
                    <div className="mt-12 text-center text-[13px] font-bold text-[#111827]">
                        <span>ليس لديك حساب؟ </span>
                        <Link to="/register" className="text-[#14506b] hover:text-[#0f3c50] hover:underline underline-offset-4 transition-colors">
                            أنشئ حساباً جديداً
                        </Link>
                    </div>
                </section>
                {/* END: Form Section */}

                {/* BEGIN: Branding Section */}
                <section className="hidden md:flex w-[55%] lg:w-[58%] bg-[#14506b] rounded-[2.5rem] flex-col relative overflow-hidden z-10 shadow-2xl">
                    
                    {/* Top Nav/Badges */}
                    <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-20">
                        {/* Logo Area */}
                        <div className="flex items-center flex-col">
                            <div className="mb-1 flex items-center justify-center drop-shadow-md">
                                <img src="/Main_app_logo.png" alt="SabaPost Logo" className="w-[140px] h-auto object-contain brightness-0 invert" />
                            </div>
                        </div>
                        <div className="bg-white/10 border border-white/20 rounded-full px-5 py-2 backdrop-blur-md shadow-sm">
                            <span className="text-white text-[11px] font-bold tracking-widest uppercase">ENTERPRISE V2.0</span>
                        </div>
                    </div>

                    {/* Central Graphic & Animation */}
                    <div className="flex-grow flex flex-col items-center justify-center z-10 pt-4 pb-16">
                        <div className="orbit-container mb-10">
                            {/* Orbits */}
                            <div className="orbit-circle-1">
                                <div className="floating-icon icon-1">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="orbit-circle-2">
                                <div className="floating-icon icon-2">
                                    <Zap className="w-5 h-5" />
                                </div>
                            </div>
                            {/* Core Icon */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_60px_rgba(255,255,255,0.15)]">
                                <MonitorPlay className="w-14 h-14 text-white drop-shadow-xl" strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="text-center px-12 max-w-xl">
                            <h2 className="text-4xl lg:text-[52px] font-black text-white mb-4 leading-tight drop-shadow-md">
                                أدر شاشاتك الذكية
                                <span className="block text-[#d9a05b] mt-3">بكل احترافية</span>
                            </h2>
                            <p className="text-white/80 text-[14px] leading-relaxed mt-4 font-medium px-4">
                                نظام السبورة الذكية (Digital Signage) الأول. راقب أداء حملاتك، وتحكم بالمحتوى، وتفاعل مع عملائك في الوقت الفعلي بأمان وسرعة.
                            </p>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-center z-20 text-[12px] text-white/60 font-medium">
                        <div className="flex gap-6">
                            <button onClick={() => setLegalModalConfig({ isOpen: true, type: 'privacy' })} className="hover:text-white transition-colors cursor-pointer">سياسة الخصوصية</button>
                            <button onClick={() => setLegalModalConfig({ isOpen: true, type: 'terms' })} className="hover:text-white transition-colors cursor-pointer">شروط الاستخدام</button>
                        </div>
                        <div className="tracking-widest">
                            SABAPOST SECURE 2026 ©
                        </div>
                    </div>

                    {/* Decorative abstract elements */}
                    <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-[#d9a05b] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
                    <div className="absolute bottom-[15%] left-[5%] w-[500px] h-[500px] bg-[#2563EB] rounded-full mix-blend-multiply filter blur-[120px] opacity-20 pointer-events-none"></div>
                </section>
                {/* END: Branding Section */}
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

export default LoginPage;
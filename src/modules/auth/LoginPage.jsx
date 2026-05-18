import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, MonitorPlay, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';

const DualLanguageInput = ({ icon: Icon, englishLabel, arabicLabel, type = "text", value, onChange, isPassword, isObscure, onToggleObscure }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div 
            className={`flex items-center w-full bg-white/60 backdrop-blur-sm border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                isFocused ? 'border-[var(--color-dark-turquoise)] shadow-[0_0_15px_rgba(33,181,179,0.2)] bg-white' : 'border-gray-200 hover:border-gray-300'
            }`}
        >
            {/* English / Left Side */}
            <div className={`flex items-center pl-4 pr-3 py-3.5 gap-3 border-r transition-colors ${isFocused ? 'border-[var(--color-dark-turquoise)]/20' : 'border-gray-100'}`}>
                <Icon className={`w-5 h-5 transition-colors ${isFocused ? 'text-[var(--color-dark-turquoise)]' : 'text-[var(--color-gold)]'}`} />
                <span className={`text-xs font-bold whitespace-nowrap transition-colors ${isFocused ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-400'}`}>
                    {englishLabel}
                </span>
            </div>
            
            {/* Input Field (Arabic placeholder) */}
            <input
                type={isPassword ? (isObscure ? 'password' : 'text') : type}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={arabicLabel}
                className="flex-1 bg-transparent border-none outline-none text-right px-4 text-sm font-bold text-gray-800 placeholder-gray-400 w-full"
                dir="rtl"
                required
            />

            {/* Password Toggle */}
            {isPassword && (
                <button 
                    type="button" 
                    onClick={onToggleObscure} 
                    className="pr-4 pl-2 text-gray-400 hover:text-[var(--color-dark-turquoise)] transition-colors"
                >
                    {isObscure ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            )}
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

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginId.trim() || !password) {
            addToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axiosClient.post('/login', {
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
            addToast(error.response?.data?.message || 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 font-sans overflow-hidden">
            
            {/* Right Side: Login Form (100% on mobile, 50% on desktop) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 relative z-10 bg-white shadow-[0_0_40px_rgba(0,0,0,0.05)]">
                
                {/* Decorative floating blurred elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-dark-turquoise)]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-gold)]/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-[420px] flex flex-col items-stretch relative"
                >
                    {/* Logo for mobile only (Hidden on Desktop because it's on the left side) */}
                    <div className="flex lg:hidden justify-center mb-6">
                        <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="w-[120px] h-auto object-contain" />
                    </div>

                    {/* Welcome Texts */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                            مرحباً بك في <span className="text-[var(--color-dark-turquoise)]">سبأ بوست</span>
                        </h1>
                        <p className="text-sm font-bold text-gray-400 tracking-wide uppercase">
                            Welcome Back to SabaPost
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        {/* Username/Email */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <DualLanguageInput 
                                icon={User}
                                englishLabel="Email or Phone"
                                arabicLabel="البريد الإلكتروني أو رقم الهاتف"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                            />
                        </motion.div>

                        {/* Password */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <DualLanguageInput 
                                icon={Lock}
                                englishLabel="Password"
                                arabicLabel="كلمة المرور"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                isPassword={true}
                                isObscure={isObscure}
                                onToggleObscure={() => setIsObscure(!isObscure)}
                            />
                        </motion.div>

                        {/* Login Button */}
                        <motion.button 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            type="submit" 
                            disabled={isLoading}
                            className="mt-4 w-full bg-gradient-to-r from-[var(--color-dark-turquoise)] to-[#007b8f] text-white py-4 rounded-2xl text-[18px] font-black flex justify-center items-center hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 shadow-[0_8px_20px_rgba(33,181,179,0.3)] group overflow-hidden relative"
                        >
                            {/* Shine effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                            
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm">جاري الدخول...</span>
                                </div>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </motion.button>
                    </form>

                    {/* Forgot Password */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-between items-center mt-6 px-2"
                    >
                        <button className="text-[12px] font-bold text-gray-400 hover:text-[var(--color-dark-turquoise)] transition-colors">
                            Forgot Password?
                        </button>
                        <button className="text-[13px] font-black text-gray-500 hover:text-[var(--color-dark-turquoise)] transition-colors">
                            هل نسيت كلمة المرور؟
                        </button>
                    </motion.div>

                    {/* Divider */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center my-8 opacity-60"
                    >
                        <div className="flex-1 border-t border-gray-200"></div>
                        <div className="px-4 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">أو عبر</p>
                        </div>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </motion.div>

                    {/* Social Buttons */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex justify-center gap-4 mb-8"
                    >
                        <button className="flex-1 bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-gray-600 shadow-sm">
                            <span className="text-[20px]">G</span> Google
                        </button>
                        <button className="flex-1 bg-gray-900 border border-gray-900 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all font-bold text-white shadow-sm">
                            <span className="text-[20px] pb-1"></span> Apple
                        </button>
                    </motion.div>

                    {/* Sign Up */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-[var(--color-dark-turquoise)]/5 transition-colors border border-dashed border-gray-200 hover:border-[var(--color-dark-turquoise)]/30 group"
                        onClick={() => navigate('/register')}
                    >
                        <p className="text-[14px] font-black text-gray-700 group-hover:text-[var(--color-dark-turquoise)] transition-colors mb-0.5">
                            ليس لديك حساب؟ أنشئ حساباً جديداً الآن
                        </p>
                        <p className="text-[11px] font-bold text-gray-400">
                            No account? Create one today
                        </p>
                    </motion.div>

                </motion.div>
            </div>

            {/* Left Side: Modern Graphic & Info (Hidden on mobile, 50% on desktop) */}
            <div className="hidden lg:flex w-1/2 bg-[var(--color-dark-turquoise)] relative flex-col items-center justify-between p-12 overflow-hidden">
                {/* Background Pattern / Shapes */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--color-gold)]/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 w-full flex justify-between items-start">
                    <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="w-[160px] h-auto object-contain brightness-0 invert" />
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                        <span className="text-white text-xs font-bold tracking-widest">SaaS PLATFORM V2.0</span>
                    </div>
                </div>

                <div className="relative z-10 text-center space-y-8 w-full max-w-lg">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="relative mx-auto w-64 h-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-2xl"
                    >
                        {/* Glowing core */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--color-dark-turquoise)] to-[var(--color-gold)] opacity-50 blur-xl animate-pulse"></div>
                        <MonitorPlay className="w-24 h-24 text-white drop-shadow-lg relative z-10" />
                        
                        {/* Orbiting elements */}
                        <div className="absolute inset-0 border border-white/20 rounded-full animate-[spin_10s_linear_infinite]">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[var(--color-gold)] rounded-full shadow-[0_0_15px_rgba(255,215,0,0.5)] flex items-center justify-center">
                                <Zap className="w-3 h-3 text-white" />
                            </div>
                        </div>
                        <div className="absolute -inset-8 border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]">
                            <div className="absolute bottom-4 right-4 w-8 h-8 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-[var(--color-dark-turquoise)]" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-4"
                    >
                        <h2 className="text-4xl font-black text-white leading-tight">
                            أدر إعلاناتك بذكاء<br />
                            <span className="text-[var(--color-gold)]">في كل مكان</span>
                        </h2>
                        <p className="text-white/80 text-sm leading-relaxed max-w-md mx-auto font-medium">
                            المنصة الأولى للتحكم الذكي بالشاشات الإعلانية. راقب أداء حملاتك، وتحكم بالمحتوى، وتفاعل مع عملائك في الوقت الفعلي عبر شبكة واسعة من الشاشات.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 w-full flex justify-between items-center text-white/50 text-xs font-bold">
                    <p>© {new Date().getFullYear()} SabaPost. All rights reserved.</p>
                    <div className="flex gap-4">
                        <span className="hover:text-white cursor-pointer transition-colors">سياسة الخصوصية</span>
                        <span className="hover:text-white cursor-pointer transition-colors">شروط الاستخدام</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default LoginPage;
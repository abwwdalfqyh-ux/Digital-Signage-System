import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';

const DualLanguageInput = ({ icon: Icon, englishLabel, arabicLabel, type = "text", value, onChange, isPassword, isObscure, onToggleObscure }) => {
    return (
        <div className="flex items-center w-full bg-white border-[1.5px] border-[var(--color-dark-turquoise)] rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-opacity-50 focus-within:ring-[var(--color-dark-turquoise)] transition-all">
            {/* English / Left Side */}
            <div className="flex items-center pl-4 pr-3 py-3 gap-3 border-r border-transparent">
                <Icon className="w-5 h-5 text-[var(--color-gold)]" />
                <span className="text-gray-500 text-sm whitespace-nowrap min-w-[120px] text-left">{englishLabel}</span>
            </div>
            
            {/* Input Field (Arabic / Right Side placeholder logic) */}
            <input
                type={isPassword ? (isObscure ? 'password' : 'text') : type}
                value={value}
                onChange={onChange}
                placeholder={arabicLabel}
                className="flex-1 bg-transparent border-none outline-none text-right px-4 text-sm text-gray-800 placeholder-gray-500 w-full"
                dir="rtl"
                required
            />

            {/* Password Toggle */}
            {isPassword && (
                <button type="button" onClick={onToggleObscure} className="pr-4 pl-2 text-gray-500 hover:text-gray-700">
                    {isObscure ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            )}
        </div>
    );
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isObscure, setIsObscure] = useState(true);

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
            const res = await axiosClient.post('/register', form);
            if (res.data.success || res.status === 201) {
                addToast('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success');
                navigate('/login');
            } else {
                addToast(res.data.message || 'فشل إنشاء الحساب', 'error');
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'تعذر الاتصال بالخادم. يرجى التأكد من البيانات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-light)] flex flex-col items-center justify-center py-10 px-6 font-sans">
            <div className="w-full max-w-[380px] flex flex-col items-stretch">
                
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="w-[120px] h-auto object-contain" />
                </div>

                {/* Welcome Texts */}
                <h1 className="text-[22px] font-bold text-center text-[var(--color-dark-turquoise)] mb-1">
                    أهلاً بك في سبأ بوست
                </h1>
                <h2 className="text-[16px] font-semibold text-center text-[var(--color-dark-turquoise)] mb-8">
                    Welcome to SabaPost
                </h2>

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <DualLanguageInput 
                        icon={User}
                        englishLabel="Username"
                        arabicLabel="اسم المستخدم"
                        value={form.full_name}
                        onChange={(e) => handleChange(e, 'full_name')}
                    />

                    <DualLanguageInput 
                        icon={Mail}
                        englishLabel="Email Address"
                        arabicLabel="البريد الإلكتروني"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange(e, 'email')}
                    />

                    <DualLanguageInput 
                        icon={Phone}
                        englishLabel="Phone Number"
                        arabicLabel="رقم موبايل"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange(e, 'phone')}
                    />

                    <DualLanguageInput 
                        icon={MapPin}
                        englishLabel="Location / Gov"
                        arabicLabel="الموقع / محافظة"
                        value={form.location}
                        onChange={(e) => handleChange(e, 'location')}
                    />

                    <DualLanguageInput 
                        icon={Lock}
                        englishLabel="Password"
                        arabicLabel="كلمة المرور"
                        value={form.password}
                        onChange={(e) => handleChange(e, 'password')}
                        isPassword={true}
                        isObscure={isObscure}
                        onToggleObscure={() => setIsObscure(!isObscure)}
                    />

                    {/* Register Button */}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="mt-4 w-full bg-[var(--color-dark-turquoise)] text-white py-3.5 rounded-full text-[18px] font-bold flex justify-center items-center hover:opacity-90 transition-opacity disabled:opacity-70"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'إنشاء حساب'
                        )}
                    </button>
                </form>

                {/* Or Register with */}
                <div className="flex items-center my-8">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <div className="px-4 text-center">
                        <p className="text-[12px] font-bold text-[var(--color-grey-text)]">أو التسجيل عبر</p>
                        <p className="text-[11px] text-[var(--color-grey-text)]">Or Sign Up with</p>
                    </div>
                    <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Social Buttons */}
                <div className="flex justify-center gap-8 mb-10">
                    <button className="flex items-center gap-2 font-bold text-[16px] text-[var(--color-dark-turquoise)] hover:opacity-80">
                        <span className="text-[22px]">G</span> Google
                    </button>
                    <button className="flex items-center gap-2 font-bold text-[16px] text-[var(--color-dark-turquoise)] hover:opacity-80">
                        <span className="text-[22px]"></span> Apple
                    </button>
                </div>

                {/* Sign In Link */}
                <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/login')}>
                    <p className="text-[14px] font-bold text-[var(--color-dark-turquoise)] mb-0.5">
                        لديك حساب بالفعل؟ تسجيل الدخول
                    </p>
                    <p className="text-[13px] text-[var(--color-dark-turquoise)]">
                        Have an account? Sign In
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RegisterPage;

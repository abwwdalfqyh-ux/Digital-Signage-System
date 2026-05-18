import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

/**
 * Forgot Password Screen
 * A high-end UI to handle password recovery requests.
 */
const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        // محاكاة طلب استعادة كلمة المرور
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 2000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-4 rtl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] -z-10"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center"
            >
                {!isSubmitted ? (
                    <>
                        <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/40 rotate-12">
                            <KeyRound className="text-white w-10 h-10 -rotate-12" />
                        </div>
                        
                        <h2 className="text-3xl font-black text-white mb-4">نسيت كلمة المرور؟</h2>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            لا تقلق، أدخل بريدك الإلكتروني أدناه وسنرسل لك تعليمات استعادة الوصول إلى حسابك.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-gray-500 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    placeholder="البريد الإلكتروني"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-right"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>إرسال رابط الاستعادة</span>
                                        <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-6"
                    >
                        <div className="bg-green-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                            <CheckCircle2 className="text-green-500 w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4">تم الإرسال بنجاح!</h2>
                        <p className="text-gray-500 text-sm mb-10 leading-relaxed px-4">
                            لقد أرسلنا بريداً إلكترونياً إلى <span className="text-white font-bold">{email}</span>. يرجى مراجعة بريدك واتباع التعليمات.
                        </p>
                        <button 
                            onClick={() => setIsSubmitted(false)}
                            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                        >
                            إعادة الإرسال مرة أخرى
                        </button>
                    </motion.div>
                )}

                <div className="mt-10 pt-8 border-t border-white/5">
                    <Link to="/login" className="flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium">
                        <ArrowRight className="w-4 h-4" />
                        العودة لتسجيل الدخول
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;

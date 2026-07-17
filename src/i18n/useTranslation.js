import useUIStore from "../store/useUIStore";
import ar from './ar.json';
import en from './en.json';

const translations = { ar, en };

/**
 * Hook مركزي للترجمة — يعمل بدون إنترنت
 * يقرأ اللغة من useUIStore ويعيد النص المترجم
 * 
 * @example
 * const { t, lang, isRTL, dir } = useTranslation();
 * t('auth.login_title') → "تسجيل الدخول" أو "Login"
 * t('common.welcome_back', { name: 'أحمد' }) → "مرحباً بك مجدداً، أحمد!"
 */
const useTranslation = () => {
    const language = useUIStore(state => state.language);
    const isRTL = language === 'ar';

    /**
     * ترجمة مفتاح نصي
     * @param {string} key - المفتاح بنظام namespace (مثل 'auth.login_title')
     * @param {object} args - متغيرات للاستبدال (مثل { name: 'أحمد' })
     * @returns {string} النص المترجم
     */
    const t = (key, args = {}) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback: حاول العربية أولاً ثم أعد المفتاح
                let fallback = translations.ar;
                for (const fk of keys) {
                    if (fallback && typeof fallback === 'object' && fk in fallback) {
                        fallback = fallback[fk];
                    } else {
                        return key; // لم يُعثر على المفتاح
                    }
                }
                value = fallback;
                break;
            }
        }

        if (typeof value !== 'string') return key;

        // استبدال المتغيرات: {name} → أحمد
        return value.replace(/\{(\w+)\}/g, (_, argKey) => {
            return args[argKey] !== undefined ? args[argKey] : `{${argKey}}`;
        });
    };

    return {
        t,
        lang: language,
        isRTL,
        dir: isRTL ? 'rtl' : 'ltr',
    };
};

export default useTranslation;

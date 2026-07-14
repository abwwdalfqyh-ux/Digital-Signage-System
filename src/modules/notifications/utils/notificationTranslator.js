import { DollarSign, Monitor, UserPlus, Clock, CheckCircle2, Calendar, AlertCircle, Bell } from 'lucide-react';

export const parseNotificationContent = (content) => {
    if (!content) return '';
    try {
        if (typeof content === 'string') {
            const parsed = JSON.parse(content);
            if (parsed.key) {
                return formatMessage(parsed.key, parsed.args || {});
            }
        }
        return content; // raw string fallback
    } catch (e) {
        return content;
    }
};

const formatMessage = (key, args) => {
    switch(key) {
        // Titles
        case 'notif_title_payment_confirmed': return 'تم تأكيد الدفع بنجاح';
        case 'notif_title_ad_paid_online': return 'دفعة إلكترونية جديدة';
        case 'notif_title_new_screen': return 'تسجيل شاشة جديدة';
        case 'notif_title_new_user': return 'تسجيل مستخدم جديد';
        case 'notif_title_new_ad_pending': return 'تم إرسال الإعلان للمراجعة';
        case 'notif_title_ad_pending_review': return 'إعلان جديد بانتظار المراجعة';
        case 'notif_title_new_receipt': return 'إيصال دفع جديد بانتظار الاعتماد';
        case 'notif_title_ad_approved_for_payment': return 'تهانينا! تمت الموافقة على إعلانك';
        case 'notif_title_ad_approved': return 'تم الموافقة على إعلانك';
        case 'notif_title_ad_scheduled': return 'تم جدولة الإعلان';
        case 'notif_title_ad_rejected': return 'تم رفض الإعلان';

        case 'notif_title_payout_requested': return 'طلب سحب رصيد جديد';
        case 'notif_title_payout_approved': return 'تم اعتماد طلب السحب';
        case 'notif_title_payout_rejected': return 'تم رفض طلب السحب';

        // Messages
        case 'notif_msg_payment_confirmed': 
            return `تم تأكيد دفع مبلغ $${args.amount} للإعلان "${args.title}" وتوزيع الأرباح على ملاك الشاشات.`;
        case 'notif_msg_ad_paid_online': 
            return `تم استلام دفعة إلكترونية عبر Stripe للإعلان "${args.title}".`;
        case 'notif_msg_new_screen': 
            return `تم تسجيل شاشة جديدة في النظام باسم "${args.name}".`;
        case 'notif_msg_new_user': 
            return `مستخدم جديد انضم إلى النظام: ${args.name}.`;
        case 'notif_msg_new_ad_pending': 
            return `إعلانك "${args.title}" قيد المراجعة حالياً. سيقوم الفريق بمراجعته قريباً.`;
        case 'notif_msg_ad_pending_review': 
            return `المعلن ${args.advertiser} قام برفع إعلان جديد "${args.title}". يرجى مراجعته.`;
        case 'notif_msg_new_receipt': 
            return `المعلن ${args.advertiser} أرفق إيصالاً بمبلغ $${args.cost}. يرجى مراجعته بقسم العمليات.`;
        case 'notif_msg_ad_approved_for_payment': 
            return `الإعلان "${args.title}" اجتاز المراجعة وهو جاهز للدفع لكي يتم نشره.`;
        case 'notif_msg_ad_approved': 
            return `مبارك، تم الموافقة على إعلانك "${args.title}" وبدء تفعيله.`;
        case 'notif_msg_ad_scheduled': 
            return `تم جدولة إعلانك "${args.title}" على الشاشة "${args.screen}" ليبدأ العرض بتاريخ ${args.start}.`;
        case 'notif_msg_ad_rejected': 
            return `نأسف، تم رفض إعلانك "${args.title}". السبب: ${args.reason}.`;
        case 'notif_msg_payout_requested':
            return `يوجد طلب سحب رصيد جديد في انتظار المراجعة والاعتماد.`;
        case 'notif_msg_payout_approved':
            return `تم اعتماد تحويل أرباحك بنجاح، يرجى مراجعة حسابك البنكي.`;
        case 'notif_msg_payout_rejected':
            return `تعذر تنفيذ طلب السحب الخاص بك. يرجى مراجعة التفاصيل في سجل الأرباح.`;

        default:
            return key;
    }
};

export const getNotificationIconInfo = (titleKey) => {
    const key = (() => {
        try {
            return JSON.parse(titleKey)?.key || titleKey;
        } catch(e) { return titleKey; }
    })();

    switch(key) {
        case 'notif_title_payment_confirmed':
        case 'notif_title_ad_paid_online':
        case 'notif_title_new_receipt':
            return { Icon: DollarSign, colorClass: 'text-green-600 bg-green-100' };
        case 'notif_title_new_screen':
            return { Icon: Monitor, colorClass: 'text-blue-600 bg-blue-100' };
        case 'notif_title_new_user':
            return { Icon: UserPlus, colorClass: 'text-purple-600 bg-purple-100' };
        case 'notif_title_new_ad_pending':
        case 'notif_title_ad_pending_review':
            return { Icon: Clock, colorClass: 'text-yellow-600 bg-yellow-100' };
        case 'notif_title_ad_approved':
        case 'notif_title_ad_approved_for_payment':
        case 'notif_title_payout_approved':
            return { Icon: CheckCircle2, colorClass: 'text-[#2E7D32] bg-[#2E7D32]/10' };
        case 'notif_title_ad_scheduled':
            return { Icon: Calendar, colorClass: 'text-[var(--color-dark-turquoise)] bg-[var(--color-dark-turquoise)]/10' };
        case 'notif_title_ad_rejected':
        case 'notif_title_payout_rejected':
            return { Icon: AlertCircle, colorClass: 'text-red-600 bg-red-100' };
        case 'notif_title_payout_requested':
            return { Icon: DollarSign, colorClass: 'text-amber-600 bg-amber-100' };
        default:
            return { Icon: Bell, colorClass: 'text-gray-500 bg-gray-100' };
    }
};

import useAuthStore from '../../../store/useAuthStore';

export const getNotificationLink = (titleKey) => {
    const key = (() => {
        try {
            return JSON.parse(titleKey)?.key || titleKey;
        } catch(e) { return titleKey; }
    })();

    const roleName = useAuthStore.getState().getRoleName();

    switch(key) {
        case 'notif_title_payment_confirmed':
        case 'notif_title_ad_paid_online':
        case 'notif_title_new_receipt':
        case 'notif_title_payout_requested':
        case 'notif_title_payout_approved':
        case 'notif_title_payout_rejected':
            if (roleName === 'Advertiser') return '/dashboard/my-financials';
            if (roleName === 'ScreenOwner') return '/dashboard/earnings';
            if (roleName === 'Secretary') return '/dashboard/payment-ops';
            return '/dashboard/financial'; // Default for Admin/SuperAdmin

        case 'notif_title_new_screen':
            return '/dashboard/screens';

        case 'notif_title_new_user':
            return '/dashboard/users';

        case 'notif_title_new_ad_pending':
        case 'notif_title_ad_pending_review':
        case 'notif_title_ad_approved':
        case 'notif_title_ad_approved_for_payment':
        case 'notif_title_ad_scheduled':
        case 'notif_title_ad_rejected':
            return '/dashboard/ads';

        default:
            return null;
    }
};

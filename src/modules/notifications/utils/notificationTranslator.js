import { DollarSign, Monitor, UserPlus, Clock, CheckCircle2, Calendar, AlertCircle, Bell } from 'lucide-react';
import useUIStore from '../../../store/useUIStore';

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
    const isEn = useUIStore.getState().language === 'en';

    switch(key) {
        // Titles
        case 'notif_title_payment_confirmed': return isEn ? 'Payment Confirmed' : 'تم تأكيد الدفع بنجاح';
        case 'notif_title_ad_paid_online': return isEn ? 'New Online Payment' : 'دفعة إلكترونية جديدة';
        case 'notif_title_new_screen': return isEn ? 'New Screen Registered' : 'تسجيل شاشة جديدة';
        case 'notif_title_screen_empty': return isEn ? 'Screen Requires Content' : 'الشاشة لا تبث أي إعلان!';
        case 'notif_title_new_user': return isEn ? 'New User Registered' : 'تسجيل مستخدم جديد';
        case 'notif_title_new_ad_pending': return isEn ? 'Ad Submitted for Review' : 'تم إرسال الإعلان للمراجعة';
        case 'notif_title_ad_pending_review': return isEn ? 'New Ad Pending Review' : 'إعلان جديد بانتظار المراجعة';
        case 'notif_title_new_receipt': return isEn ? 'New Payment Receipt' : 'إيصال دفع جديد بانتظار الاعتماد';
        case 'notif_title_ad_approved_for_payment': return isEn ? 'Ad Approved (Pending Payment)' : 'تهانينا! تمت الموافقة على إعلانك';
        case 'notif_title_ad_approved': return isEn ? 'Ad Approved' : 'تم الموافقة على إعلانك';
        case 'notif_title_ad_scheduled': return isEn ? 'Ad Scheduled' : 'تم جدولة الإعلان';
        case 'notif_title_ad_rejected': return isEn ? 'Ad Rejected' : 'تم رفض الإعلان';

        case 'notif_title_payout_requested': return isEn ? 'New Payout Request' : 'طلب سحب رصيد جديد';
        case 'notif_title_payout_approved': return isEn ? 'Payout Approved' : 'تم اعتماد طلب السحب';
        case 'notif_title_payout_rejected': return isEn ? 'Payout Rejected' : 'تم رفض طلب السحب';

        // Messages
        case 'notif_msg_payment_confirmed': 
            return isEn ? `Payment of $${args.amount} confirmed for ad "${args.title}".` : `تم تأكيد دفع مبلغ $${args.amount} للإعلان "${args.title}" وتوزيع الأرباح على ملاك الشاشات.`;
        case 'notif_msg_ad_paid_online': 
            return isEn ? `Online payment received for ad "${args.title}".` : `تم استلام دفعة إلكترونية عبر Stripe للإعلان "${args.title}".`;
        case 'notif_msg_new_screen': 
            return isEn ? `A new screen "${args.name}" has been registered.` : `تم تسجيل شاشة جديدة في النظام باسم "${args.name}".`;
        case 'notif_msg_screen_empty': 
            return isEn ? `The screen requires an ad to be published, or it will display a default image.` : `الشاشة تحتاج لرفع إعلان لتبدأ البث وإلا ستعرض الصورة الافتراضية.`;
        case 'notif_msg_new_user': 
            return isEn ? `New user joined: ${args.name}.` : `مستخدم جديد انضم إلى النظام: ${args.name}.`;
        case 'notif_msg_new_ad_pending': 
            return isEn ? `Your ad "${args.title}" is currently under review.` : `إعلانك "${args.title}" قيد المراجعة حالياً. سيقوم الفريق بمراجعته قريباً.`;
        case 'notif_msg_ad_pending_review': 
            return isEn ? `Advertiser ${args.advertiser} submitted a new ad "${args.title}".` : `المعلن ${args.advertiser} قام برفع إعلان جديد "${args.title}". يرجى مراجعته.`;
        case 'notif_msg_new_receipt': 
            return isEn ? `Advertiser ${args.advertiser} uploaded a receipt for $${args.cost}.` : `المعلن ${args.advertiser} أرفق إيصالاً بمبلغ $${args.cost}. يرجى مراجعته بقسم العمليات.`;
        case 'notif_msg_ad_approved_for_payment': 
            return isEn ? `Ad "${args.title}" approved and is ready for payment.` : `الإعلان "${args.title}" اجتاز المراجعة وهو جاهز للدفع لكي يتم نشره.`;
        case 'notif_msg_ad_approved': 
            return isEn ? `Congratulations, your ad "${args.title}" was approved.` : `مبارك، تم الموافقة على إعلانك "${args.title}" وبدء تفعيله.`;
        case 'notif_msg_ad_scheduled': 
            return isEn ? `Your ad "${args.title}" is scheduled on screen "${args.screen}" starting ${args.start}.` : `تم جدولة إعلانك "${args.title}" على الشاشة "${args.screen}" ليبدأ العرض بتاريخ ${args.start}.`;
        case 'notif_msg_ad_rejected': 
            return isEn ? `Sorry, your ad "${args.title}" was rejected. Reason: ${args.reason}.` : `نأسف، تم رفض إعلانك "${args.title}". السبب: ${args.reason}.`;
        case 'notif_msg_payout_requested':
            return isEn ? `A new payout request is pending review.` : `يوجد طلب سحب رصيد جديد في انتظار المراجعة والاعتماد.`;
        case 'notif_msg_payout_approved':
            return isEn ? `Your payout has been approved successfully.` : `تم اعتماد تحويل أرباحك بنجاح، يرجى مراجعة حسابك البنكي.`;
        case 'notif_msg_payout_rejected':
            return isEn ? `Your payout request could not be processed.` : `تعذر تنفيذ طلب السحب الخاص بك. يرجى مراجعة التفاصيل في سجل الأرباح.`;

        // تعويض الإعلانات عند عودة الشاشة
        case 'notif_title_ad_compensated': return isEn ? 'Ad Compensated Automatically 🎁' : 'تم تعويض إعلانك تلقائياً 🎁';
        case 'notif_title_ad_compensated_admin': return isEn ? 'Auto Ad Compensation 🔄' : 'تعويض إعلان تلقائي 🔄';
        case 'notif_msg_ad_compensated':
            return isEn ? `Your ad "${args.title}" was extended by ${args.minutes} minutes to compensate for downtime on screen "${args.screen}".` : `تم تمديد فترة إعلانك "${args.title}" بمقدار ${args.minutes} دقيقة كتعويض عن فترة انقطاع في شاشة: ${args.screen}.`;
        case 'notif_msg_ad_compensated_admin':
            return isEn ? `Ad "${args.title}" was extended by ${args.minutes} minutes due to screen "${args.screen}" coming back online.` : `تم تعويض الإعلان "${args.title}" بـ ${args.minutes} دقيقة بسبب عودة شاشة "${args.screen}" للعمل.`;

        // سند دفع يدوي
        case 'notif_title_manual_payment': return isEn ? 'New Manual Payment Receipt' : 'سند دفع يدوي جديد';
        case 'notif_msg_manual_payment':
            return isEn ? `A manual payment receipt was submitted for ad #${args.ad_id} via ${args.method}.` : `تم رفع سند دفع يدوي للإعلان رقم ${args.ad_id} عبر ${args.method}.`;

        // رفض الدفع
        case 'notif_title_payment_rejected': return isEn ? 'Payment Rejected' : 'تم رفض الدفعة';
        case 'notif_msg_payment_rejected':
            return isEn ? `Payment for ad "${args.title}" was rejected.` : `تم رفض الدفعة الخاصة بالإعلان "${args.title}".`;

        // شاشة فارغة
        case 'notif_title_screen_empty': return isEn ? 'Screen Requires Content' : 'الشاشة لا تبث أي إعلان!';

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

    const roleId = useAuthStore.getState().getRoleId();

    switch(key) {
        case 'notif_title_payment_confirmed':
        case 'notif_title_ad_paid_online':
        case 'notif_title_new_receipt':
        case 'notif_title_payout_requested':
        case 'notif_title_payout_approved':
        case 'notif_title_payout_rejected':
            if (roleId === 2) return '/dashboard/my-financials';
            if (roleId === 3) return '/dashboard/earnings';
            if (roleId === 6) return '/dashboard/payment-ops';
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

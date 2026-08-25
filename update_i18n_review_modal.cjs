const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'src/i18n/ar.json');
const enPath = path.join(__dirname, 'src/i18n/en.json');

const updateJson = (filePath, updates) => {
    let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.ads) {
        Object.assign(data.ads, updates);
    } else {
        data.ads = updates;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const keysAR = {
    "review_approve_campaign": "مراجعة واعتماد الحملة",
    "campaign_title": "عنوان الحملة",
    "identity card": "بطاقة الهوية",
    "no_media_file": "لا يوجد ملف مرفق",
    "preview": "معاينة",
    "format": "الصيغة",
    "video": "فيديو",
    "image": "صورة",
    "duration": "المدة",
    "size": "الحجم",
    "reject_reason": "سبب الرفض",
    "mandatory_if_rejected": "إلزامي في حال الرفض",
    "reject_placeholder": "اكتب سبب الرفض هنا ليتم إرساله للمعلن...",
    "reject_ad": "رفض الإعلان",
    "approve_and_request_payment": "اعتماد وطلب الدفع",
    "confirm_rejection_msg": "هل أنت متأكد من رفض هذا الإعلان؟ سيتم إشعار المعلن.",
    "confirm_waiting_payment_msg": "سيتم الموافقة على الإعلان وتحويل حالته إلى 'بانتظار الدفع'."
};

const keysEN = {
    "review_approve_campaign": "Review & Approve Campaign",
    "campaign_title": "Campaign Title",
    "identity card": "ID Card",
    "no_media_file": "No media file attached",
    "preview": "Preview",
    "format": "Format",
    "video": "Video",
    "image": "Image",
    "duration": "Duration",
    "size": "Size",
    "reject_reason": "Reason for Rejection",
    "mandatory_if_rejected": "Mandatory if rejected",
    "reject_placeholder": "Write the reason for rejection here to notify the advertiser...",
    "reject_ad": "Reject Ad",
    "approve_and_request_payment": "Approve & Request Payment",
    "confirm_rejection_msg": "Are you sure you want to reject this ad? The advertiser will be notified.",
    "confirm_waiting_payment_msg": "The ad will be approved and its status changed to 'Waiting for Payment'."
};

updateJson(arPath, keysAR);
updateJson(enPath, keysEN);

console.log('Added missing keys for Review Modal!');

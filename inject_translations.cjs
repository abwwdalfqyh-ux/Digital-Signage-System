const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, 'src/i18n/ar.json');
const enPath = path.join(__dirname, 'src/i18n/en.json');

const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!arData.defaultContent) {
    arData.defaultContent = {
        "title": "المحتوى الافتراضي للشاشات",
        "add_new": "إضافة محتوى جديد",
        "loading": "جاري التحميل...",
        "duration": "المدة",
        "seconds": "ثانية",
        "target": "الاستهداف",
        "general_target": "عام (لجميع الشاشات)",
        "active": "مفعل",
        "activate": "تفعيل",
        "delete": "حذف",
        "no_content": "لا يوجد محتوى افتراضي مضاف بعد.",
        "add_title": "إضافة محتوى افتراضي",
        "content_title": "العنوان",
        "content_duration": "المدة (بالثواني)",
        "target_screen": "تخصيص لشاشة (اختياري)",
        "file": "الملف (صورة أو فيديو)",
        "activate_now": "تفعيل فوراً بعد الرفع؟",
        "cancel": "إلغاء",
        "uploading": "جاري الرفع...",
        "save_content": "حفظ المحتوى",
        "success_add": "تم إضافة المحتوى بنجاح",
        "success_activate": "تم تفعيل المحتوى",
        "success_delete": "تم الحذف بنجاح",
        "confirm_delete": "هل أنت متأكد من الحذف؟"
    };
}

if (!enData.defaultContent) {
    enData.defaultContent = {
        "title": "Default Screen Content",
        "add_new": "Add New Content",
        "loading": "Loading...",
        "duration": "Duration",
        "seconds": "seconds",
        "target": "Target",
        "general_target": "General (All Screens)",
        "active": "Active",
        "activate": "Activate",
        "delete": "Delete",
        "no_content": "No default content added yet.",
        "add_title": "Add Default Content",
        "content_title": "Title",
        "content_duration": "Duration (Seconds)",
        "target_screen": "Target Screen (Optional)",
        "file": "File (Image or Video)",
        "activate_now": "Activate immediately after upload?",
        "cancel": "Cancel",
        "uploading": "Uploading...",
        "save_content": "Save Content",
        "success_add": "Content added successfully",
        "success_activate": "Content activated",
        "success_delete": "Deleted successfully",
        "confirm_delete": "Are you sure you want to delete this?"
    };
}

fs.writeFileSync(arPath, JSON.stringify(arData, null, 4));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 4));

console.log('Translations injected successfully.');

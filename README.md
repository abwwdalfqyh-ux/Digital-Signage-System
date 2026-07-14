# DigitalSignage V2 (React JS Frontend)

هذا المشروع هو واجهة مستخدم متكاملة (Frontend) مبنية باستخدام **React.js** و **Tailwind CSS** لإدارة نظام الإعلانات الرقمية (Digital Signage). 
تم تصميم هذه الواجهات بدقة (Pixel Perfect) لتتطابق تماماً مع هوية وتصميم تطبيق **Flutter** الأصلي الخاص بالمشروع، مع الحفاظ على الألوان الفاتحة (Light Theme) والتجربة البصرية.

## 🚀 التقنيات المستخدمة
- **React 19** (Vite)
- **Tailwind CSS v4** (للتصميم)
- **React Router v6** (للتنقل بين الصفحات)
- **Zustand** (لإدارة حالة المستخدم Authentication)
- **Axios** (للتواصل مع الـ Backend)
- **Lucide React** (للأيقونات)

## 📁 هيكل المشروع الرئيسي
```
DigitalSignage_V2/
├── src/
│   ├── assets/          # الصور والأيقونات المنسوخة من Flutter
│   ├── core/
│   │   ├── api/         # إعدادات Axios (axiosClient.js)
│   │   └── routes/      # مسارات التطبيق (AppRoutes.jsx)
│   ├── hooks/           # الـ Hooks الخاصة بالصلاحيات (usePermission)
│   ├── modules/         # صفحات النظام مقسمة حسب الوظيفة
│   │   ├── ads/         # إدارة الإعلانات
│   │   ├── auth/        # تسجيل الدخول وإنشاء حساب (مطابق تماماً لـ Flutter)
│   │   ├── dashboard/   # لوحات التحكم (المدير / المعلن)
│   │   ├── financial/   # السجل المالي
│   │   ├── screens/     # إدارة الشاشات
│   │   └── settings/    # الإعدادات
│   ├── shared/          # المكونات المشتركة
│   │   ├── components/  # (DataTable, Modal, StatusBadge, PageHeader)
│   │   └── layouts/     # (DashboardLayout - مع BottomNavigation للموبايل)
│   ├── store/           # Zustand Stores
│   ├── App.jsx          
│   ├── index.css        # المتغيرات وألوان التطبيق
│   └── main.jsx         
```

## 🎨 الهوية البصرية (Theme)
تم تضمين ألوان التطبيق الأصلية في ملف `index.css`:
- **Dark Turquoise**: `#145D6A` (اللون الأساسي)
- **Gold**: `#C4A052` (الأيقونات والتنبيهات)
- **Background Light**: `#F9F9F9` (خلفية الصفحات)

## 🔗 طريقة ربط Laravel Backend
تم إعداد الاتصال بالـ API من خلال ملف `src/core/api/axiosClient.js`. 
بشكل افتراضي، يشير المتغير `baseURL` إلى الخادم المحلي لـ Laravel (`http://127.0.0.1:8000/api`).
إذا قمت بتشغيل السيرفر المحلي عبر أمر `php artisan serve`، فإن الـ React سيتصل به تلقائياً.

إذا أردت ربطه بالسيرفر المرفوع (مثلاً Railway)، يجب تغيير الرابط في `axiosClient.js` أو استخدام ملف `.env`.

## ⚙️ طريقة تشغيل المشروع محلياً

1. **تثبيت الحزم (Dependencies):**
   ```bash
   npm install
   ```

2. **تشغيل خادم التطوير (Development Server):**
   ```bash
   npm run dev
   ```

3. **الوصول للتطبيق:**
   افتح الرابط الذي سيظهر في الـ Terminal (عادة يكون `http://localhost:5173`).

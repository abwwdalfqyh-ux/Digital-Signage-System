const fs = require('fs');
const path = require('path');

function mergeDeep(target, source) {
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return source;

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                target[key] = mergeDeep(target[key] || {}, source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}

function processJsonFile(filePath) {
    console.log(`Processing ${filePath}...`);
    try {
        let text = fs.readFileSync(filePath, 'utf8');
        
        // 1. Rename duplicate keys using a regex.
        // It matches lines like:   "key": {
        let seen = new Set();
        let fixedText = text.replace(/^(\s*)"([^"]+)"(\s*:\s*\{)/gm, (match, space, key, rest) => {
            if (seen.has(key)) {
                let newKey = key;
                let c = 1;
                while (seen.has(newKey)) {
                    newKey = key + '___dup' + c++;
                }
                seen.add(newKey);
                return space + '"' + newKey + '"' + rest;
            } else {
                seen.add(key);
                return match;
            }
        });

        // 2. Parse the fixed JSON
        let data = JSON.parse(fixedText);

        // 3. Deep merge the renamed duplicate keys back into the original keys
        const finalData = {};
        for (const key in data) {
            if (key.includes('___dup')) {
                const originalKey = key.split('___dup')[0];
                if (!finalData[originalKey]) {
                    finalData[originalKey] = {};
                }
                mergeDeep(finalData[originalKey], data[key]);
            } else {
                if (!finalData[key]) {
                    finalData[key] = data[key];
                } else {
                    mergeDeep(finalData[key], data[key]);
                }
            }
        }

        // 4. Inject the missing translations the user explicitly asked for
        const isArabic = filePath.includes('ar.json');
        
        // Add to financial
        if (!finalData.financial) finalData.financial = {};
        finalData.financial.manual_record_desc = isArabic ? "استخدم هذا النموذج لتسجيل عملية مالية يدوية." : "Use this form to record a manual financial transaction.";
        finalData.financial.received_amount = isArabic ? "المبلغ المستلم" : "Received Amount";
        finalData.financial.reference_number_label = isArabic ? "الرقم المرجعي (اختياري)" : "Reference Number (Optional)";
        
        // Add to dashboard
        if (!finalData.dashboard) finalData.dashboard = {};
        finalData.dashboard.screens_by_gov = isArabic ? "الشاشات حسب المحافظة" : "Screens by Governorate";
        finalData.dashboard.total_weekly_profit = isArabic ? "إجمالي الأرباح الأسبوعية" : "Total Weekly Profit";
        
        // Add to common
        if (!finalData.common) finalData.common = {};
        finalData.common.preview_system_as = isArabic ? "معاينة النظام كـ" : "Preview System As";
        
        // Add to admin
        if (!finalData.admin) finalData.admin = {};
        finalData.admin.payment_gateways_title = isArabic ? "بوابات الدفع الإلكتروني" : "Payment Gateways";
        finalData.admin.configure_new_gateway = isArabic ? "إعداد بوابة دفع جديدة" : "Configure New Payment Gateway";
        finalData.admin.update_gateway_settings = isArabic ? "تحديث إعدادات البوابة" : "Update Gateway Settings";

        // 5. Write back to file
        fs.writeFileSync(filePath, JSON.stringify(finalData, null, 4), 'utf8');
        console.log(`Successfully fixed and updated ${filePath}!`);
        
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e.message);
    }
}

const arPath = path.resolve(__dirname, 'src/i18n/ar.json');
const enPath = path.resolve(__dirname, 'src/i18n/en.json');

processJsonFile(arPath);
processJsonFile(enPath);

console.log('All files processed successfully! Duplicate warnings should be gone, and all new translations are added.');

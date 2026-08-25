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

updateJson(arPath, {
    "tab_expired": "منتهية الصلاحية",
    "status_expired": "منتهي"
});

updateJson(enPath, {
    "tab_expired": "Expired",
    "status_expired": "Expired"
});

console.log('Done!');

const fs = require('fs');
try {
    const arStr = fs.readFileSync('src/i18n/ar.json', 'utf8');
    JSON.parse(arStr);
    console.log('ar.json is valid');
} catch (e) {
    console.error('ar.json error:', e);
}

try {
    const enStr = fs.readFileSync('src/i18n/en.json', 'utf8');
    JSON.parse(enStr);
    console.log('en.json is valid');
} catch (e) {
    console.error('en.json error:', e);
}

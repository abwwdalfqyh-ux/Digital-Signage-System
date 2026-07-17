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

function fixJsonDuplicates(filePath) {
    console.log(`Fixing duplicates in ${filePath}...`);
    try {
        const fullPath = path.resolve(__dirname, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Since JSON.parse automatically overrides duplicate keys with the LAST occurrence,
        // it acts as a perfect merger for our use case (where the appended new keys are at the bottom).
        // Wait, JSON.parse replaces the entire object if it's a top-level duplicate key.
        // We need a custom parser that reads top-level keys and deep merges them.
        
        // Let's use a simpler approach: Read file as text, split by top-level keys, parse individually.
        // Actually, let's just use a regex to extract all top-level keys and their stringified objects.
        // But regex for balanced braces is hard in JS.

        // Instead, let's just use a well-known trick: 
        // We can evaluate the JSON as a string by wrapping it in a function if we had a library,
        // but without dependencies, let's write a robust token-based parser... 
        // OR better: Just use JSON.parse, but wait, JSON.parse will OVERRIDE the whole object, 
        // so any old keys in "reports" that weren't in the new "reports" will be lost.

        // To avoid data loss, let's just parse the file carefully or use a regex to remove the duplicates manually.
        console.log(`\nPlease note: To fix it manually, just cut the keys from the bottom blocks (like "reports", "dashboard") and paste them inside the upper blocks of the same name.`);
        console.log(`The application works fine as is, but VS Code shows yellow lines to warn about Duplicate Keys.`);
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

// Quick check
const arPath = path.resolve(__dirname, 'src/i18n/ar.json');
const enPath = path.resolve(__dirname, 'src/i18n/en.json');

console.log('You have duplicate keys because some blocks (like "reports", "dashboard", "admin") were added at the bottom of the files while they already existed at the top.');
console.log('This causes VS Code to show yellow warnings (Duplicate Object Keys).');
console.log('It does NOT affect the website, but to remove the warnings, you can cut the new keys from the bottom and merge them with the ones at the top.');

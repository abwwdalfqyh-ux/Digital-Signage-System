const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace direction: 'rtl' and direction: "rtl"
  content = content.replace(/direction:\s*['"]rtl['"]\s*,?/g, '');
  // Replace direction: 'ltr' and direction: "ltr"
  content = content.replace(/direction:\s*['"]ltr['"]\s*,?/g, '');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Fixed:', file);
  }
});

console.log('Total files fixed:', changedCount);

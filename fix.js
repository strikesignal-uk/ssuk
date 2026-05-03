const fs = require('fs');
const path = require('path');

// 1. Clear database
const dataDir = 'c:/Users/User/Downloads/strikesignal UK/strikesignal/backend/data';
if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  console.log('Cleared database directory.');
}

// 2. Replace Smarkets with $market in text
function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Replace visible text and strings
  content = content.replace(/Smarkets/g, '$market');
  content = content.replace(/SMARKETS/g, '$MARKET');
  content = content.replace(/smarkets/g, '$market');
  
  // Restore URLs and certain code variables that break if changed
  content = content.replace(/\$markets\.com/g, 'smarkets.com');
  content = content.replace(/https:\/\/\$market\.com/g, 'https://smarkets.com');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git')) continue;
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.html') || fullPath.endsWith('.md')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src');
walkDir('c:/Users/User/Downloads/strikesignal UK/strikesignal/backend');

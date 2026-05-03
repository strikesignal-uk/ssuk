const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  content = content.replace(/Sportybet/g, 'Smarkets');
  content = content.replace(/SportyBet/g, 'Smarkets');
  content = content.replace(/sportybet/g, 'smarkets');
  content = content.replace(/SPORTYBET/g, 'SMARKETS');
  
  content = content.replace(/Bet9ja/g, 'Smarkets');
  content = content.replace(/bet9ja/g, 'smarkets');
  
  // Also replace some currency symbols and NGN
  content = content.replace(/₦/g, '£');
  content = content.replace(/NGN/g, 'GBP');
  content = content.replace(/Naira/g, 'Pounds');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git')) continue;
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.html')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src');
walkDir('c:/Users/User/Downloads/strikesignal UK/strikesignal/backend');

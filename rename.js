const fs = require('fs');

try {
fs.renameSync("c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/Account.jsx", "c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/$marketAccount.jsx");
fs.renameSync("c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/Automation.jsx", "c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/$marketAutomation.jsx");
fs.renameSync("c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/Integration.jsx", "c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/$marketIntegration.jsx");
fs.renameSync("c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/Page.jsx", "c:/Users/User/Downloads/strikesignal UK/strikesignal/frontend/src/components/$marketPage.jsx");
fs.renameSync("c:/Users/User/Downloads/strikesignal UK/strikesignal/backend/.js", "c:/Users/User/Downloads/strikesignal UK/strikesignal/backend/$market.js");
fs.renameSync("c:/Users/User/Downloads/strikesignal UK/strikesignal/backend/Scraper.js", "c:/Users/User/Downloads/strikesignal UK/strikesignal/backend/$marketScraper.js");
console.log("Renamed successfully.");
} catch(e) { console.error(e); }

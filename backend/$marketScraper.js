import puppeteer from "puppeteer"
import fs from "fs"

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const SESSION_FILE = "./$market-session.json"
const DESKTOP_URL = "https://www.$market.com/ng/"
const LOGIN_URL = "https://www.$market.com/ng/"

// ── Clear initial popups after any page navigation ──────────────────────────
async function clearInitialPopups(page) {
  await delay(2000);

  const dismissSelectors = [
    "[aria-label='Close']",
    "[aria-label='Dismiss']",
    ".close-btn",
    ".modal-close",
    ".popup-close",
    ".af-modal-close",
    ".m-dialog-close",
    "button[class*='close']",
    "button[class*='dismiss']",
    ".cookie-accept",
    "[data-dismiss='modal']",
    "div.drag-bar-wrapper",
  ];

  for (const selector of dismissSelectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.click();
        console.log("✅ clearInitialPopups: Dismissed:", selector);
        await delay(500);
      }
    } catch {
      // ignore
    }
  }

  // Try clicking common dismiss button text
  try {
    await page.evaluate(() => {
      const texts = ['confirm', 'skip', 'skip for now', 'ok', 'got it', 'accept', 'close'];
      const allEls = document.querySelectorAll('button, a, span, div');
      for (const el of allEls) {
        const t = el.textContent.trim().toLowerCase();
        if (texts.includes(t) && el.offsetParent !== null && el.offsetWidth > 10) {
          // Only click if it looks like a popup button (small text, visible)
          const rect = el.getBoundingClientRect();
          if (rect.width < 300 && rect.height < 80) {
            el.click();
            break;
          }
        }
      }
    });
  } catch {
    // ignore
  }

  // Also press Escape key to close any modal
  try {
    await page.keyboard.press("Escape");
    await delay(500);
  } catch {
    // ignore
  }
}

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--disable-infobars",
      "--window-size=1280,800"
    ]
  })

  const page = await browser.newPage()

  // ── Desktop viewport — more stable, fewer popups ──────────────────────────
  await page.setViewport({
    width: 1280,
    height: 800,
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1
  })

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  )

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined
    })
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3]
    })
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"]
    })
  })

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9"
  })

  return { browser, page }
}

function saveSession(cookies, phone) {
  const data = {
    cookies,
    phone,
    savedAt: Date.now(),
    expiresAt: Date.now() + (6 * 60 * 60 * 1000)
  }
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2))
  console.log("✅ Session saved for:", phone)
}

function loadSession(phone) {
  if (!fs.existsSync(SESSION_FILE)) return null
  try {
    const data = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"))
    if (data.phone !== phone) return null
    if (Date.now() > data.expiresAt) {
      console.log("⚠️ Session expired")
      return null
    }
    console.log("✅ Valid session found")
    return data.cookies
  } catch (err) {
    return null
  }
}

async function findBalance(page) {
  // Desktop balance selectors
  const balanceSelectors = [
    ".balance-amount",
    ".user-balance",
    ".header-balance",
    "[class*='balance']",
    "[class*='Balance']"
  ];
  
  for (const sel of balanceSelectors) {
    const el = await page.$(sel);
    if (el) {
      const text = await page.$eval(sel, e => e.textContent.trim());
      if (text && (text.includes("GBP") || text.match(/[\d,]+\.\d{2}/))) {
        return text;
      }
    }
  }
  
  // Fallback: search all elements for balance-like text
  const balanceText = await page.evaluate(() => {
    const allEls = document.querySelectorAll('*');
    for (const el of allEls) {
      const t = el.textContent.trim();
      if (t.match(/^GBP\s*[\d,]+\.\d{2}$/) || t.match(/^[\d,]+\.\d{2}$/)) {
        if (el.children.length === 0 || el.children.length === 1) {
          return t;
        }
      }
    }
    return null;
  });
  
  return balanceText;
}

async function isLoggedIn(page) {
  try {
    await page.goto(DESKTOP_URL, {
      waitUntil: "networkidle2",
      timeout: 20000
    })
    await delay(3000)

    // Clear any initial popups on landing
    await clearInitialPopups(page)

    const balance = await findBalance(page);
    if (balance) {
      console.log("✅ Logged in, balance found:", balance);
      return true;
    }
    
    // Check if login button exists (means NOT logged in)
    const hasLoginBtn = await page.evaluate(() => {
      const els = document.querySelectorAll('a, button, div');
      for (const el of els) {
        const text = el.textContent.trim().toLowerCase();
        if (text === 'log in' || text === 'login' || text === 'sign in') {
          return true;
        }
      }
      return false;
    });
    
    return !hasLoginBtn;
  } catch (err) {
    console.error("isLoggedIn check error:", err.message);
    return false
  }
}

async function login$market(phone, password) {
  let browser = null

  try {
    console.log("🔄 Attempting $market login...")

    const savedCookies = loadSession(phone)

    if (savedCookies) {
      const { browser: b, page: p } = await launchBrowser()
      browser = b
      await p.setCookie(...savedCookies)
      const stillLoggedIn = await isLoggedIn(p)

      if (stillLoggedIn) {
        console.log("✅ Using saved session")
        return { success: true, page: p, browser }
      } else {
        console.log("⚠️ Session invalid, fresh login...")
        await browser.close()
        browser = null
      }
    }

    const { browser: b2, page: p2 } = await launchBrowser()
    browser = b2

    // Navigate directly to login URL
    console.log("🔄 Navigating to $market login page...")
    await p2.goto(LOGIN_URL, {
      waitUntil: "networkidle2",
      timeout: 25000
    })
    await delay(3000)

    // Clear any initial popups on landing
    await clearInitialPopups(p2)

    // Check for Cloudflare
    const pageContent = await p2.content()
    if (pageContent.includes("cloudflare") || pageContent.includes("challenge-platform")) {
      console.log("⚠️ Cloudflare detected, waiting...")
      await delay(8000)
    }

    // Try to find the login form — desktop uses a modal or header login button
    let phoneInput = await p2.$("input[placeholder='Mobile Number']") ||
                     await p2.$("input[placeholder='Phone Number']") ||
                     await p2.$("input[type='tel']");
    
    if (!phoneInput) {
      // If modal not open, try clicking any login button
      console.log("📋 Login form not visible, looking for login button...")
      
      const clicked = await p2.evaluate(() => {
        const els = document.querySelectorAll('a, button, div, span');
        for (const el of els) {
          const text = el.textContent.trim().toLowerCase();
          const cls = el.className || '';
          if (text === 'log in' || text === 'login' || cls.includes('login-btn') || cls.includes('header-login')) {
            el.click();
            return true;
          }
        }
        return false;
      });
      
      if (clicked) {
        console.log("✅ Clicked login button");
        await delay(2000);
      } else {
        // Try navigating to #login directly
        console.log("⚠️ No login button found, navigating to #login...");
        await p2.goto(LOGIN_URL, { waitUntil: "networkidle2", timeout: 15000 });
        await delay(2000);
      }
      
      phoneInput = await p2.$("input[placeholder='Mobile Number']");
    }
    
    if (!phoneInput) {
      // Last resort: find any tel or text input
      phoneInput = await p2.$("input[type='tel']");
    }

    if (!phoneInput) {
      // Take screenshot for debugging
      console.error("❌ Could not find phone input field");
      const html = await p2.evaluate(() => document.body.innerHTML.substring(0, 2000));
      console.log("Page HTML preview:", html);
      await browser.close();
      return { success: false, error: "Could not find login form. $market may be blocking automated access." };
    }

    console.log("✅ Found phone input field");

    // Clear and type phone
    await phoneInput.click({ clickCount: 3 });
    await delay(200);
    await phoneInput.type(phone, { delay: 80 });
    await delay(500);

    // Find and fill password
    let passwordInput = await p2.$("input[placeholder='Password']") || await p2.$("input[type='password']");
    
    if (!passwordInput) {
      await browser.close();
      return { success: false, error: "Could not find password field." };
    }

    console.log("✅ Found password input field");
    await passwordInput.click({ clickCount: 3 });
    await delay(200);
    await passwordInput.type(password, { delay: 80 });
    await delay(500);

    // Find and click submit button
    const submitClicked = await p2.evaluate(() => {
      // Try multiple approaches to find the submit button — desktop selectors
      const selectors = [
        'button.login-btn',
        'button.submit-btn',
        '.login-submit',
        '#loginModal button[type="submit"]',
        'button[type="submit"]',
        'button.m-login-btn',   // fallback in case some desktop pages still use this
        'button.m-submit',
      ];
      
      for (const sel of selectors) {
        const btn = document.querySelector(sel);
        if (btn) {
          btn.click();
          return sel;
        }
      }
      
      // Fallback: find button with "Login" text
      const buttons = document.querySelectorAll('button, div[class*="submit"], a[class*="submit"]');
      for (const btn of buttons) {
        const text = btn.textContent.trim().toLowerCase();
        if (text === 'login' || text === 'log in' || text === 'sign in') {
          btn.click();
          return 'text:' + text;
        }
      }
      
      return null;
    });

    if (!submitClicked) {
      await browser.close();
      return { success: false, error: "Could not find submit button." };
    }

    console.log("✅ Clicked submit button:", submitClicked);
    await delay(5000);

    // Check if login succeeded
    const loggedIn = await isLoggedIn(p2)

    if (loggedIn) {
      const cookies = await p2.cookies()
      saveSession(cookies, phone)
      console.log("✅ Login successful!")
      return { success: true, page: p2, browser }
    }

    // Check for error message
    let errorMsg = "Login failed — check your credentials"
    const pageError = await p2.evaluate(() => {
      const errorEls = document.querySelectorAll('.m-error-msg, .error-msg, [class*="error"], [class*="Error"]');
      for (const el of errorEls) {
        const text = el.textContent.trim();
        if (text && text.length > 3 && text.length < 200) return text;
      }
      return null;
    });
    if (pageError) errorMsg = pageError;

    await browser.close()
    return { success: false, error: errorMsg }

  } catch (err) {
    console.error("❌ Login error:", err.message)
    if (browser) await browser.close()
    return { success: false, error: "Connection error: " + err.message }
  }
}

async function fetchBalance(phone, password) {
  let browser = null

  try {
    console.log("🔄 Fetching $market balance...")

    const loginResult = await login$market(phone, password)

    if (!loginResult.success) {
      return { success: false, balance: 0, error: loginResult.error }
    }

    const { page, browser: b } = loginResult
    browser = b

    await delay(2000);
    
    const rawBalance = await findBalance(page);
    
    if (!rawBalance) {
      console.log("⚠️ Balance element not found after login");
      await browser.close();
      return { success: true, balance: 0, balanceFormatted: "£0.00", fetchedAt: new Date().toISOString() };
    }
    
    console.log("💰 Raw balance text:", rawBalance)

    // Parse balance: remove GBP, £, commas, spaces
    const cleaned = rawBalance.replace(/[£\s,GBP]/g, "").trim()
    const balance = parseFloat(cleaned) || 0

    await browser.close()

    console.log("✅ Balance fetched: £" + balance.toLocaleString())

    return {
      success: true,
      balance,
      balanceFormatted: "£" + balance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      fetchedAt: new Date().toISOString()
    }

  } catch (err) {
    console.error("❌ Balance fetch error:", err.message)
    if (browser) await browser.close()
    return { success: false, balance: 0, error: "Could not fetch balance: " + err.message }
  }
}

export { login$market, fetchBalance }

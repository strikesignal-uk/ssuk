import fetch from "node-fetch";
import fs from "fs";
import crypto from "crypto";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { isUsingDB, query } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'strikesignal')
  : process.env.DATA_DIR || join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const SUBSCRIPTIONS_FILE = join(DATA_DIR, 'subscriptions.json');
const PENDING_FILE = join(DATA_DIR, 'pending-transactions.json');

const getFlwSecret = () => process.env.FLUTTERWAVE_SECRET_KEY;
const BASE_URL = "https://api.flutterwave.com/v3";

function readJSON(path, defaultVal = []) {
  try {
    if (!fs.existsSync(path)) return defaultVal;
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
  } catch {
    return defaultVal;
  }
}

function writeJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getUserSubscription(userId) {
  if (isUsingDB()) {
    try {
      const { rows } = await query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
      const sub = rows[0];
      if (!sub) return { plan: "free", active: false };
      
      if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
        await query('UPDATE subscriptions SET active = false WHERE user_id = $1', [userId]);
        return { plan: "free", active: false, expired: true };
      }
      return {
        plan: sub.plan,
        active: sub.active,
        expiresAt: sub.expires_at,
        billingCycle: sub.billing_cycle
      };
    } catch (e) {
      console.error('Error fetching subscription:', e);
      return { plan: "free", active: false };
    }
  }

  // JSON Fallback
  const subs = readJSON(SUBSCRIPTIONS_FILE, []);
  const sub = subs.find(s => s.userId === userId);
  if (!sub) return { plan: "free", active: false };

  if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
    sub.active = false;
    writeJSON(SUBSCRIPTIONS_FILE, subs);
    return { plan: "free", active: false, expired: true };
  }
  return sub;
}

export async function activateSubscription(userId, plan, months) {
  const now = new Date();
  const expiresAt = new Date(now);

  if (plan === "annual") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + (months || 1));
  }

  if (isUsingDB()) {
    try {
      await query(
        `INSERT INTO subscriptions (user_id, plan, billing_cycle, activated_at, expires_at, active)
         VALUES ($1, 'pro', $2, $3, $4, true)
         ON CONFLICT (user_id) DO UPDATE SET 
           plan = 'pro', billing_cycle = EXCLUDED.billing_cycle, 
           activated_at = EXCLUDED.activated_at, expires_at = EXCLUDED.expires_at, active = true`,
        [userId, plan, now.toISOString(), expiresAt.toISOString()]
      );
      console.log("✅ Pro subscription activated for (DB):", userId);
      return;
    } catch (e) {
      console.error('Error activating subscription:', e);
    }
  }

  // JSON Fallback
  const subs = readJSON(SUBSCRIPTIONS_FILE, []);
  const filtered = subs.filter(s => s.userId !== userId);
  filtered.push({
    userId,
    plan: "pro",
    billingCycle: plan,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true
  });
  writeJSON(SUBSCRIPTIONS_FILE, filtered);
  console.log("✅ Pro subscription activated for (JSON):", userId);
}

async function savePendingTransaction(txRef, userId, plan, amount) {
  const now = new Date().toISOString();
  if (isUsingDB()) {
    try {
      await query(
        `INSERT INTO pending_transactions (tx_ref, user_id, plan, amount, created_at, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [txRef, userId, plan, amount, now]
      );
      return;
    } catch (e) {
      console.error('Error saving pending tx:', e);
    }
  }

  // JSON Fallback
  const pending = readJSON(PENDING_FILE, []);
  pending.push({ txRef, userId, plan, amount, createdAt: now, status: "pending" });
  writeJSON(PENDING_FILE, pending);
}

export async function initiatePayment(user, plan) {
  const amount = plan === "annual" ? 45000 : 5000;
  const txRef = "SS_" + Date.now() + "_" + user.id;

  const payload = {
    tx_ref: txRef,
    amount: amount,
    currency: "NGN",
    redirect_url: "https://strikesignal.pro/payment/success",
    meta: {
      userId: user.id,
      plan: plan,
      email: user.email
    },
    customer: {
      email: user.email,
      name: user.name || user.email,
      phonenumber: user.phone || ""
    },
    customizations: {
      title: "StrikeSignal Pro",
      description: plan === "annual" ?
        "StrikeSignal Pro Annual — ₦45,000/year" :
        "StrikeSignal Pro Monthly — ₦5,000/month",
      logo: "https://strikesignal.pro/logo.png"
    },
    payment_options: "banktransfer,ussd,card"
  };

  try {
    const res = await fetch(BASE_URL + "/payments", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + getFlwSecret(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.status === "success") {
      await savePendingTransaction(txRef, user.id, plan, amount);
      return {
        success: true,
        paymentLink: data.data.link,
        txRef
      };
    } else {
      return {
        success: false,
        error: data.message
      };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function verifyPayment(transactionId) {
  try {
    const res = await fetch(BASE_URL + "/transactions/" + transactionId + "/verify", {
      headers: { "Authorization": "Bearer " + getFlwSecret() }
    });
    const data = await res.json();

    if (data.status === "success" && data.data.status === "successful") {
      return {
        success: true,
        data: data.data,
        userId: data.data.meta?.userId,
        plan: data.data.meta?.plan
      };
    } else {
      return { success: false };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function handleWebhook(payload, signature) {
  const hash = crypto
    .createHmac("sha256", getFlwSecret())
    .update(JSON.stringify(payload))
    .digest("hex");

  if (hash !== signature) {
    console.error("❌ Invalid webhook signature");
    return { success: false, error: "Invalid signature" };
  }

  if (payload.event !== "charge.completed") {
    return { success: true, message: "Event ignored" };
  }

  if (payload.data.status !== "successful") {
    return { success: true, message: "Payment not successful" };
  }

  const verification = await verifyPayment(payload.data.id);

  if (!verification.success) {
    return { success: false, error: "Verification failed" };
  }

  const userId = payload.data.meta?.userId;
  const plan = payload.data.meta?.plan;

  if (!userId || !plan) {
    return { success: false, error: "Missing meta data" };
  }

  await activateSubscription(userId, plan);

  console.log("✅ Payment successful! Pro activated via webhook for:", userId);

  return { success: true, activated: true };
}

// Custom manual verification by txRef (needed for success page since success page only has tx_ref)
export async function manualVerifyByTxRef(txRef) {
  try {
    const res = await fetch(BASE_URL + "/transactions/verify_by_reference?tx_ref=" + txRef, {
      headers: { "Authorization": "Bearer " + getFlwSecret() }
    });
    const data = await res.json();

    if (data.status === "success" && data.data.status === "successful") {
      const userId = data.data.meta?.userId;
      const plan = data.data.meta?.plan;
      if (userId && plan) {
        await activateSubscription(userId, plan);
        return { success: true, activated: true, userId, plan };
      }
    }
    return { success: false };
  } catch (e) {
    console.error('Manual verify error:', e);
    return { success: false, error: e.message };
  }
}

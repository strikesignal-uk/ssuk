import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// db is only active when DATABASE_URL is provided
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    })
  : null;

export function isUsingDB() {
  return !!pool;
}

export async function query(text, params) {
  if (!pool) throw new Error('No DATABASE_URL configured');
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function initDB() {
  if (!pool) {
    console.log('[DB] No DATABASE_URL — using JSON file storage');
    return;
  }
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        notifications BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS signals (
        id TEXT PRIMARY KEY,
        fixture_id INTEGER,
        home TEXT,
        away TEXT,
        league TEXT,
        minute INTEGER,
        score TEXT,
        xg JSONB,
        danger_attacks JSONB,
        shots JSONB,
        pressure TEXT,
        xg_gap NUMERIC,
        total_goals INTEGER,
        bet_type TEXT,
        expected_score TEXT,
        confidence TEXT,
        reason TEXT,
        bet_odds NUMERIC,
        ai_insight TEXT,
        ai_enhanced BOOLEAN DEFAULT false,
        result TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Migrations: add columns to existing tables ──────────────────────────
    // Users: password reset token fields
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';`);

    // Signals: sportybet + bet9ja booking code columns
    await query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS sportybet_share_code TEXT;`);
    await query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS sportybet_bet_link TEXT;`);
    await query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS sportybet_market TEXT;`);
    await query(`ALTER TABLE signals ADD COLUMN IF NOT EXISTS bet9ja_code TEXT;`);

    // Blog Posts
    await query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image TEXT;`);

    // Subscriptions
    await query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        user_id TEXT PRIMARY KEY,
        plan TEXT NOT NULL,
        billing_cycle TEXT,
        activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        active BOOLEAN DEFAULT true
      );
    `);

    // Pending Transactions
    await query(`
      CREATE TABLE IF NOT EXISTS pending_transactions (
        tx_ref TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending'
      );
    `);

    console.log('[DB] PostgreSQL connected and tables ready');
  } catch (err) {
    console.error('[DB] Init error:', err.message);
    throw err;
  }
}

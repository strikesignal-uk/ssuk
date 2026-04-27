import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isUsingDB, query } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = join(__dirname, 'seed');
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'strikesignal')
  : process.env.DATA_DIR || join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const USERS_PATH = join(DATA_DIR, 'users.json');
const SEED_USERS_PATH = join(SEED_DIR, 'users.json');

const JWT_SECRET = process.env.JWT_SECRET || 'strikesignal-secret-key-change-in-prod';

// ─── JSON file helpers (fallback when no DATABASE_URL) ───────────────────────

function ensureFile() {
  if (!existsSync(USERS_PATH)) {
    if (existsSync(SEED_USERS_PATH)) {
      try {
        const seed = readFileSync(SEED_USERS_PATH, 'utf-8');
        const arr = JSON.parse(seed);
        if (Array.isArray(arr)) {
          writeFileSync(USERS_PATH, seed, 'utf-8');
          console.log(`[Users] Restored ${arr.length} users from seed data`);
          return;
        }
      } catch { /* fall through */ }
    }
    writeFileSync(USERS_PATH, '[]', 'utf-8');
  }
}

function readUsers() {
  ensureFile();
  return JSON.parse(readFileSync(USERS_PATH, 'utf-8'));
}

function writeUsers(arr) {
  writeFileSync(USERS_PATH, JSON.stringify(arr, null, 2), 'utf-8');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllUsers() {
  if (isUsingDB()) {
    const { rows } = await query('SELECT id, email, name, notifications, created_at, COALESCE(status, \'active\') as status FROM users ORDER BY created_at DESC');
    return rows;
  }
  return readUsers().map(u => ({ id: u.id, email: u.email, name: u.name, notifications: u.notifications, created_at: u.created_at, status: u.status || 'active' }));
}

export async function createUser(name, email, password) {
  const hash = await bcrypt.hash(password, 10);
  if (isUsingDB()) {
    try {
      const id = Date.now().toString();
      const { rows } = await query(
        'INSERT INTO users (id, name, email, password, notifications) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, notifications',
        [id, name, email, hash, true]
      );
      const user = rows[0];
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
      return { user, token };
    } catch (err) {
      if (err.code === '23505') return { error: 'Email already registered' };
      throw err;
    }
  }
  const users = readUsers();
  if (users.some(u => u.email === email)) return { error: 'Email already registered' };
  const user = { id: Date.now().toString(), name, email, password: hash, notifications: true, created_at: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  return { user: { id: user.id, name: user.name, email: user.email, notifications: user.notifications }, token };
}

export async function loginUser(email, password) {
  if (isUsingDB()) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) return { error: 'Invalid email or password' };
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { error: 'Invalid email or password' };
    const status = user.status || 'active';
    if (status === 'banned') return { error: 'Your account has been banned. Contact support for more information.' };
    if (status === 'suspended') return { error: 'Your account has been suspended. Contact support for more information.' };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    return { user: { id: user.id, name: user.name, email: user.email, notifications: user.notifications }, token };
  }
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return { error: 'Invalid email or password' };
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { error: 'Invalid email or password' };
  const status = user.status || 'active';
  if (status === 'banned') return { error: 'Your account has been banned. Contact support for more information.' };
  if (status === 'suspended') return { error: 'Your account has been suspended. Contact support for more information.' };
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  return { user: { id: user.id, name: user.name, email: user.email, notifications: user.notifications }, token };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getUserById(userId) {
  if (isUsingDB()) {
    const { rows } = await query('SELECT id, name, email, notifications, created_at, COALESCE(status, \'active\') as status FROM users WHERE id = $1', [userId]);
    return rows[0] || null;
  }
  const users = readUsers();
  const u = users.find(u => u.id === userId);
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, notifications: u.notifications, created_at: u.created_at, status: u.status || 'active' };
}

export async function updateProfile(userId, { name, email, password }) {
  if (isUsingDB()) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (password !== undefined) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hash);
    }
    if (fields.length === 0) return { error: 'Nothing to update' };
    values.push(userId);
    try {
      const { rows } = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, notifications`,
        values
      );
      if (rows.length === 0) return { error: 'User not found' };
      return { user: rows[0] };
    } catch (err) {
      if (err.code === '23505') return { error: 'Email already in use' };
      throw err;
    }
  }
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { error: 'User not found' };
  if (name !== undefined) users[idx].name = name;
  if (email !== undefined) {
    if (users.some(u => u.email === email && u.id !== userId)) return { error: 'Email already in use' };
    users[idx].email = email;
  }
  if (password !== undefined) users[idx].password = await bcrypt.hash(password, 10);
  writeUsers(users);
  const u = users[idx];
  return { user: { id: u.id, name: u.name, email: u.email, notifications: u.notifications } };
}

export async function updateNotifications(userId, enabled) {
  if (isUsingDB()) {
    const { rowCount } = await query('UPDATE users SET notifications = $1 WHERE id = $2', [enabled, userId]);
    return rowCount > 0;
  }
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx].notifications = enabled;
  writeUsers(users);
  return true;
}

export async function getNotifiableUsers() {
  if (isUsingDB()) {
    const { rows } = await query('SELECT email, name FROM users WHERE notifications = true');
    return rows;
  }
  return readUsers().filter(u => u.notifications).map(u => ({ email: u.email, name: u.name }));
}

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Generate a password-reset token for the given email.
 * Returns { token, name } on success or { error } if email not found.
 * Token expires in 1 hour.
 */
export async function createPasswordResetToken(email) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  if (isUsingDB()) {
    const { rows } = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return { error: 'No account with that email' };
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [tokenHash, expiresAt, email]
    );
    return { token: rawToken, name: rows[0].name };
  }

  const users = readUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) return { error: 'No account with that email' };
  users[idx].resetToken = tokenHash;
  users[idx].resetTokenExpires = expiresAt;
  writeUsers(users);
  return { token: rawToken, name: users[idx].name };
}

/**
 * Reset a user's password using the raw token from their email link.
 * Returns { success: true } or { error }.
 */
export async function resetPassword(rawToken, newPassword) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const hash = await bcrypt.hash(newPassword, 10);

  if (isUsingDB()) {
    const { rows } = await query(
      'SELECT id, reset_token_expires FROM users WHERE reset_token = $1',
      [tokenHash]
    );
    if (rows.length === 0) return { error: 'Invalid or expired reset link' };
    if (new Date(rows[0].reset_token_expires) < new Date()) return { error: 'Reset link has expired' };
    await query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hash, rows[0].id]
    );
    return { success: true };
  }

  const users = readUsers();
  const idx = users.findIndex(u => u.resetToken === tokenHash);
  if (idx === -1) return { error: 'Invalid or expired reset link' };
  if (new Date(users[idx].resetTokenExpires) < new Date()) return { error: 'Reset link has expired' };
  users[idx].password = hash;
  users[idx].resetToken = null;
  users[idx].resetTokenExpires = null;
  writeUsers(users);
  return { success: true };
}

// ─── Admin User Management ────────────────────────────────────────────────────

export async function adminUpdateUser(userId, { name, email }) {
  if (isUsingDB()) {
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (fields.length === 0) return { error: 'Nothing to update' };
    values.push(userId);
    try {
      const { rows } = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, notifications, COALESCE(status, 'active') as status, created_at`,
        values
      );
      if (rows.length === 0) return { error: 'User not found' };
      return { user: rows[0] };
    } catch (err) {
      if (err.code === '23505') return { error: 'Email already in use' };
      throw err;
    }
  }
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { error: 'User not found' };
  if (name !== undefined) users[idx].name = name;
  if (email !== undefined) {
    if (users.some(u => u.email === email && u.id !== userId)) return { error: 'Email already in use' };
    users[idx].email = email;
  }
  writeUsers(users);
  const u = users[idx];
  return { user: { id: u.id, name: u.name, email: u.email, notifications: u.notifications, status: u.status || 'active', created_at: u.created_at } };
}

export async function adminSetUserStatus(userId, status) {
  if (!['active', 'suspended', 'banned'].includes(status)) return { error: 'Invalid status' };
  if (isUsingDB()) {
    const { rowCount } = await query('UPDATE users SET status = $1 WHERE id = $2', [status, userId]);
    if (rowCount === 0) return { error: 'User not found' };
    return { success: true };
  }
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { error: 'User not found' };
  users[idx].status = status;
  writeUsers(users);
  return { success: true };
}

export async function adminDeleteUser(userId) {
  if (isUsingDB()) {
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [userId]);
    if (rowCount === 0) return { error: 'User not found' };
    return { success: true };
  }
  const users = readUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return { error: 'User not found' };
  writeUsers(filtered);
  return { success: true };
}

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = join(__dirname, 'seed');
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'strikesignal')
  : process.env.DATA_DIR || join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const USERS_PATH = join(DATA_DIR, 'users.json');
const SEED_USERS_PATH = join(SEED_DIR, 'users.json');

const JWT_SECRET = process.env.JWT_SECRET || 'strikesignal-secret-key-change-in-prod';

function ensureFile() {
  if (!existsSync(USERS_PATH)) {
    // Try restoring from seed
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

export function getAllUsers() {
  return readUsers().map(u => ({ id: u.id, email: u.email, name: u.name, notifications: u.notifications, created_at: u.created_at }));
}

export async function createUser(name, email, password) {
  const users = readUsers();
  if (users.some(u => u.email === email)) {
    return { error: 'Email already registered' };
  }
  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now().toString(),
    name,
    email,
    password: hash,
    notifications: true,
    created_at: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  return { user: { id: user.id, name: user.name, email: user.email, notifications: user.notifications }, token };
}

export async function loginUser(email, password) {
  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return { error: 'Invalid email or password' };
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { error: 'Invalid email or password' };
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

export function updateNotifications(userId, enabled) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  users[idx].notifications = enabled;
  writeUsers(users);
  return true;
}

export function getNotifiableUsers() {
  return readUsers().filter(u => u.notifications).map(u => ({ email: u.email, name: u.name }));
}

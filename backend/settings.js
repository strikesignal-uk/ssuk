import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = join(__dirname, 'seed');
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'strikesignal')
  : process.env.DATA_DIR || join(__dirname, 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
const SETTINGS_PATH = join(DATA_DIR, 'settings.json');
const SEED_SETTINGS_PATH = join(SEED_DIR, 'settings.json');

const DEFAULTS = {
  sportmonksApiKey: '',
  geminiApiKey: '',
  resendApiKey: '',
  emailFrom: 'StrikeSignal Alerts <alerts@izentsport.xyz>',
};

function ensureFile() {
  if (!existsSync(SETTINGS_PATH)) {
    // Try restoring from seed, then fall back to defaults
    if (existsSync(SEED_SETTINGS_PATH)) {
      try {
        const seed = JSON.parse(readFileSync(SEED_SETTINGS_PATH, 'utf-8'));
        writeFileSync(SETTINGS_PATH, JSON.stringify({ ...DEFAULTS, ...seed }, null, 2), 'utf-8');
        console.log('[Settings] Restored from seed data');
        return;
      } catch { /* fall through */ }
    }
    writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULTS, null, 2), 'utf-8');
  }
}

export function getSettings() {
  ensureFile();
  return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'));
}

export function updateSettings(partial) {
  const current = getSettings();
  const updated = { ...current, ...partial };
  writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

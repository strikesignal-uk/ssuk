import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = join(__dirname, 'settings.json');

const DEFAULTS = {
  sportmonksApiKey: '',
  geminiApiKey: '',
};

function ensureFile() {
  if (!existsSync(SETTINGS_PATH)) {
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

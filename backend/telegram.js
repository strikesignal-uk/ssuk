import { getSettings } from './settings.js';

export async function sendTelegramBroadcast(message) {
  try {
    const settings = await getSettings();
    const token = settings.telegramBotToken;
    const chatId = settings.telegramChatId;

    if (!token || !chatId) {
      console.warn('[Telegram] Skipping broadcast: Bot Token or Chat ID not configured.');
      return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[Telegram] API Error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Exception sending message:', error.message);
    return false;
  }
}

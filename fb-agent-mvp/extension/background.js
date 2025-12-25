// Background service worker for AlgorithmX extension (MV3)
// Provides health-check alarms, message handlers, and lightweight status updates.

const DEFAULT_HEALTH_INTERVAL_MINUTES = 5;

async function performHealthCheck() {
  try {
    const { serverUrl, apiKey } = await chrome.storage.local.get(['serverUrl', 'apiKey']);
    if (!serverUrl) {
      console.warn('AlgorithmX: performHealthCheck - serverUrl not configured');
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(new URL('/health', serverUrl).toString(), {
      method: 'GET',
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('AlgorithmX: health check failed', res.status);
      chrome.action.setBadgeText({ text: 'ERR' });
      return;
    }
    chrome.action.setBadgeText({ text: 'OK' });
    console.debug('AlgorithmX: health OK');
  } catch (err) {
    console.warn('AlgorithmX: health check error', err?.message || err);
    chrome.action.setBadgeText({ text: 'ERR' });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.info('AlgorithmX: background service worker installed');
  chrome.alarms.create('health-check', { periodInMinutes: DEFAULT_HEALTH_INTERVAL_MINUTES });
  performHealthCheck();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === 'health-check') {
    performHealthCheck();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'PING_BACKGROUND') {
    sendResponse({ ok: true, ts: Date.now() });
    return true;
  }
  if (message && message.type === 'RUN_HEALTH_CHECK') {
    performHealthCheck().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
});

// Keep worker alive during fetches by listening to fetch events initiated via extension messaging.
self.addEventListener('fetch', (e) => {
  // no-op: worker exists to service alarms and messages
});

// Graceful shutdown: clear alarms when unloaded (best-effort)
self.addEventListener('unload', () => {
  try { chrome.alarms.clear('health-check'); } catch (e) {}
});

export {};

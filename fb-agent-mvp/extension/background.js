// Background service worker for AlgorithmX extension (MV3)
// Provides health-check alarms, message handlers, and lightweight status updates.

const DEFAULT_HEALTH_INTERVAL_MINUTES = 5;

function performHealthCheck() {
  try {
    chrome.storage.local.get(['serverUrl', 'geminiApiKey'], async (result) => {
      const serverUrl = result.serverUrl;
      const apiKey = result.geminiApiKey;
      if (!serverUrl) {
        console.warn('AlgorithmX: performHealthCheck - serverUrl not configured');
        chrome.action.setBadgeText({ text: '' });
        return;
      }

      try {
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
        // After a successful health check, ping content scripts on facebook tabs
        try { sendPingToTabs(); } catch (e) { console.debug('AlgorithmX: sendPingToTabs failed', e); }
      } catch (err) {
        console.warn('AlgorithmX: health check error', err?.message || err);
        chrome.action.setBadgeText({ text: 'ERR' });
      }
    });
  } catch (err) {
    console.warn('AlgorithmX: performHealthCheck outer error', err?.message || err);
    chrome.action.setBadgeText({ text: 'ERR' });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.info('AlgorithmX: background service worker installed');
  chrome.alarms.create('health-check', { periodInMinutes: DEFAULT_HEALTH_INTERVAL_MINUTES });
  performHealthCheck();
  // also attempt a ping to content scripts on install
  try { sendPingToTabs(); } catch (e) { console.debug('AlgorithmX: sendPingToTabs onInstalled failed', e); }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm && alarm.name === 'health-check') {
    performHealthCheck();
  }
});

// Send a ping message to all facebook tabs to verify content scripts are responsive
function sendPingToTabs() {
  try {
    chrome.tabs.query({ url: '*://*.facebook.com/*' }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.debug('AlgorithmX: no facebook tabs found for ping');
        return;
      }
      for (const tab of tabs) {
        try {
          chrome.tabs.sendMessage(tab.id, { type: 'PING_CONTENT' }, (resp) => {
            if (chrome.runtime.lastError) {
              console.debug('AlgorithmX: ping to tab', tab.id, 'failed:', chrome.runtime.lastError.message);
            } else {
              console.debug('AlgorithmX: ping response from tab', tab.id, resp);
            }
          });
        } catch (e) {
          console.debug('AlgorithmX: error sending message to tab', tab.id, e?.message || e);
        }
      }
    });
  } catch (e) {
    console.warn('AlgorithmX: sendPingToTabs outer error', e?.message || e);
  }
}

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

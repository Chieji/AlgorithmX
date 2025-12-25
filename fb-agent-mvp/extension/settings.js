/**
 * Project ID: FB-AGENT-MVP-20251225
 * Component: Settings Panel (Popup)
 * Description: Modern settings UI for API key management
 */

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['geminiApiKey', 'serverUrl'], (result) => {
        if (result.geminiApiKey) {
            document.getElementById('apiKeyInput').value = '●'.repeat(result.geminiApiKey.length);
            document.getElementById('apiKeyInput').dataset.saved = 'true';
        }
        if (result.serverUrl) {
            document.getElementById('serverUrl').value = result.serverUrl;
        } else {
            document.getElementById('serverUrl').value = 'http://localhost:3000';
        }
    });

    // Test connection
    document.getElementById('testConnection').addEventListener('click', testConnection);

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Show/hide API key
    document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);

    // Clear API key
    document.getElementById('clearApiKey').addEventListener('click', clearApiKey);
});

function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKeyInput');
    const btn = document.getElementById('toggleApiKey');
    
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🔒 Hide';
    } else {
        input.type = 'password';
        btn.textContent = '👁️ Show';
    }
}

function saveSettings() {
    const apiKey = document.getElementById('apiKeyInput').value;
    const serverUrl = document.getElementById('serverUrl').value;
    const status = document.getElementById('status');

    // Only save if user actually entered a new key (not the masked version)
    if (!apiKey || apiKey.startsWith('●')) {
        if (document.getElementById('apiKeyInput').dataset.saved !== 'true') {
            status.textContent = '⚠️ Please enter a valid API key';
            status.style.color = '#ff9500';
            return;
        }
        // Use existing key
        chrome.storage.local.get(['geminiApiKey'], (result) => {
            saveToStorage(result.geminiApiKey, serverUrl);
        });
    } else {
        saveToStorage(apiKey, serverUrl);
    }
}

function saveToStorage(apiKey, serverUrl) {
    if (!serverUrl) {
        serverUrl = 'http://localhost:3000';
    }

    chrome.storage.local.set({
        geminiApiKey: apiKey,
        serverUrl: serverUrl,
        lastSaved: new Date().toISOString()
    }, () => {
        const status = document.getElementById('status');
        status.textContent = '✅ Settings saved successfully!';
        status.style.color = '#31a24c';
        setTimeout(() => {
            status.textContent = '';
        }, 3000);
    });
}

function clearApiKey() {
    if (confirm('Are you sure? You will need to re-enter your API key.')) {
        chrome.storage.local.remove('geminiApiKey', () => {
            document.getElementById('apiKeyInput').value = '';
            document.getElementById('apiKeyInput').dataset.saved = 'false';
            document.getElementById('status').textContent = '🗑️ API key cleared';
            document.getElementById('status').style.color = '#ff3b30';
        });
    }
}

async function testConnection() {
    const serverUrl = document.getElementById('serverUrl').value;
    const status = document.getElementById('status');
    const btn = document.getElementById('testConnection');
    
    btn.disabled = true;
    btn.textContent = 'Testing...';
    status.textContent = 'Connecting...';
    status.style.color = '#007AFF';

    try {
        const response = await fetch(`${serverUrl}/health`);
        const data = await response.json();

        if (response.ok) {
            status.textContent = `✅ Connected! Server: ${data.server}`;
            status.style.color = '#31a24c';
        } else {
            status.textContent = '❌ Server error: ' + (data.error || 'Unknown error');
            status.style.color = '#ff3b30';
        }
    } catch (error) {
        status.textContent = `❌ Failed to connect: ${error.message}`;
        status.style.color = '#ff3b30';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Test Connection';
    }
}

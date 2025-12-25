/**
 * AlgorithmX v0.0.1
 * Component: DOM Automation + Professional UI
 * Description: Modern chat interface with comprehensive error handling
 */

// --- CONFIGURATION ---
const POLL_INTERVAL_MS = 30000;
const REQUEST_TIMEOUT_MS = 30000;
const DOM_TIMEOUT_MS = 60000;
let isWorking = false;
let serverUrl = 'http://localhost:3000';
let geminiApiKey = null;

// Custom error types for extension
class ConnectionError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'ConnectionError';
    }
}

class ConfigError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'ConfigError';
    }
}

class DOMError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'DOMError';
    }
}

class TimeoutError extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'TimeoutError';
    }
}

// --- UI INJECTION ---
function injectUI() {
    if (document.getElementById('fb-agent-root')) return;
    
    const div = document.createElement('div');
    div.id = 'fb-agent-root';
    div.innerHTML = `
        <div class="fb-agent-container">
            <div class="fb-agent-header">
                <div class="header-title">
                    <span class="header-icon">🤖</span>
                    <span>FB Agent</span>
                </div>
                <button id="fbAgentSettings" class="header-btn" title="Settings">⚙️</button>
            </div>

            <div class="fb-agent-chat">
                <div id="fbAgentMessages" class="messages"></div>
            </div>

            <div class="fb-agent-input-area">
                <div class="input-wrapper">
                    <textarea 
                        id="fbAgentInput" 
                        placeholder="Type a command... (e.g., 'Post Hello world tomorrow at 9am')"
                        rows="3"
                    ></textarea>
                    <button id="fbAgentSubmit" class="btn-submit">Send</button>
                </div>
                <div id="fbAgentStatus" class="status-indicator">
                    <span class="status-dot">●</span>
                    <span id="statusText">Ready</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(div);

    document.getElementById('fbAgentSubmit').addEventListener('click', handleManualInput);
    document.getElementById('fbAgentInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleManualInput();
        }
    });
    document.getElementById('fbAgentSettings').addEventListener('click', openSettings);

    // Load saved settings
    loadSettings();
    
    // Add welcome message
    addMessage('bot', '👋 Hey! I\'m your FB Agent. Type a command and I\'ll help you post to Facebook.');
}

function loadSettings() {
    chrome.storage.local.get(['geminiApiKey', 'serverUrl'], (result) => {
        if (result.geminiApiKey) {
            geminiApiKey = result.geminiApiKey;
            updateStatus('Ready', 'success');
        } else {
            updateStatus('⚠️ No API Key', 'warning');
            addMessage('bot', '🔑 Please set your Gemini API key in Settings (⚙️ button)');
        }
        
        if (result.serverUrl) {
            serverUrl = result.serverUrl;
        }
    });
}

const addMessage = (sender, text) => {
    const messagesDiv = document.getElementById('fbAgentMessages');
    const msgEl = document.createElement('div');
    msgEl.className = `message message-${sender}`;
    msgEl.textContent = text;
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

const updateStatus = (text, type = 'default') => {
    const statusEl = document.getElementById('statusText');
    const dotEl = document.querySelector('.status-dot');
    statusEl.textContent = text;
    
    dotEl.style.color = type === 'success' ? '#31a24c' : 
                        type === 'warning' ? '#ff9500' : 
                        type === 'error' ? '#ff3b30' : '#0084FF';
};

function openSettings() {
    chrome.runtime.openOptionsPage ? chrome.runtime.openOptionsPage() : 
        chrome.tabs.create({ url: 'settings.html' });
}

async function handleManualInput() {
    const input = document.getElementById('fbAgentInput').value.trim();
    
    if (!input) {
        addMessage('bot', '⚠️ Please enter a command.');
        return;
    }

    if (!geminiApiKey) {
        addMessage('bot', '❌ Error: No API key configured. Please set your Gemini API key in Settings (⚙️).');
        updateStatus('Error: Missing API Key', 'error');
        return;
    }

    if (isWorking) {
        addMessage('bot', '⏳ Another task is running. Please wait.');
        return;
    }

    addMessage('user', input);
    document.getElementById('fbAgentInput').value = '';
    
    updateStatus('Analyzing...', 'default');
    
    try {
        // Validate input length
        if (input.length > 5000) {
            throw new ValidationError('Command is too long (max 5000 characters)');
        }

        // Build request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(`${serverUrl}/interpret`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': geminiApiKey
            },
            body: JSON.stringify({ command: input }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
            let errorMsg = `Server error (${response.status})`;
            try {
                const errData = await response.json();
                errorMsg = errData.error || errorMsg;
            } catch (e) {
                console.warn('Could not parse error response');
            }
            throw new ConnectionError(errorMsg);
        }

        const data = await response.json();

        if (!data.success) {
            throw new ConnectionError(data.error || 'Unknown server error');
        }

        if (data.type === 'SCHEDULED') {
            addMessage('bot', `⏰ ${data.message}`);
            updateStatus('Scheduled', 'success');
        } else if (data.success && data.intent) {
            addMessage('bot', `✅ Intent: "${data.intent.content}"\n⏱️ Processing...`);
            await executeTask(data.intent);
        } else {
            addMessage('bot', '❓ Could not understand the command. Try being more specific (e.g., "Post hello world")');
            updateStatus('Ready', 'default');
        }
    } catch (error) {
        handleError(error);
        updateStatus('Error', 'error');
    }
}

function handleError(error) {
    console.error('[AlgorithmX Error]', {
        name: error.name,
        message: error.message,
        stack: error.stack
    });

    let userMsg = '❌ Error: ';

    if (error.name === 'AbortError') {
        userMsg += 'Request timeout. Server may be unreachable or slow.';
    } else if (error instanceof ConnectionError) {
        if (error.message.includes('401')) {
            userMsg += 'Invalid API key. Check your settings.';
        } else if (error.message.includes('403')) {
            userMsg += 'API key quota exceeded or invalid.';
        } else if (error.message.includes('502') || error.message.includes('503')) {
            userMsg += 'Server is down. Try again later.';
        } else {
            userMsg += error.message;
        }
    } else if (error instanceof TimeoutError) {
        userMsg += 'Operation timed out. Check your connection.';
    } else if (error instanceof DOMError) {
        userMsg += error.message + ' (Facebook DOM may have changed)';
    } else if (error instanceof ConfigError) {
        userMsg += error.message + ' Check settings.';
    } else {
        userMsg += error.message || 'Unknown error occurred.';
    }

    addMessage('bot', userMsg);
}

async function executeTask(intent) {
    if (isWorking) return;
    isWorking = true;
    updateStatus('Executing...', 'default');
    
    try {
        if (intent.action === 'create_post') {
            await executePostFlow(intent.content);
            
            if (intent.backdate_date) {
                addMessage('bot', '📅 Now handling backdate...');
                await executeBackdateFlow(intent.backdate_date);
            }
        }
        
        updateStatus('Complete', 'success');
        addMessage('bot', '✨ Done! Check your Facebook page.');
    } catch (e) {
        addMessage('bot', `⚠️ ${e.message}`);
        updateStatus('Error', 'error');
    } finally {
        isWorking = false;
    }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const getByXPath = (path) => document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

async function executePostFlow(content) {
    addMessage('bot', '📝 Opening post modal...');
    
    let trigger = getByXPath("//div[contains(@aria-label, \"What's on your mind\")]") || 
                  getByXPath("//span[contains(text(), \"What's on your mind\")]");
                  
    if (!trigger) throw new Error("Post trigger not found");
    
    trigger.click();
    await wait(3000);
    
    const textBox = document.querySelector('div[role="textbox"][contenteditable="true"]');
    if (!textBox) throw new Error("Text input not found");
    
    addMessage('bot', '✍️ Typing content...');
    textBox.focus();
    const dt = new DataTransfer();
    dt.setData('text/plain', content);
    textBox.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: dt }));
    await wait(2000);
    
    const postBtn = getByXPath("//div[@aria-label='Post']");
    if (postBtn) {
        addMessage('bot', '🚀 Posting...');
        postBtn.click();
        await wait(5000);
    } else {
        throw new Error("Post button not found");
    }
}

async function executeBackdateFlow(targetDate) {
    addMessage('bot', `📅 Backdating to ${targetDate}...`);
    
    const profileLink = getByXPath("//a[contains(@href, '/me/')]") || 
                        document.querySelector('a[href*="profile.php"]');
                        
    if (profileLink) {
        profileLink.click();
        await wait(5000);
    }
    
    const actionsBtn = getByXPath("(//div[@aria-label='Actions for this post'])[1]");
    
    if (actionsBtn) {
        actionsBtn.scrollIntoView({behavior: "smooth", block: "center"});
        await wait(1000);
        actionsBtn.click();
        await wait(2000);
        
        let editDateOption = getByXPath("//span[contains(text(), 'Edit Date')]") || 
                             getByXPath("//span[contains(text(), 'Edit date')]");
                             
        if (editDateOption) {
            editDateOption.click();
            addMessage('bot', '📅 Date picker opened. Please select your date.');
        } else {
            throw new Error("Backdate option not available");
        }
    } else {
        throw new Error("Could not find recent post");
    }
}

// Init
setTimeout(injectUI, 2000);

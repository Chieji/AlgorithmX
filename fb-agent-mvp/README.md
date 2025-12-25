# FB Agent MVP 🤖

**AI-powered Facebook page automation via Chrome extension**

An intelligent extension that lets you manage Facebook posts through natural language commands. Built with a backend proxy (Node.js + Gemini AI) and a DOM-automation content script.

---

## 🎯 What It Does

- **Create Posts**: "Post 'Hello world'"
- **Schedule Posts**: "Post 'Good morning' tomorrow at 9am"
- **Backdate Posts**: "Post 'Throwback' backdated to 2020"
- **Automatic Parsing**: Uses Google Gemini AI to understand natural language intent
- **Settings Panel**: Bring-your-own API key (BYOK) for security

---

## 📦 Installation & Setup

### Step 1: Clone & Install Backend

```bash
cd fb-agent-mvp/server
npm install
```

### Step 2: Get Your Gemini API Key

1. Visit [ai.google.dev](https://ai.google.dev)
2. Create a free account and generate an API key
3. Keep it safe (you'll paste it in the extension settings)

### Step 3: Start the Backend Server

```bash
npm start
```

Expected output:
```
╔════════════════════════════════════════╗
║  FB-AGENT-MVP Server Active            ║
║  Port: 3000                            ║
║  Time: 10:30:45 AM                     ║
╚════════════════════════════════════════╝
Waiting for extension connection...
```

### Step 4: Load the Extension

1. Open **Chrome** (or Brave/Edge)
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `fb-agent-mvp/extension/` folder

### Step 5: Configure API Key

1. Visit any Facebook page (facebook.com)
2. Click the **⚙️ icon** in the bottom-right chat widget
3. Paste your Gemini API key
4. Click **Test Connection** to verify
5. Save settings

---

### Background Service Worker

- The extension includes a MV3 background service worker (`background.js`) that performs periodic health checks against the local backend and responds to extension messages.
- Purpose: ensures the extension has an active background context so browsers do not warn that a service worker is missing or inactive.
- How to verify:
  1. Open `chrome://extensions` in Chrome/Edge/Brave.
  2. Enable Developer mode and locate the `AlgorithmX` extension.
  3. Click on the `Service worker` link (under "Inspect views") to open the worker console and view logs.
  4. You should see `AlgorithmX: background service worker installed` and periodic `health OK` or `health check error` messages.

If the badge shows `ERR`, open settings and confirm the `Server URL` and `API Key` are correct and that the backend is running.


## 🚀 Quick Start

### Usage Flow

1. **Open Facebook** → See the chat widget (bottom-right)
2. **Type a command**:
   - "Post 'Check out my new video'"
   - "Schedule a post for tomorrow at 3pm saying 'Flash sale!'"
   - "Post 'Old photo' backdated to 2015"
3. **Hit Send** (or Ctrl+Enter)
4. **Agent reads command** → Opens modal → **Auto-posts**

### Example Commands

| Command | Result |
|---------|--------|
| `Post "Hello world"` | Creates an immediate post |
| `Post "Good morning" tomorrow at 9am` | Schedules for tomorrow 9am |
| `Post "Throwback" backdated to 2020-06-15` | Backdates the post |
| `Edit my last post to say "Updated!"` | (Coming soon) |

---

## 🔐 Security & Privacy

- **Your API Key**: Stored locally in your browser (Chrome Storage API)
- **No server logging**: Keys never leave your machine (except to Google's Gemini API)
- **One-way encryption**: Sensitive data not persisted long-term
- **Source code open**: Audit the extension code yourself

### Permissions Requested

- `activeTab` — Access current tab to inject UI
- `scripting` — Inject chat widget on facebook.com
- `storage` — Save API key locally
- `host_permissions` — Access facebook.com and localhost:3000

---

## 🛠️ Architecture

```
┌─────────────────────────────────────────────────────┐
│ Facebook.com (Browser)                              │
├─────────────────────────────────────────────────────┤
│ Content Script (content.js)                         │
│  ├─ Injects Chat Widget UI                         │
│  ├─ Listens for user commands                       │
│  └─ Executes DOM automation                         │
├─────────────────────────────────────────────────────┤
│ Settings Panel (settings.html/js)                   │
│  └─ Stores API key in chrome.storage.local          │
└─────────────────────────────────────────────────────┘
                         ↓ (fetch)
┌─────────────────────────────────────────────────────┐
│ Backend Proxy (Node.js, localhost:3000)             │
├─────────────────────────────────────────────────────┤
│ /interpret endpoint                                 │
│  ├─ Accepts: user command + API key (header)       │
│  ├─ Calls: Google Gemini API                        │
│  └─ Returns: Parsed intent JSON                     │
├─────────────────────────────────────────────────────┤
│ Task Scheduler                                      │
│  ├─ Handles scheduled posts                         │
│  └─ Polls for ready tasks                           │
└─────────────────────────────────────────────────────┘
                         ↓ (API call)
┌─────────────────────────────────────────────────────┐
│ Google Gemini API                                   │
│  └─ Understands natural language intent             │
└─────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### "No API Key" Error
- Open settings (⚙️ button)
- Paste your Gemini API key
- Click "Test Connection"

### "Failed to Connect" Error
- Ensure backend is running: `npm start` in `server/` folder
- Check if port 3000 is in use: `lsof -i :3000`
- Verify server URL in settings (default: `http://localhost:3000`)

### Chat Widget Not Appearing
- Refresh the Facebook page
- Check browser console for errors (F12 → Console)
- Ensure extension is enabled (chrome://extensions)

### Post Not Appearing on Facebook
- Check that you're logged into the Facebook account
- Verify the post is not filtered by privacy settings
- Check the browser console for DOM selector errors
- Backdate/schedule features may require a Facebook Business Page

---

## 📝 API Endpoints

### POST /interpret
Parses natural language command into structured intent.

**Request:**
```bash
curl -X POST http://localhost:3000/interpret \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_GEMINI_KEY" \
  -d '{"command": "Post hello world tomorrow at 9am"}'
```

**Response:**
```json
{
  "success": true,
  "type": "SCHEDULED",
  "message": "Scheduled for Jan 25, 2025 at 9:00 AM",
  "intent": {
    "action": "create_post",
    "content": "hello world",
    "schedule_time": "2025-01-25T09:00:00.000Z",
    "backdate_date": null,
    "confidence": 0.95
  }
}
```

### GET /health
Health check endpoint.

```bash
curl http://localhost:3000/health
```

### GET /tasks
Poll for pending scheduled tasks (used by extension).

```bash
curl http://localhost:3000/tasks
```

---

## 🚦 Project Status

- ✅ MVP Core (create, schedule, backdate)
- ✅ Professional UI (inspired by Microsoft BotFramework-WebChat)
- ✅ BYOK (Bring Your Own Key) API management
- ⏳ Edit/delete post support
- ⏳ Image uploads
- ⏳ Facebook Graph API integration (production mode)
- ⏳ Chrome Web Store publish

---

## 📄 License

MIT

---

## 🤝 Contributing

Found a bug? Want to add a feature?

1. Fork the repo
2. Create a feature branch
3. Test locally
4. Submit a pull request

---

## 💬 FAQ

**Q: Is my API key safe?**
A: Yes. It's stored locally in your browser and never transmitted except to Google's Gemini API.

**Q: Does this work on mobile?**
A: Not yet. This is a Chrome extension (desktop only).

**Q: Can I use this on a personal Facebook profile?**
A: Yes, but some features (like scheduling) work best on Business Pages. Personal pages have limitations.

**Q: What if Facebook changes their DOM?**
A: The extension uses XPath selectors with fallbacks. If Facebook redesigns, we may need to update selectors. Check GitHub issues for updates.

---

**Made with 🤖 by Nexus** | Project ID: `FB-AGENT-MVP-20251225`

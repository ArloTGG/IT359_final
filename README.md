# Phishing Link Scanner Firefox Extension

An AI-powered phishing link scanner that uses Claude (Anthropic) to generate detailed threat analysis reports.

---

## Features

- **AI-Powered Analysis** — Uses Claude Sonnet to generate detailed phishing reports
- **Heuristic Pre-Scan** — Instant local checks for 10+ phishing indicators before the API call
- **Risk Score (0–100)** — Color-coded threat meter with Safe / Suspicious / Dangerous verdicts
- **Threat Flags** — Itemized list of detected indicators with severity levels
- **Right-Click Scanning** — Scan any link via browser context menu
- **Inline Page Warnings** — Banner alert when visiting a flagged dangerous URL
- **Secure Key Storage** — Your API key is stored locally; never logged or shared

---

## Installation (Firefox)

### Method 1: Temporary (Developer Mode)
1. Open Firefox and navigate to `about:debugging`
2. Click **"This Firefox"** in the left sidebar
3. Click **"Load Temporary Add-on..."**
4. Navigate to the extracted folder and select **`manifest.json`**
5. The extension will appear in your toolbar 🛡

> **Note:** Temporary add-ons are removed when Firefox restarts. For permanent install, use Method 2.

### Method 2: Permanent via web-ext
```bash
# Install web-ext
npm install -g web-ext

# From the extension folder:
web-ext run           # Test in Firefox
web-ext build         # Build .xpi package
web-ext sign          # Sign for distribution (requires AMO account)
```

---

## Setup

1. Click the **PhishGuard AI** shield icon in your toolbar
2. Click the ⚙ settings gear icon (top right of popup)
3. Enter your **Anthropic API key** (get one at https://console.anthropic.com/keys)
4. Click **Save Settings**

---

## Usage

### Scan a URL
1. Click the extension icon
2. Type or paste any URL into the input field
3. Click **Analyze URL** or press Enter
4. View the risk score, threat flags, and AI-generated report

### Scan the Current Tab
- Click the 📋 paste button to auto-fill the active tab's URL

### Right-Click Any Link
- Right-click any hyperlink on a page → **"Scan with PhishGuard AI"**

---

## File Structure

```
phish-scanner/
├── manifest.json          # Extension manifest (v2, Firefox)
├── popup/
│   ├── popup.html         # Main UI
│   ├── popup.css          # Styles
│   └── popup.js           # Logic + AI API calls + heuristics
├── options/
│   ├── options.html       # Settings page
│   └── options.js         # Settings logic
├── background/
│   └── background.js      # Context menus, badge, messaging
├── content/
│   ├── content.js         # Inline page warning injection
│   └── content.css        # Warning banner styles
└── icons/
    ├── icon48.png
    └── icon96.png
```

---

## Heuristic Checks (Local, No API Required)

The extension runs these checks instantly before calling Claude:

| Check | Severity |
|-------|----------|
| IP address as hostname | High |
| Brand name in subdomain | High |
| @ symbol in URL | High |
| Executable file in path | High |
| Suspicious TLD (.xyz, .tk, etc.) | Medium |
| HTTP (not HTTPS) | Medium |
| Non-standard port | Medium |
| Open redirect parameters | Medium |
| URL-encoded character flooding | Medium |
| Excessive subdomains | Medium |
| Very long URL (150+ chars) | Low |
| Multiple hyphens in domain | Low |

---

## Privacy

- Your API key is stored in Firefox's local extension storage (`browser.storage.local`)
- No URLs or scan results are sent anywhere except directly to `api.anthropic.com`
- No analytics, no telemetry, no external servers

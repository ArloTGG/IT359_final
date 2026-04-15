// PhishGuard AI - Background Script

let contextMenuCreated = false;

function setupContextMenu(enabled) {
  browser.contextMenus.removeAll(() => {
    if (enabled) {
      browser.contextMenus.create({
        id: 'phishguard-scan-link',
        title: '🛡 Scan with PhishGuard AI',
        contexts: ['link'],
      });
      browser.contextMenus.create({
        id: 'phishguard-scan-page',
        title: '🛡 Scan this page URL',
        contexts: ['page'],
      });
      contextMenuCreated = true;
    }
  });
}

// Init
browser.storage.local.get(['contextMenu']).then(({ contextMenu }) => {
  setupContextMenu(contextMenu !== false); // default on
});

// Context menu click handler
browser.contextMenus.onClicked.addListener((info, tab) => {
  const url = info.linkUrl || info.pageUrl;
  if (!url) return;

  if (info.menuItemId === 'phishguard-scan-link' || info.menuItemId === 'phishguard-scan-page') {
    // Store URL for popup to pick up, then open popup
    browser.storage.local.set({ pendingScanUrl: url });
    browser.browserAction.openPopup();
  }
});

// Listen for settings updates
browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'SETTINGS_UPDATED') {
    browser.storage.local.get(['contextMenu']).then(({ contextMenu }) => {
      setupContextMenu(contextMenu !== false);
    });
  }
});

// Badge management
function setBadge(tabId, level) {
  const configs = {
    safe: { text: '✓', color: '#00e676' },
    warn: { text: '!', color: '#ffa726' },
    danger: { text: '✕', color: '#ff4757' },
    none: { text: '', color: '#000000' },
  };
  const c = configs[level] || configs.none;
  browser.browserAction.setBadgeText({ text: c.text, tabId });
  browser.browserAction.setBadgeBackgroundColor({ color: c.color, tabId });
}

// Clear badge on tab navigation
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    setBadge(tabId, 'none');
  }
});

// Listen for results from content script
browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'SCAN_RESULT' && sender.tab) {
    const level = msg.riskScore < 35 ? 'safe' : msg.riskScore < 65 ? 'warn' : 'danger';
    setBadge(sender.tab.id, level);
  }
});

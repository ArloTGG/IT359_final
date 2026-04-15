const apiKeyInput = document.getElementById('apiKeyInput');
const toggleVis = document.getElementById('toggleVis');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const autoScan = document.getElementById('autoScan');
const contextMenu = document.getElementById('contextMenu');
const inlineWarnings = document.getElementById('inlineWarnings');

// Load saved settings
browser.storage.local.get(['apiKey', 'autoScan', 'contextMenu', 'inlineWarnings']).then(prefs => {
  if (prefs.apiKey) apiKeyInput.value = prefs.apiKey;
  autoScan.checked = prefs.autoScan ?? false;
  contextMenu.checked = prefs.contextMenu ?? true;
  inlineWarnings.checked = prefs.inlineWarnings ?? true;
});

// Toggle visibility
let visible = false;
toggleVis.addEventListener('click', () => {
  visible = !visible;
  apiKeyInput.type = visible ? 'text' : 'password';
  toggleVis.querySelector('svg').innerHTML = visible
    ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

// Save settings
saveBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    showStatus('Please enter an API key.', 'err');
    return;
  }
  if (!key.startsWith('sk-ant-')) {
    showStatus('Key should start with "sk-ant-" — double check it.', 'err');
    return;
  }

  await browser.storage.local.set({
    apiKey: key,
    autoScan: autoScan.checked,
    contextMenu: contextMenu.checked,
    inlineWarnings: inlineWarnings.checked,
  });

  // Update context menu
  browser.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });

  showStatus('✓ Settings saved successfully!', 'ok');
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + type;
  setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 3500);
}

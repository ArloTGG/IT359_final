// Phish Link Scanner - Content Script
// Handles inline warning banners for dangerous pages

(async function () {
  const { inlineWarnings, apiKey, lastScanResult } = await browser.storage.local.get([
    'inlineWarnings', 'apiKey', 'lastScanResult'
  ]);

  if (!inlineWarnings || !apiKey) return;

  // Check for a pending scan result for this URL
  if (lastScanResult && lastScanResult.url === window.location.href) {
    if (lastScanResult.riskScore >= 65) {
      showWarningBanner(lastScanResult);
    }
  }
})();

function showWarningBanner(result) {
  if (document.getElementById('phishlinkscan-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'phishlinkscan-banner';
  banner.innerHTML = `
    <div class="pg-inner">
      <div class="pg-icon">🛡</div>
      <div class="pg-content">
        <strong>Phish Link Scanner Warning</strong>
        <span>This page has been flagged as a potential phishing site (Risk Score: ${result.riskScore}/100). Proceed with extreme caution.</span>
      </div>
      <button class="pg-dismiss" id="pgDismiss">✕</button>
    </div>
  `;

  document.documentElement.insertBefore(banner, document.body);

  document.getElementById('pgDismiss')?.addEventListener('click', () => {
    banner.style.transform = 'translateY(-100%)';
    setTimeout(() => banner.remove(), 300);
  });
}

// Listen for scan results from popup
browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'PAGE_SCAN_RESULT' && msg.url === window.location.href) {
    if (msg.riskScore >= 65) showWarningBanner(msg);
  }
});

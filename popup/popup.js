// PhishGuard AI - Popup Script

const urlInput = document.getElementById('urlInput');
const scanBtn = document.getElementById('scanBtn');
const pasteBtn = document.getElementById('pasteBtn');
const settingsBtn = document.getElementById('settingsBtn');
const noKeyBanner = document.getElementById('noKeyBanner');
const openOptions = document.getElementById('openOptions');
const retryBtn = document.getElementById('retryBtn');
const rescanBtn = document.getElementById('rescanBtn');

// States
const stateIdle = document.getElementById('stateIdle');
const stateLoading = document.getElementById('stateLoading');
const stateResults = document.getElementById('stateResults');
const stateError = document.getElementById('stateError');

function showState(name) {
  [stateIdle, stateLoading, stateResults, stateError].forEach(el => el.classList.add('hidden'));
  document.getElementById('state' + name).classList.remove('hidden');
}

// Load API key on open, check if key is configured
browser.storage.local.get(['apiKey']).then(({ apiKey }) => {
  if (!apiKey) {
    noKeyBanner.classList.remove('hidden');
  }
});

// Paste current tab URL
pasteBtn.addEventListener('click', async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && !tab.url.startsWith('about:') && !tab.url.startsWith('moz-')) {
      urlInput.value = tab.url;
      urlInput.focus();
    }
  } catch (e) {}
});

settingsBtn.addEventListener('click', () => browser.runtime.openOptionsPage());
openOptions?.addEventListener('click', () => browser.runtime.openOptionsPage());

retryBtn.addEventListener('click', () => {
  showState('Idle');
});

rescanBtn.addEventListener('click', () => {
  showState('Idle');
  urlInput.value = '';
  urlInput.focus();
});

scanBtn.addEventListener('click', () => startScan());
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') startScan(); });

async function startScan() {
  const rawUrl = urlInput.value.trim();
  if (!rawUrl) {
    urlInput.style.borderColor = 'var(--danger)';
    setTimeout(() => urlInput.style.borderColor = '', 600);
    return;
  }

  const { apiKey } = await browser.storage.local.get(['apiKey']);
  if (!apiKey) {
    noKeyBanner.classList.remove('hidden');
    browser.runtime.openOptionsPage();
    return;
  }

  let url = rawUrl;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  showState('Loading');
  scanBtn.disabled = true;
  animateLoadingSteps();

  try {
    const result = await analyzeUrl(url, apiKey);
    renderResults(result, url);
  } catch (err) {
    showState('Error');
    document.getElementById('errorMsg').textContent = err.message || 'Failed to analyze URL. Check your API key.';
  } finally {
    scanBtn.disabled = false;
  }
}

function animateLoadingSteps() {
  const steps = ['step1', 'step2', 'step3'];
  const delays = [0, 1200, 2400];
  steps.forEach((id, i) => {
    const el = document.getElementById(id);
    el.className = 'step';
    setTimeout(() => {
      // Mark previous done
      if (i > 0) document.getElementById(steps[i - 1]).className = 'step done';
      el.className = 'step active';
    }, delays[i]);
  });
}

async function analyzeUrl(url, apiKey) {
  // Static heuristic analysis first
  const flags = runHeuristicChecks(url);

  // Call Claude API
  const prompt = buildPrompt(url, flags);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 700,
      system: `You are a cybersecurity expert specializing in phishing detection. Analyze URLs for phishing indicators.
Always respond in this exact JSON format (no markdown, no code fences):
{
  "riskScore": <integer 0-100>,
  "verdict": "<Safe|Suspicious|Dangerous>",
  "summary": "<2-3 sentence plain-language explanation for non-technical users>",
  "additionalFlags": [
    {"severity": "high|medium|low", "description": "<short flag description>"}
  ]
}`,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.map(b => b.text || '').join('');
  
  let parsed;
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  return {
    ...parsed,
    heuristicFlags: flags,
    url,
  };
}

function buildPrompt(url, heuristicFlags) {
  const flagList = heuristicFlags.map(f => `- [${f.severity.toUpperCase()}] ${f.description}`).join('\n');
  return `Analyze this URL for phishing: ${url}

Pre-scan heuristic flags detected:
${flagList.length ? flagList : '- None detected by heuristics'}

Provide a thorough analysis including:
1. Domain legitimacy (age clues, typosquatting, look-alike domains)
2. URL structure anomalies (excessive subdomains, IP address, unusual ports, encoded characters)
3. Path/parameter suspicious patterns (credential harvesting, redirect chains, fake login clues)
4. Brand impersonation signals
5. Any other phishing red flags

Return your analysis in the specified JSON format.`;
}

function runHeuristicChecks(url) {
  const flags = [];
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    flags.push({ severity: 'high', description: 'Malformed URL - cannot be parsed' });
    return flags;
  }

  const host = parsedUrl.hostname.toLowerCase();
  const full = url.toLowerCase();
  const path = parsedUrl.pathname.toLowerCase();

  // IP address as hostname
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    flags.push({ severity: 'high', description: 'IP address used instead of domain name' });
  }

  // Excessive subdomains
  const subdomainCount = host.split('.').length - 2;
  if (subdomainCount > 3) {
    flags.push({ severity: 'medium', description: `Excessive subdomains (${subdomainCount} levels deep)` });
  }

  // Suspicious TLDs
  const suspiciousTlds = ['.xyz', '.top', '.click', '.link', '.cf', '.tk', '.ml', '.ga', '.gq', '.pw', '.zip', '.mov'];
  if (suspiciousTlds.some(t => host.endsWith(t))) {
    flags.push({ severity: 'medium', description: `Suspicious TLD: ${parsedUrl.hostname.split('.').pop()}` });
  }

  // Non-standard port
  if (parsedUrl.port && !['80', '443', ''].includes(parsedUrl.port)) {
    flags.push({ severity: 'medium', description: `Non-standard port in URL: ${parsedUrl.port}` });
  }

  // Misleading HTTP (not HTTPS)
  if (parsedUrl.protocol === 'http:') {
    flags.push({ severity: 'medium', description: 'HTTP connection — no SSL/TLS encryption' });
  }

  // Brand names in suspicious positions
  const brands = ['paypal', 'amazon', 'google', 'apple', 'microsoft', 'netflix', 'facebook', 'instagram',
    'twitter', 'bank', 'secure', 'login', 'signin', 'account', 'verify', 'update'];
  const hostWithoutTld = host.split('.').slice(0, -1).join('.');
  const foundBrands = brands.filter(b => hostWithoutTld.includes(b) && !hostWithoutTld.startsWith(b + '.'));
  if (foundBrands.length > 0) {
    flags.push({ severity: 'high', description: `Brand name embedded in subdomain/path: "${foundBrands[0]}"` });
  }

  // URL encoded characters
  if ((full.match(/%[0-9a-f]{2}/g) || []).length > 5) {
    flags.push({ severity: 'medium', description: 'High number of URL-encoded characters' });
  }

  // Very long URL
  if (url.length > 150) {
    flags.push({ severity: 'low', description: `Unusually long URL (${url.length} characters)` });
  }

  // Multiple @ symbols or dashes in host
  if ((host.match(/-/g) || []).length > 3) {
    flags.push({ severity: 'low', description: 'Multiple hyphens in domain name' });
  }
  if (host.includes('@')) {
    flags.push({ severity: 'high', description: '@ symbol in URL — potential credential bypass' });
  }

  // Redirect indicators
  if (path.includes('redirect') || path.includes('redir') || parsedUrl.searchParams.get('url') || parsedUrl.searchParams.get('redirect')) {
    flags.push({ severity: 'medium', description: 'URL contains open redirect parameters' });
  }

  // Fake file extensions in path
  const fakeExts = ['.exe', '.zip', '.bat', '.cmd', '.scr', '.ps1'];
  if (fakeExts.some(e => path.includes(e))) {
    flags.push({ severity: 'high', description: 'Executable file extension detected in path' });
  }

  return flags;
}

function renderResults(result, url) {
  showState('Results');

  const { riskScore, verdict, summary, heuristicFlags, additionalFlags } = result;

  // Risk score
  const scoreEl = document.getElementById('riskScore');
  const barFill = document.getElementById('riskBarFill');
  const badge = document.getElementById('riskBadge');
  const riskLabel = document.getElementById('riskLabel');
  const riskIcon = document.getElementById('riskIcon');

  // Animate score
  let current = 0;
  const target = Math.min(100, Math.max(0, riskScore));
  const interval = setInterval(() => {
    current = Math.min(current + 2, target);
    scoreEl.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 20);

  const level = target < 35 ? 'safe' : target < 65 ? 'warn' : 'danger';
  const color = level === 'safe' ? 'var(--safe)' : level === 'warn' ? 'var(--warn)' : 'var(--danger)';

  barFill.style.width = target + '%';
  barFill.style.background = `linear-gradient(90deg, ${color}88, ${color})`;
  scoreEl.style.color = color;

  badge.className = 'risk-badge ' + level;
  riskIcon.textContent = level === 'safe' ? '✓' : level === 'warn' ? '⚠' : '✕';
  riskLabel.textContent = verdict.toUpperCase();

  // Flags
  const allFlags = [...heuristicFlags, ...(additionalFlags || [])];
  const flagsList = document.getElementById('flagsList');
  flagsList.innerHTML = '';

  if (allFlags.length === 0) {
    flagsList.innerHTML = `<div class="no-flags"><span>✓</span> No threat indicators detected</div>`;
  } else {
    allFlags.forEach((flag, i) => {
      const div = document.createElement('div');
      div.className = 'flag-item';
      div.style.animationDelay = (i * 80) + 'ms';
      div.innerHTML = `
        <div class="flag-dot ${flag.severity || 'medium'}"></div>
        <div class="flag-text">${flag.description}</div>
      `;
      flagsList.appendChild(div);
    });
  }

  // AI Report
  document.getElementById('reportBody').textContent = summary || 'No analysis available.';

  // Verdict bar
  const verdictEl = document.getElementById('verdictText');
  const messages = {
    safe: '✓ This URL appears to be safe',
    warn: '⚠ This URL looks suspicious — proceed carefully',
    danger: '✕ High risk — likely phishing attack',
  };
  verdictEl.textContent = messages[level] || verdict;
  verdictEl.className = 'verdict-text ' + level;
}

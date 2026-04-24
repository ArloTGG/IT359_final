// Creates the context menu
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "scan-link",
    title: "Scan Link with Gemini AI",
    contexts: ["link"]
  });
});

// Handles the click event
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "scan-link") {
    const linkUrl = info.linkUrl;
    
    // Notify the content script that it is starting
    browser.tabs.sendMessage(tab.id, { action: "showLoading" });

    try {
      const { geminiKey } = await browser.storage.local.get("geminiKey");
      if (!geminiKey) {
        throw new Error("API Key missing. Click the extension icon to set it.");
      }

      const report = await callGeminiAPI(linkUrl, geminiKey);
      browser.tabs.sendMessage(tab.id, { action: "showReport", report, url: linkUrl });
    } catch (error) {
      browser.tabs.sendMessage(tab.id, { action: "showError", message: error.message });
    }
  }
});

// Gemini API call to the selected model as well as the prompt made and used to generate the report 
async function callGeminiAPI(url, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  
  const prompt = `Analyze this URL for potential phishing or malicious intent: "${url}". 
  Provide a report including:
  1. Verdict (Safe, Suspicious, or Dangerous)
  2. Reasoning (Why is it flagged or safe? Check for lookalike domains, suspicious TLDs, or unusual structures).
  Keep the response concise and formatted for a small popup.`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

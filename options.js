document.getElementById("save").onclick = () => {
  const key = document.getElementById("apiKey").value;
  browser.storage.local.set({ geminiKey: key }).then(() => {
    alert("Key saved!");
  });
};

// Load existing key
browser.storage.local.get("geminiKey").then((res) => {
  if (res.geminiKey) document.getElementById("apiKey").value = res.geminiKey;
});
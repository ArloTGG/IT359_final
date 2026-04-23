browser.runtime.onMessage.addListener((request) => {
  if (request.action === "showLoading") {
    alert("AI is scanning the link... please wait.");
  } else if (request.action === "showReport") {
    displayModal(request.report, request.url);
  } else if (request.action === "showError") {
    alert("Error: " + request.message);
  }
});

function displayModal(report, url) {
  const modal = document.createElement("div");
  modal.style = `
    position: fixed; top: 20px; right: 20px; width: 350px; 
    background: white; border: 2px solid #333; padding: 15px; 
    z-index: 999999; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: sans-serif; color: #333;
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top:0">AI Phishing Report</h3>
    <p><strong>Link:</strong> <span style="word-break:break-all; font-size:0.8em">${url}</span></p>
    <div style="background:#f4f4f4; padding:10px; border-radius:4px; white-space: pre-wrap;">${report}</div>
    <button id="close-scan" style="margin-top:10px; cursor:pointer;">Close</button>
  `;
  
  document.body.appendChild(modal);
  document.getElementById("close-scan").onclick = () => modal.remove();
}
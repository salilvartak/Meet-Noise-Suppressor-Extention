document.getElementById("toggleSuppression").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab && tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["scripts/audioProcessor.js"]
    });

    document.getElementById("status").innerHTML = "Status: <span>Active</span>";
  }
});

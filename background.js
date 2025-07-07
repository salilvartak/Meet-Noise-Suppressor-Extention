chrome.runtime.onInstalled.addListener(() => {
  // Initialize the suppression state when the extension is installed.
  chrome.storage.local.set({ suppressionEnabled: false });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Inject the content script if the user navigates to a new Meet URL.
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("meet.google.com")) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
  }
});
(function() {
  // Ensure the script only runs once per page
  if (window.hasRunContentScript) {
    return;
  }
  window.hasRunContentScript = true;

  // Inject the core audio processing script into the page's context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('scripts/audioProcessor.js');
  (document.head || document.documentElement).appendChild(script);

  // Listen for messages from the popup (for real-time toggling)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleSuppression") {
      // Forward the message to the injected script
      window.postMessage({
        type: "NOISE_SUPPRESSOR_CONTROL",
        enabled: request.enabled
      }, "*");
    }
    return true; // Indicates an async response
  });
})();
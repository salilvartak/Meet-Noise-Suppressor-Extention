const suppressionToggle = document.getElementById("suppressionToggle");
const statusSpan = document.getElementById("status").querySelector("span");

// Restore the toggle's state from storage when the popup is opened
chrome.storage.local.get("suppressionEnabled", ({ suppressionEnabled }) => {
  suppressionToggle.checked = !!suppressionEnabled;
  statusSpan.textContent = suppressionEnabled ? "Active" : "Inactive";
});

// Listen for clicks on the toggle switch
suppressionToggle.addEventListener("change", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isEnabled = suppressionToggle.checked;

  // Save the new state to storage
  await chrome.storage.local.set({ suppressionEnabled: isEnabled });
  statusSpan.textContent = isEnabled ? "Active" : "Inactive";

  // Try to send a message to the content script for an instant update
  if (tab && tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: "toggleSuppression",
        enabled: isEnabled,
      });
    } catch (error) {
      // This is expected if the content script is not yet ready.
      // The content script will pick up the state from storage when it loads.
      console.warn("Could not send message to content script, it may not be ready yet.");
    }
  }
});
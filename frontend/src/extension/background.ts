chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "toggle-palette") return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PALETTE" });
  });
  
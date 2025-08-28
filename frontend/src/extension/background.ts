const API_BASE =
  (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ||
  "http://127.0.0.1:8787";

async function ensureContent(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    return;
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/extension/content.tsx"],
    });
    await new Promise((r) => setTimeout(r, 60));
  }
}

// keyboard command → toggle palette
chrome.commands.onCommand.addListener(async (command: string) => {
  if (command !== "toggle-palette") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await ensureContent(tab.id);
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PALETTE" });
  } catch (e) {
    console.warn("toggle failed", e);
  }
});

// background fetch proxy for content scripts
chrome.runtime.onMessage.addListener(
  (
    msg: { type?: string; path?: string; method?: string; headers?: Record<string, string>; body?: unknown },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    if (msg?.type !== "ONTAPAI_FETCH") return;

    (async () => {
      try {
      const res = await fetch(API_BASE + msg.path, {
        method: msg.method || "GET",
        headers: { "Content-Type": "application/json", ...(msg.headers || {}) },
        body: msg.body ? JSON.stringify(msg.body) : undefined,
      });
      const text = await res.text();
      sendResponse({ ok: res.ok, status: res.status, body: text });
    } catch (e) {
      const error = e instanceof Error ? e.message : "fetch_error";
      sendResponse({ ok: false, error });
    }
  })();

  return true; // keep the message channel open for async response
});

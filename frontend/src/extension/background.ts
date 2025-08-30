// BACKGROUND (MV3 service worker)
const API_BASE = (import.meta as any).env?.VITE_API_BASE || "https://ontap-ai.onrender.com";
console.log("[BG] booted. API_BASE =", API_BASE);

// simple reachability ping
chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  if (msg?.type === "PING_BG") {
    console.log("[BG] PING_BG");
    sendResponse({ ok: true, ts: Date.now() });
    return true;
  }
  return false;
});

// fetch proxy for content scripts
chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  if (msg?.type !== "ONTAPAI_FETCH") return;

  const url = API_BASE + msg.path;
  console.log("[BG] ONTAPAI_FETCH ->", url, { method: msg.method });

  (async () => {
    let payload: any;
    try {
      const res = await fetch(url, {
        method: msg.method || "GET",
        headers: { "Content-Type": "application/json", ...(msg.headers || {}) },
        body: msg.body ? JSON.stringify(msg.body) : undefined,
      });
      const text = await res.text();
      console.log("[BG] <-", res.status, text.slice(0, 180));
      payload = { ok: res.ok, status: res.status, body: text };
    } catch (e: any) {
      console.warn("[BG] fetch error:", e?.message || e);
      payload = { ok: false, error: e?.message || "fetch_error" };
    } finally {
      try { sendResponse(payload); } catch {}
    }
  })();

  // CRITICAL: keep channel open while async work finishes
  return true;
});

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CommandPalettePrototype from "../CommandPalettePrototype";
import cssUrl from "../index.css?url"; // compiled CSS asset

const host = document.createElement("div");
host.id = "ontapai-root-host";
const shadow = host.attachShadow({ mode: "open" });
document.documentElement.appendChild(host);

// attach CSS into the shadow
const linkEl = document.createElement("link");
linkEl.rel = "stylesheet";
linkEl.href = cssUrl;
shadow.appendChild(linkEl);

const mount = document.createElement("div");
mount.id = "ontapai-root";
shadow.appendChild(mount);

// your component already listens for Ctrl/Cmd+K
function togglePalette() {
  const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
  window.dispatchEvent(ev);
}

chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
  if (msg?.type === "PING") { sendResponse({ ok: true }); return true; }
  if (msg?.type === "TOGGLE_PALETTE") togglePalette();
  return false;
});

const root = createRoot(mount);
root.render(
  <StrictMode>
    <CommandPalettePrototype />
  </StrictMode>
);

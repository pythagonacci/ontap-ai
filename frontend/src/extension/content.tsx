import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CommandPalettePrototype from "../CommandPalettePrototype";

// ⬇️ Import Tailwind bundle as text and adopt into shadow
import cssText from "./styles.css?inline";

// Create a shadow container
const host = document.createElement("div");
host.id = "ontapai-root-host";
const shadow = host.attachShadow({ mode: "open" });
document.documentElement.appendChild(host);

// Adopt stylesheet so Tailwind classes work inside shadow
const sheet = new CSSStyleSheet();
sheet.replaceSync(cssText);
shadow.adoptedStyleSheets = [sheet];

// Debug: Log the CSS to see if it's being loaded
console.log("CSS loaded:", cssText.substring(0, 200) + "...");

const mount = document.createElement("div");
mount.id = "ontapai-root";
shadow.appendChild(mount);

// Toggle helper (your component listens for Ctrl/Cmd+K)
function togglePalette() {
  const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
  window.dispatchEvent(ev);
}

// Listen for background messages
chrome.runtime.onMessage.addListener(
  (
    msg: { type?: string } | undefined,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { ok: boolean }) => void
  ) => {
    if (msg?.type === "PING") {
      sendResponse({ ok: true });
      return true;
    }
    if (msg?.type === "TOGGLE_PALETTE") {
      togglePalette();
      return true;
    }
    return false;
  }
);

const root = createRoot(mount);
root.render(
  <StrictMode>
    <CommandPalettePrototype />
  </StrictMode>
);

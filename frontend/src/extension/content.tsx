// content.tsx — shadow mount with scoped focus/key shields
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CommandPalettePrototype from "../CommandPalettePrototype";
import cssText from "../index.css?inline";

// Host + shadow (delegatesFocus so clicks move focus into shadow inputs)
const host = document.createElement("div");
host.id = "ontapai-root-host";
host.style.cssText = "position:fixed; inset:0; z-index:2147483647; pointer-events:none;";
const shadow = host.attachShadow({ mode: "open", delegatesFocus: true });
document.documentElement.appendChild(host);

// Styles
const base = new CSSStyleSheet();
base.replaceSync(`:host, :host * { box-sizing: border-box; }`);
const tailwind = new CSSStyleSheet();
tailwind.replaceSync(cssText);
shadow.adoptedStyleSheets = [base, tailwind];

// Mount: IMPORTANT → pointer-events:none so the page is clickable outside panel
const mount = document.createElement("div");
mount.id = "ontapai-root";
mount.style.cssText = "pointer-events:none; width:100%; height:100%;";
shadow.appendChild(mount);

// Helper: is the event inside our palette panel?
function isInsidePanel(evt: Event) {
  const path = evt.composedPath?.() || [];
  return path.some(
    (n) => n instanceof Element && n.getAttribute("data-ontapai-panel") === "1"
  );
}

// Capture-phase shields ONLY when inside the panel
["keydown", "keypress", "keyup", "beforeinput", "input"].forEach((type) => {
  document.addEventListener(
    type,
    (e) => {
      if (isInsidePanel(e)) e.stopImmediatePropagation();
    },
    true // capture
  );
});

document.addEventListener(
  "wheel",
  (e) => {
    if (isInsidePanel(e)) e.stopImmediatePropagation();
  },
  { capture: true, passive: true }
);

// Message bridge
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "PING") return true;
  if (msg?.type === "TOGGLE_PALETTE") {
    const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    window.dispatchEvent(ev);
  }
  return false;
});

// Render
createRoot(mount).render(
  <StrictMode>
    <CommandPalettePrototype />
  </StrictMode>
);

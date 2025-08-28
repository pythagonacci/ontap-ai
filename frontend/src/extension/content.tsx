// src/extension/content.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CommandPalettePrototype from "../CommandPalettePrototype";
import cssText from "../index.css?inline";

const host = document.createElement("div");
host.id = "ontapai-root-host";
host.style.cssText = `
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none; /* page stays interactive */
`;
document.documentElement.appendChild(host);

const shadow = host.attachShadow({ mode: "open" });

const baseSheet = new CSSStyleSheet();
baseSheet.replaceSync(`:host,*{box-sizing:border-box} :host{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial}`);
const tailwind = new CSSStyleSheet();
tailwind.replaceSync(cssText);
shadow.adoptedStyleSheets = [baseSheet, tailwind];

const mount = document.createElement("div");
mount.id = "ontapai-root";
/* ⬇️ only window gets clicks; the full-screen mount does not */
mount.style.cssText = "pointer-events:none; width:100%; height:100%;";
shadow.appendChild(mount);

function togglePalette() {
  // allow either Cmd+K (Mac) or Ctrl+K (Win)
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
}

chrome.runtime.onMessage.addListener((msg: any, _s, send) => {
  if (msg?.type === "PING") { send({ ok: true }); return true; }
  if (msg?.type === "TOGGLE_PALETTE") { togglePalette(); return true; }
  return false;
});

const root = createRoot(mount);
root.render(
  <StrictMode>
    <CommandPalettePrototype embedded />
  </StrictMode>
);

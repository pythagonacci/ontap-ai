import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CommandPalettePrototype from "../CommandPalettePrototype";
import "../index.css";

// Create a shadow container
const host = document.createElement("div");
host.id = "ontapai-root-host";
const shadow = host.attachShadow({ mode: "open" });
document.documentElement.appendChild(host);

// Optional: style tag for shadow (Vite will inline CSS for this entry)
const style = document.createElement("style");
style.textContent = "";
shadow.appendChild(style);

const mount = document.createElement("div");
mount.id = "ontapai-root";
shadow.appendChild(mount);

function togglePalette() {
  const ev = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
  window.dispatchEvent(ev);
}

chrome.runtime.onMessage.addListener((msg: any) => {
  if (msg?.type === "TOGGLE_PALETTE") togglePalette();
});

const root = createRoot(mount);
root.render(
  <StrictMode>
    <CommandPalettePrototype />
  </StrictMode>
);

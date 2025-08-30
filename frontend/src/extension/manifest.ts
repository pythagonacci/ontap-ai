import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Ontap AI – Command Palette",
  version: "0.0.1",
  description: "Liquid-glass command palette on any page.",
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  permissions: ["scripting", "activeTab"],
  host_permissions: [
    "https://ontap-ai.onrender.com/*",   // <— production API
  ],
  action: { 
    default_title: "Ontap AI",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  commands: {
    "toggle-palette": { suggested_key: { default: "Alt+K" }, description: "Toggle palette" },
  },
  background: { service_worker: "src/extension/background.ts", type: "module" },
  content_scripts: [
    { matches: ["<all_urls>"], js: ["src/extension/content.tsx"], run_at: "document_idle" },
  ],
  web_accessible_resources: [{ resources: ["*"], matches: ["<all_urls>"] }],
});

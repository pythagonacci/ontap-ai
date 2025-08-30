import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Ontap AI – Command Palette",
  version: "0.0.1",
  description: "Liquid-glass command palette on any page.",
  permissions: ["scripting", "activeTab"],
  host_permissions: [
    "https://ontap-ai.onrender.com/*",   // <— production API
  ],
  action: { default_title: "Ontap AI" },
  commands: {
    "toggle-palette": { suggested_key: { default: "Alt+K" }, description: "Toggle palette" },
  },
  background: { service_worker: "src/extension/background.ts", type: "module" },
  content_scripts: [
    { matches: ["<all_urls>"], js: ["src/extension/content.tsx"], run_at: "document_idle" },
  ],
  web_accessible_resources: [{ resources: ["*"], matches: ["<all_urls>"] }],
});

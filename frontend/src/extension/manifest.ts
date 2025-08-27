import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Ontap AI – Command Palette",
  version: "0.0.1",
  description:
    "A liquid-glass command palette on any page. Toggle with a shortcut and ask /explain, /answer, /rewrite.",
  permissions: ["scripting", "activeTab"],
  host_permissions: ["<all_urls>"],
  action: { default_title: "Ontap AI" },
  commands: {
    "toggle-palette": {
      suggested_key: { default: "Alt+K" },
      description: "Toggle Ontap AI Command Palette",
    },
  },
  background: { service_worker: "src/extension/background.ts", type: "module" },
  content_scripts: [
    { matches: ["<all_urls>"], js: ["src/extension/content.tsx"], run_at: "document_idle" },
  ],
  web_accessible_resources: [{ resources: ["*"], matches: ["<all_urls>"] }],
});

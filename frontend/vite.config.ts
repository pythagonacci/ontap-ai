import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/extension/manifest";

// regular app + extension build in one config
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    sourcemap: false
  }
});

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  publicDir: false,
  resolve: { tsconfigPaths: true },
  build: {
    outDir: path.join(root, "dist/ui"),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: path.join(root, ".design-sync/ui-build/entry.ts"),
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "index",
    },
    rollupOptions: {
      // Leave npm dependencies as imports, like a published package, so the
      // design-sync bundler resolves them against its own React shim.
      external: (id) => /^(@[a-z0-9-]+\/)?[a-z0-9][\w.-]*(\/.*)?$/i.test(id),
    },
  },
});

import { defineConfig } from "cspell";

export default defineConfig({
  version: "0.2",
  words: ["vite", "chromaui", "voidzero", "fullstacksjs", "ASafaeirad"],
  ignorePaths: [
    "node_modules",
    "*.svg",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "dist/",
    "vite-hooks/",
  ],
});

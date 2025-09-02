import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "~/db": path.resolve(__dirname, "./db"),
      "~": path.resolve(__dirname, "./app"),
    },
  },
});

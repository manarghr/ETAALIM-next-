import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Same `@/…` alias the app uses, so tests import modules exactly as the
    // source does.
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

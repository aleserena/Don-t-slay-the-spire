/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";
import packageJson from "./package.json" with { type: "json" };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Shown on the title screen
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    // The simulation report has its own config (npm run simulate)
    exclude: [...configDefaults.exclude, "**/*.sim.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/store/types.ts",
      ],
      // The game rules must stay well tested. Components are not covered by
      // these floors yet.
      thresholds: {
        "src/engine/**": { lines: 80, functions: 90, branches: 75 },
        "src/store/**": { lines: 80, functions: 80, branches: 75 },
      },
    },
  },
});

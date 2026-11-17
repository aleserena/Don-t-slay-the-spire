/// <reference types="vitest" />
import { defineConfig } from "vite";

// Runs the simulation report (`npm run simulate`), not the test suite.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/sim/**/*.sim.test.ts"],
    // The report is printed with console.log
    silent: false,
  },
});

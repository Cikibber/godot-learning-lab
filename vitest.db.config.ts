import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Runs against the local Supabase stack (`npm run db:start && npm run db:reset`).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});

import { defineConfig, devices } from "@playwright/test";

// Requires the local Supabase stack with migrations applied (npm run db:reset).
// Tests provision their own synthetic users through the operator path.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", locale: "en-US" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run start -- -p 3000",
    url: "http://127.0.0.1:3000/sign-in",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

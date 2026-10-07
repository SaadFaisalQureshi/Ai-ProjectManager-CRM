import { defineConfig, devices } from "@playwright/test";

// E2E runs against a production build using a fake model server (tests/e2e/fake-llm.mjs),
// so no API key is needed. Set E2E_BASE_URL to test an already-running app instead.
const external = !!process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100", trace: "retain-on-failure" },
  projects: [{
    name: "desktop",
    use: { ...devices["Desktop Chrome"], launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {} },
  }],
  webServer: external ? undefined : [
    { command: "node tests/e2e/fake-llm.mjs", port: 4010, reuseExistingServer: true },
    {
      command: "npm run build && npx next start -p 3100",
      port: 3100,
      timeout: 240_000,
      reuseExistingServer: true,
      env: { LLM_BASE_URL: "http://localhost:4010", LLM_API_KEY: "fake-key", LLM_MODEL: "fake-model" },
    },
  ],
});

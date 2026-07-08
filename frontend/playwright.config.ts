import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "cd .. && node -e \"require('fs').rmSync('frontend/test-results/e2e.db',{force:true})\" && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        PM_DB_PATH: "frontend/test-results/e2e.db",
      },
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8000/api",
      },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL,
      },
    },
  ],
});

import { defineConfig } from "vitest/config";
import { vitestSetupFilePath } from "@hirosystems/clarinet-sdk/vitest";

export default defineConfig({
  test: {
    environment: "clarinet",
    setupFiles: [vitestSetupFilePath],
    environmentOptions: {
      clarinet: {
        manifestPath: "./Clarinet.toml",
      },
    },
  },
});
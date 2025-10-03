import { defineConfig } from 'vite';
import { vitestSetupFilePath } from '@hirosystems/clarinet-sdk/vitest';

export default defineConfig({
  test: {
    environment: 'clarinet',
    setupFiles: [vitestSetupFilePath],
    environmentOptions: {
      clarinet: {
        manifestPath: './Clarinet.toml',
        coverageReports: ['lcov', 'html'],
      },
    },
  },
});
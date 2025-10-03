/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'clarinet',
    singleThread: true,
    setupFiles: [
      path.resolve('./node_modules/@hirosystems/clarinet-sdk/dist/esm/vitest-setup.js')
    ],
    environmentOptions: {
      clarinet: {
        manifestPath: './Clarinet.toml',
      },
    },
  },
  resolve: {
    alias: {
      '@stacks/transactions': path.resolve('./node_modules/@stacks/transactions/dist/index.js')
    }
  }
});
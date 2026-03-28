import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@immo24/decoder': path.resolve(__dirname, 'packages/decoder/src/index.ts'),
      '@immo24/metadata': path.resolve(__dirname, 'packages/metadata/src/index.ts')
    }
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**/*', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'packages/**',
        'scripts/**',
        '**/*.config.ts',
        '**/*.d.ts',
        'src/globals.d.ts'
      ]
    },
    setupFiles: ['./tests/setup.ts']
  }
});

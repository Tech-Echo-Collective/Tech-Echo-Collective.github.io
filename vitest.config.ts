import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      'next/server': fileURLToPath(
        new URL('./tests/shims/next-server.ts', import.meta.url),
      ),
      'next/headers': fileURLToPath(
        new URL('./tests/shims/next-headers.ts', import.meta.url),
      ),
      'next/navigation': fileURLToPath(
        new URL('./tests/shims/next-navigation.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: { enabled: false },
  },
});

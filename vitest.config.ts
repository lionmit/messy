import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      // Test-only signing key. Real deployments use SESSION_SECRET or a key derived from ANTHROPIC_API_KEY.
      SESSION_SECRET: 'test-only-signing-key-0123456789abcdef',
      // Proof-of-work off by default so the interview tests start sessions directly.
      // tests/pow.test.ts turns it on per test with vi.stubEnv.
      MESSY_POW_BITS: '0',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

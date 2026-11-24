import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    pool: 'threads',
    env: {
      AUTH_SECRET: 'minegate_super_secret_jwt_key_2026_at_least_32_chars',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
});

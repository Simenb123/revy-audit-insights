import path from "path";
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    tsconfig: './tsconfig.vitest.json',
    globals: true,
    setupFiles: './vitest.setup.ts',
    exclude: [
      'supabase/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/.cache/**',
      '**/cypress/**'
    ]
  }
});

import path from "path";
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode || 'test', process.cwd())
  return {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  envPrefix: [
    'VITE_',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_FUNCTIONS_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  define: {
    'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
    'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
    'import.meta.env.SUPABASE_FUNCTIONS_URL': JSON.stringify(env.SUPABASE_FUNCTIONS_URL || env.VITE_SUPABASE_FUNCTIONS_URL)
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
}
});

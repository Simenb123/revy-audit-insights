
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: [
    'VITE_',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_FUNCTIONS_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  define: {
    // Ensure environment variables are available at build time
    'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
    'import.meta.env.SUPABASE_FUNCTIONS_URL': JSON.stringify(process.env.SUPABASE_FUNCTIONS_URL || process.env.VITE_SUPABASE_FUNCTIONS_URL),
  },
}));


import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check if we're running in Lovable environment
  const isLovableEnvironment = process.env.NODE_ENV !== 'production' || 
                               process.env.LOVABLE === 'true';
  
  // Always enable componentTagger in development or Lovable environment
  const shouldEnableTagger = mode === 'development' || isLovableEnvironment;

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      shouldEnableTagger && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Define environment variables at build time
      'import.meta.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
      'import.meta.env.SUPABASE_FUNCTIONS_URL': JSON.stringify(process.env.SUPABASE_FUNCTIONS_URL || ''),
      'import.meta.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ''),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});

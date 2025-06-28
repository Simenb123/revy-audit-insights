
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_ANON_KEY?: string;
  readonly SUPABASE_FUNCTIONS_URL?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly VITE_USE_ENHANCED_ANALYSIS?: string;
  readonly VITE_KNOWLEDGE_ADMIN_ADVANCED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

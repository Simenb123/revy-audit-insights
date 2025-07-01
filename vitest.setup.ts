import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Stub Supabase environment variables so the client doesn't require real credentials
vi.stubEnv('SUPABASE_URL', 'http://localhost')
vi.stubEnv('SUPABASE_ANON_KEY', 'anon_key')
vi.stubEnv('SUPABASE_FUNCTIONS_URL', 'http://localhost')

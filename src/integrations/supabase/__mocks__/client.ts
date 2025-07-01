import { vi } from 'vitest'

export const supabase = {
  auth: { getUser: vi.fn(), getSession: vi.fn() },
  functions: { invoke: vi.fn() },
  from: vi.fn()
}

export const isSupabaseConfigured = true

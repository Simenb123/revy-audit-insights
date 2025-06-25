import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// helper to dynamically import after mocking
const loadService = async () => {
  const module = await import('./aiInteractionService')
  return module
}

describe('generateAIResponse', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws when Supabase is not configured', async () => {
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: null,
      isSupabaseConfigured: false
    }))
    const { generateAIResponse } = await loadService()
    await expect(
      generateAIResponse('hello', 'general' as any, [] as any)
    ).rejects.toThrow('Supabase not initialized')
  })

  it('returns fallback when Supabase invoke fails', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: { message: 'FunctionsHttpError: 500' } })
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: { functions: { invoke }, auth: { getUser } },
      isSupabaseConfigured: true
    }))
    const { generateAIResponse } = await loadService()
    const res = await generateAIResponse('hi', 'general' as any, [] as any)
    expect(res).toContain('Tjenesten er midlertidig nede for vedlikehold')
  })

  it('returns fallback on invalid data', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: null })
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: { functions: { invoke }, auth: { getUser } },
      isSupabaseConfigured: true
    }))
    const { generateAIResponse } = await loadService()
    const res = await generateAIResponse('hi', 'general' as any, [] as any)
    expect(res).toContain('En teknisk feil oppstod')
  })

  it('resolves AI response on success', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { response: 'hello ai' }, error: null })
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: { functions: { invoke }, auth: { getUser } },
      isSupabaseConfigured: true
    }))
    const { generateAIResponse } = await loadService()
    const res = await generateAIResponse('hi', 'general' as any, [] as any)
    expect(res).toBe('hello ai')
  })
})


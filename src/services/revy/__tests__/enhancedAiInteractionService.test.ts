import { describe, it, expect, vi, beforeEach } from 'vitest';

let invokeMock: any;
let getUserMock: any;
let getSessionMock: any;
let fromMock: any;

vi.mock('@/integrations/supabase/client', () => {
  invokeMock = vi.fn();
  getUserMock = vi.fn();
  getSessionMock = vi.fn();
  fromMock = vi.fn();
  return {
    supabase: {
      auth: { getUser: getUserMock, getSession: getSessionMock },
      functions: { invoke: invokeMock },
      from: fromMock
    },
    isSupabaseConfigured: true
  };
});

let generateEnhancedAIResponseWithVariant: any;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  ({ generateEnhancedAIResponseWithVariant } = await import('../enhancedAiInteractionService'));
  getUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 't' } } });
  fromMock.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [] })
  });
});

describe('generateEnhancedAIResponseWithVariant', () => {
  it('returns response on success', async () => {
    invokeMock.mockResolvedValueOnce({ data: { articles: [] }, error: null });
    invokeMock.mockResolvedValueOnce({ data: { response: 'ok' }, error: null });
    const res = await generateEnhancedAIResponseWithVariant('m1', 'general', []);
    expect(res.startsWith('ok')).toBe(true);
  });

  it('falls back when invoke error', async () => {
    invokeMock.mockResolvedValueOnce({ data: { articles: [] }, error: null });
    invokeMock.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const res = await generateEnhancedAIResponseWithVariant('m2', 'general', []);
    expect(res).toContain('AI-Revi');
  });

  it('falls back when response missing', async () => {
    invokeMock.mockResolvedValueOnce({ data: { articles: [] }, error: null });
    invokeMock.mockResolvedValueOnce({ data: {}, error: null });
    const res = await generateEnhancedAIResponseWithVariant('m3', 'general', []);
    expect(res).toContain('Beklager');
  });
});

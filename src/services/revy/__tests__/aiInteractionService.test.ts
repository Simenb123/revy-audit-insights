import { describe, it, expect, vi, beforeEach } from 'vitest';

const invokeMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: getUserMock },
    functions: { invoke: invokeMock }
  },
  isSupabaseConfigured: true
}));

// helper to load service after mocks are applied
const loadService = async () => await import('../aiInteractionService');

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
});

describe('generateAIResponse', () => {
  it('returns AI response on success', async () => {
    invokeMock.mockResolvedValue({ data: { response: 'hello' }, error: null });
    const { generateAIResponse } = await loadService();
    const res = await generateAIResponse('hi', 'general', []);
    expect(res).toBe('hello');
  });

  it('returns fallback on auth error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'AuthError: 401' } });
    const { generateAIResponse } = await loadService();
    const res = await generateAIResponse('hi', 'general', []);
    expect(res).toContain('Beklager');
  });

  it('returns fallback on missing response', async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const { generateAIResponse } = await loadService();
    const res = await generateAIResponse('hi', 'general', []);
    expect(res).toContain('Beklager');
  });
});

describe('getRelevantKnowledge', () => {
  it('fetches article titles from knowledge-search', async () => {
    invokeMock.mockResolvedValue({ data: { articles: [{ id: 1, title: 'Art' }] }, error: null });
    const { getRelevantKnowledge } = await loadService();
    const res = await getRelevantKnowledge('query', 'general' as any);
    expect(res).toEqual(['Art']);
    expect(invokeMock).toHaveBeenCalledWith('knowledge-search', expect.objectContaining({ body: { query: 'query' } }));
  });
});

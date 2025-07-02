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

import { performEnhancedSearch } from '../enhancedSearchLogging';

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: '1' } } });
});

describe('performEnhancedSearch', () => {
  it('returns articles on success', async () => {
    invokeMock.mockResolvedValue({ data: { articles: [{ id: '1', title: 'A' }], tagMapping: { a: 1 } }, error: null });
    const res = await performEnhancedSearch('q');
    expect(res.articles.length).toBe(1);
    expect(res.tagMapping).toEqual({ a: 1 });
  });

  it('throws when invocation fails', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail' } });
    await expect(performEnhancedSearch('q')).rejects.toThrow('fail');
  });

  it('handles missing fields', async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const res = await performEnhancedSearch('q');
    expect(res.articles).toEqual([]);
    expect(res.tagMapping).toEqual({});
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: invokeMock } },
  isSupabaseConfigured: true
}));

import { generateEmbeddingsForExistingArticles } from '../generateEmbeddingsService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateEmbeddingsForExistingArticles', () => {
  it('returns success on valid response', async () => {
    invokeMock.mockResolvedValue({ data: { processed: 2, errors: 0, message: 'ok' }, error: null });
    const res = await generateEmbeddingsForExistingArticles();
    expect(res).toEqual({ success: true, processed: 2, errors: 0, message: 'ok' });
  });

  it('returns failure on invocation error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const res = await generateEmbeddingsForExistingArticles();
    expect(res.success).toBe(false);
    expect(res.message).toBe('fail');
  });

  it('handles missing fields', async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const res = await generateEmbeddingsForExistingArticles();
    expect(res.success).toBe(true);
    expect(res.processed).toBe(0);
  });
});

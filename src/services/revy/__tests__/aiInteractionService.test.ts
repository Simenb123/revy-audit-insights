import { describe, it, expect, vi, beforeEach } from 'vitest';

let invokeMock: any;
let getUserMock: any;

vi.mock('@/integrations/supabase/client', () => {
  invokeMock = vi.fn();
  getUserMock = vi.fn();
  return {
    supabase: {
      auth: { getUser: getUserMock },
      functions: { invoke: invokeMock }
    },
    isSupabaseConfigured: true
  };
});

import { generateAIResponse } from '../aiInteractionService';

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
});

describe('generateAIResponse', () => {
  it('returns AI response on success', async () => {
    invokeMock.mockResolvedValue({ data: { response: 'hello' }, error: null });
    const res = await generateAIResponse('hi', 'general', []);
    expect(res).toBe('hello');
  });

  it('returns fallback on auth error', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'AuthError: 401' } });
    const res = await generateAIResponse('hi', 'general', []);
    expect(res).toContain('Beklager');
  });

  it('returns fallback on missing response', async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const res = await generateAIResponse('hi', 'general', []);
    expect(res).toContain('Beklager');
  });
});

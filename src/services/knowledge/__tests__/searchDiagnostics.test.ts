import { describe, it, expect, vi, beforeEach } from 'vitest';

var invokeMock: any;

vi.mock('@/integrations/supabase/client', () => {
  invokeMock = vi.fn();
  return {
    supabase: { functions: { invoke: invokeMock }, auth: { getUser: vi.fn() } },
    isSupabaseConfigured: true
  };
});

import { KnowledgeSearchDiagnostics } from '../searchDiagnostics';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('KnowledgeSearchDiagnostics.testSingleQuery', () => {
  it('returns diagnostic data on success', async () => {
    invokeMock.mockResolvedValue({ data: { articles: [{ similarity: 0.8 }, { similarity: 0.6 }] }, error: null });
    const res = await KnowledgeSearchDiagnostics.testSingleQuery('q');
    expect(res.totalResults).toBe(2);
    expect(res.errors.length).toBe(0);
  });

  it('includes error message when invocation fails', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const res = await KnowledgeSearchDiagnostics.testSingleQuery('q');
    expect(res.errors[0]).toContain('fail');
  });

  it('warns when no results returned', async () => {
    invokeMock.mockResolvedValue({ data: { articles: [] }, error: null });
    const res = await KnowledgeSearchDiagnostics.testSingleQuery('q');
    expect(res.totalResults).toBe(0);
    expect(res.warnings).toContain('No results returned for query');
  });
});

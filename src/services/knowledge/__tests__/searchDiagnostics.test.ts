import { describe, it, expect, vi, beforeEach } from 'vitest';

var invokeMock: any;
var fromMock: any;

vi.mock('@/integrations/supabase/client', () => {
  invokeMock = vi.fn();
  fromMock = vi.fn();
  return {
    supabase: {
      functions: { invoke: invokeMock },
      auth: { getUser: vi.fn() },
      from: fromMock
    },
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

  it('records timeout errors', async () => {
    const err = new Error('Timeout');
    // Vitest doesn't set name on Error, assign to mimic AbortError
    (err as any).name = 'AbortError';
    invokeMock.mockRejectedValue(err);
    const res = await KnowledgeSearchDiagnostics.testSingleQuery('q');
    expect(res.errors).toContain('Timeout');
  });
});

describe('KnowledgeSearchDiagnostics.runHealthCheck', () => {
  const setupCounts = () => {
    fromMock.mockReset();
    fromMock
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ count: 2 })
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 1 })
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({ count: 1 })
      });
  };

  it('returns error status on invoke error', async () => {
    setupCounts();
    invokeMock.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const res = await KnowledgeSearchDiagnostics.runHealthCheck();
    expect(res.searchFunctionStatus).toBe('error');
  });

  it('returns error status on invalid token', async () => {
    setupCounts();
    const authErr = new Error('AuthApiError: invalid token');
    invokeMock.mockRejectedValue(authErr);
    const res = await KnowledgeSearchDiagnostics.runHealthCheck();
    expect(res.searchFunctionStatus).toBe('error');
  });
});

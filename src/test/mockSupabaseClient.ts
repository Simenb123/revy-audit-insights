import { vi } from 'vitest';

export const setupSupabaseMock = () => {
  const fromMock = vi.fn();
  const invokeMock = vi.fn();
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: { from: fromMock, functions: { invoke: invokeMock } },
    isSupabaseConfigured: true
  }));
  return { fromMock, invokeMock };
};

export const createQueryResponse = (data: any) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
  then: (resolve: any) => Promise.resolve({ data, error: null }).then(resolve)
});

import { describe, it, expect, vi, beforeEach } from 'vitest'

const invokeMock = vi.hoisted(() => vi.fn())
const updateMock = vi.hoisted(() => vi.fn().mockReturnThis())
const eqMock = vi.hoisted(() => vi.fn().mockReturnThis())
const fromMock = vi.hoisted(() => vi.fn().mockReturnValue({ update: updateMock, eq: eqMock }))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: invokeMock },
    from: fromMock
  },
  isSupabaseConfigured: true
}))

import { analyzeDocumentWithAI, updateDocumentWithAnalysis } from '../documentAnalysisService'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.VITE_USE_ENHANCED_ANALYSIS = 'false'
})

describe('document analysis pipeline', () => {
  it('invokes analyzer and updates document', async () => {
    invokeMock.mockResolvedValue({ data: { analysis: 'ok' }, error: null })

    const result = await analyzeDocumentWithAI({ documentId: '1', fileName: 'doc.pdf', extractedText: 'text' })
    await updateDocumentWithAnalysis(result)

    expect(invokeMock).toHaveBeenCalledWith('document-ai-analyzer', expect.anything())
    expect(fromMock).toHaveBeenCalledWith('client_documents_files')
    expect(updateMock).toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith('id', '1')
  })
})

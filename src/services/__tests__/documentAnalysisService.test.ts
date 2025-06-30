import { describe, it, expect, vi, beforeEach } from 'vitest'

var invokeMock: any
var updateMock: any
var eqMock: any
var fromMock: any

vi.mock('@/integrations/supabase/client', () => {
  invokeMock = vi.fn()
  updateMock = vi.fn().mockReturnThis()
  eqMock = vi.fn().mockReturnThis()
  fromMock = vi.fn().mockReturnValue({ update: updateMock, eq: eqMock })
  return {
    supabase: {
      functions: { invoke: invokeMock },
      from: fromMock
    },
    isSupabaseConfigured: true
  }
})

import { analyzeDocumentWithAI, updateDocumentWithAnalysis } from '../documentAnalysisService'

beforeEach(() => {
  vi.clearAllMocks()
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

import { describe, it, expect } from 'vitest'
import { generateDocumentInsights, getContextualDocumentSuggestions, generateSmartDocumentPrompt } from '../documentAIService'
import type { ClientDocument } from '@/hooks/useClientDocuments'

const createDoc = (overrides: Partial<ClientDocument> = {}): ClientDocument => ({
  id: 'id',
  client_id: 'client',
  user_id: 'user',
  file_name: 'file.pdf',
  file_path: '/file.pdf',
  file_size: 1,
  mime_type: 'application/pdf',
  created_at: '',
  updated_at: '',
  ...overrides
} as ClientDocument)

describe('document AI service edge cases', () => {
  describe('generateDocumentInsights', () => {
    it('detects uncategorized and low confidence documents', async () => {
      const docs = [
        createDoc({ id: '1', category: undefined, ai_confidence_score: 0.5 }),
        createDoc({ id: '2', category: 'finance', ai_confidence_score: 0.9 })
      ]
      const insights = await generateDocumentInsights({
        documents: docs,
        clientId: 'client',
        userContext: 'test'
      })
      expect(insights).toHaveLength(2)
      expect(insights[0].type).toBe('category_suggestion')
      expect(insights[1].type).toBe('quality_check')
    })

    it('returns empty list when documents are categorized with high confidence', async () => {
      const docs = [createDoc({ id: '1', category: 'finance', ai_confidence_score: 0.9 })]
      const insights = await generateDocumentInsights({
        documents: docs,
        clientId: 'client',
        userContext: 'test'
      })
      expect(insights).toHaveLength(0)
    })
  })

  describe('getContextualDocumentSuggestions', () => {
    it('suggests uploading documents when none are present', async () => {
      const suggestions = await getContextualDocumentSuggestions('?', [], 'documentation')
      expect(suggestions[0]).toBe('Hvilke dokumenter bør jeg laste opp først?')
      expect(suggestions).toHaveLength(4)
    })

    it('prioritizes categorization for uncategorized documents', async () => {
      const docs = [
        createDoc({ id: '1' }),
        createDoc({ id: '2', category: 'finance' })
      ]
      const suggestions = await getContextualDocumentSuggestions('?', docs, 'documentation')
      expect(suggestions[0]).toBe('Kategoriser 1 ukategoriserte dokumenter')
    })
  })

  describe('generateSmartDocumentPrompt', () => {
    it('handles documents without categories and low AI score', () => {
      const docs = [
        createDoc({ id: '1', ai_confidence_score: 0.5 }),
        createDoc({ id: '2', ai_confidence_score: 0.4 })
      ]
      const prompt = generateSmartDocumentPrompt('Hei', docs, 'documentation')
      expect(prompt).toContain('Totalt dokumenter: 2')
      expect(prompt).toContain('Kategoriserte: 0')
      expect(prompt).toContain('Høy AI-sikkerhet: 0')
      expect(prompt).toContain('Kategorier: Ingen')
      expect(prompt).toContain('Fagområder: Ingen')
    })
  })
})


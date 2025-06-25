import { describe, it, expect } from 'vitest'
import { validateAIResponse } from '../supabase/functions/revy-ai-chat/lib/response-validator'

describe('validateAIResponse', () => {
  it('injects EMNER tags when missing', () => {
    const raw = 'Dette er et svar om ISA 315 risikovurdering.'
    const result = validateAIResponse(raw)
    expect(result.isValid).toBe(true)
    expect(result.fixedResponse).toBeDefined()
    expect(result.fixedResponse).toMatch(/🏷️ \*\*EMNER:\*\*/)
  })
})

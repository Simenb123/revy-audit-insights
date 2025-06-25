import { describe, it, expect } from 'vitest'
import { createTagMapping } from '../supabase/functions/knowledge-search/helpers'

// Simple unit test for the tag mapping helper

describe('createTagMapping', () => {
  it('maps keywords to best matching articles', () => {
    const articles = [
      {
        id: 1,
        slug: 'isa-315',
        title: 'ISA 315 Risikovurdering',
        summary: 'Revisjonsstandard for risikovurdering',
        reference_code: 'ISA 315',
        category: { name: 'Audit' }
      },
      {
        id: 2,
        slug: 'isa-240',
        title: 'ISA 240 Misligheter',
        summary: 'Revisjonsstandard om misligheter',
        reference_code: 'ISA 240',
        category: { name: 'Audit' }
      }
    ]

    const mapping = createTagMapping(articles, ['ISA 315', 'misligheter'])
    expect(mapping['ISA 315'].articleSlug).toBe('isa-315')
    expect(mapping['misligheter'].articleSlug).toBe('isa-240')
  })
})

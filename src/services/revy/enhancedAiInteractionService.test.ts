import { describe, it, expect } from 'vitest'
import {
  generateRequestHash,
  cacheResponse,
  getCachedResponse
} from './enhancedAiInteractionService'

// Basic tests for caching and hashing

describe('enhancedAiInteractionService cache', () => {
  it('generates consistent request hashes', () => {
    const a = generateRequestHash('msg', 'ctx', '1', 'v1')
    const b = generateRequestHash('msg', 'ctx', '1', 'v1')
    expect(a).toBe(b)
  })

  it('differentiates hashes for different input', () => {
    const a = generateRequestHash('msg1', 'ctx', '1', 'v1')
    const b = generateRequestHash('msg2', 'ctx', '1', 'v1')
    expect(a).not.toBe(b)
  })

  it('stores and retrieves cached responses', async () => {
    const hash = generateRequestHash('hello', 'ctx')
    await cacheResponse(hash, 'cached')
    const cached = await getCachedResponse(hash)
    expect(cached).toBe('cached')
  })
})

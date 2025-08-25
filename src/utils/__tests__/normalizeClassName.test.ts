import { describe, it, expect } from 'vitest'
import { normalizeClassName, getUniqueShareClasses } from '../normalizeClassName'

describe('normalizeClassName', () => {
  it('should normalize A-aksjer to A', () => {
    expect(normalizeClassName('A-aksjer')).toBe('A')
    expect(normalizeClassName('B-AKSJER')).toBe('B')
    expect(normalizeClassName('A AKSJER')).toBe('A')
  })

  it('should normalize ordinære aksjer to ORDINÆR', () => {
    expect(normalizeClassName('Ordinære aksjer')).toBe('ORDINÆR')
    expect(normalizeClassName('ORDINARY')).toBe('ORDINÆR')
    expect(normalizeClassName('vanlig')).toBe('ORDINÆR')
  })

  it('should normalize preferanseaksjer to PREF', () => {
    expect(normalizeClassName('Preferanseaksjer')).toBe('PREF')
    expect(normalizeClassName('PREFERENCE')).toBe('PREF')
    expect(normalizeClassName('pref')).toBe('PREF')
  })

  it('should keep ISIN codes unchanged', () => {
    expect(normalizeClassName('NO0011008971')).toBe('NO0011008971')
    expect(normalizeClassName('US0378331005')).toBe('US0378331005')
  })

  it('should handle fallback cases', () => {
    expect(normalizeClassName('Aksjer')).toBe('ORDINÆR')
    expect(normalizeClassName('')).toBe('ORDINÆR')
    expect(normalizeClassName('Unknown Class')).toBe('UNKNOWN CLASS')
  })
})

describe('getUniqueShareClasses', () => {
  it('should extract unique share classes', () => {
    const companies = [
      { share_classes: { 'A': 100, 'ORDINÆR': 200 } },
      { share_classes: { 'B': 50, 'ORDINÆR': 150 } },
      { share_classes: { 'PREF': 25 } }
    ]

    const result = getUniqueShareClasses(companies)
    expect(result).toEqual(['ORDINÆR', 'A', 'B', 'PREF'])
  })

  it('should handle empty input', () => {
    expect(getUniqueShareClasses([])).toEqual([])
  })

  it('should handle companies without share_classes', () => {
    const companies = [{ name: 'Test Corp' }, { share_classes: { 'A': 100 } }]
    const result = getUniqueShareClasses(companies)
    expect(result).toEqual(['A'])
  })
})
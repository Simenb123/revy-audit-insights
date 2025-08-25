/**
 * Normaliserer aksjeklassenavn til standard format
 * Brukes for å sikre konsistent kategorisering på tvers av forskjellige datakilder
 */
export function normalizeClassName(className: string): string {
  if (!className) return 'ORDINÆR'
  
  const normalized = className.toUpperCase().trim()
  
  // A-aksjer, B-aksjer etc.
  if (/^[A-Z]-?AKSJER?$/i.test(normalized)) {
    return normalized.charAt(0)
  }
  
  // Ordinære aksjer
  if (/ORDINÆR|ORDINARY|VANLIG/i.test(normalized)) {
    return 'ORDINÆR'
  }
  
  // Preferanseaksjer
  if (/PREFERANSE|PREFERENCE|PREF/i.test(normalized)) {
    return 'PREF'
  }
  
  // ISIN-koder beholdes som de er
  if (/^[A-Z]{2}[0-9A-Z]{10}$/.test(normalized)) {
    return normalized
  }
  
  // Fallback for generiske navr
  if (normalized === 'AKSJER') {
    return 'ORDINÆR'
  }
  
  return normalized
}

/**
 * Henter alle unike aksjeklasser fra en liste av selskaper
 */
export function getUniqueShareClasses(companies: Array<{ share_classes?: Record<string, number> }>): string[] {
  const classes = new Set<string>()
  
  companies.forEach(company => {
    if (company.share_classes) {
      Object.keys(company.share_classes).forEach(cls => classes.add(cls))
    }
  })
  
  // Sorter: ORDINÆR først, så alfabetisk
  return Array.from(classes).sort((a, b) => {
    if (a === 'ORDINÆR') return -1
    if (b === 'ORDINÆR') return 1
    return a.localeCompare(b)
  })
}
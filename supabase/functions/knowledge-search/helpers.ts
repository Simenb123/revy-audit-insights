export interface Article {
  slug: string
  title: string
  summary?: string
  reference_code?: string
  category?: { name: string }
}

/**
 * Create a mapping from keywords to matching articles.
 */
export function createTagMapping(articles: Article[], keywords: string[]) {
  const mapping: Record<string, any> = {}

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    let bestMatch: Article | null = null
    let bestScore = 0

    articles.forEach(article => {
      let score = 0
      if (article.title && article.title.toLowerCase().includes(keywordLower)) score += 5
      if (article.reference_code && article.reference_code.toLowerCase().includes(keywordLower)) score += 4
      if (article.summary && article.summary.toLowerCase().includes(keywordLower)) score += 2

      if (score > bestScore) {
        bestScore = score
        bestMatch = article
      }
    })

    if (bestMatch && bestScore > 0) {
      mapping[keyword] = {
        articleSlug: bestMatch.slug,
        articleTitle: bestMatch.title,
        matchedTags: [],
        relevanceScore: bestScore,
        contentType: 'fagartikkel',
        category: bestMatch.category?.name || 'Ukategoriseret'
      }
    }
  })

  return mapping
}

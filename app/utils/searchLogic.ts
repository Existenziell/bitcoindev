export type IndexEntry = {
  path: string
  title: string
  section: string
  body: string
  keywords?: string[]
}

export type SearchResult = {
  path: string
  title: string
  section: string
  snippet: string
}

export const SNIPPET_LEN = 80
export const MAX_RESULTS = 20
export const DEBOUNCE_MS = 180
export const MIN_QUERY_LEN = 2

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '')
}

/**
 * Enhanced ranking function with phrase matching and multi-factor scoring.
 * Returns a score from 0-10, with higher scores being more relevant.
 */
export function rank(rec: IndexEntry, query: string, tokens: string[]): number {
  const lowerQuery = query.toLowerCase()
  const lowerTitle = rec.title.toLowerCase()
  const lowerBody = rec.body.toLowerCase()
  const lowerKeywords = (rec.keywords ?? []).map(k => k.toLowerCase()).join(' ')

  // Phrase match in title: 10 points
  if (lowerTitle.includes(lowerQuery)) {
    return 10
  }

  // Phrase match in keywords: 9 points
  if (lowerKeywords.includes(lowerQuery)) {
    return 9
  }

  // All tokens in title (in order): 8 points
  const titleWords = lowerTitle.split(/\s+/)
  if (tokens.length > 1) {
    let titleIndex = 0
    let allFoundInOrder = true
    for (const token of tokens) {
      const foundIndex = titleWords.findIndex((w, i) => i >= titleIndex && w.includes(token))
      if (foundIndex === -1) {
        allFoundInOrder = false
        break
      }
      titleIndex = foundIndex + 1
    }
    if (allFoundInOrder) {
      return 8
    }
  }

  // All tokens in title (any order): 7 points
  const nTitle = normalize(rec.title)
  if (tokens.every(t => nTitle.includes(normalize(t)))) {
    return 7
  }

  // Phrase match in body: 6 points
  if (lowerBody.includes(lowerQuery)) {
    return 6
  }

  // All tokens in body (close together): 5 points
  if (tokens.length > 1) {
    const bodyWords = lowerBody.split(/\s+/)
    let minDistance = Infinity
    for (let i = 0; i < bodyWords.length; i++) {
      if (bodyWords[i].includes(tokens[0])) {
        let foundAll = true
        let maxIndex = i
        for (let j = 1; j < tokens.length; j++) {
          const foundIndex = bodyWords.findIndex((w, idx) => idx > maxIndex && w.includes(tokens[j]))
          if (foundIndex === -1) {
            foundAll = false
            break
          }
          maxIndex = foundIndex
        }
        if (foundAll) {
          const distance = maxIndex - i
          minDistance = Math.min(minDistance, distance)
        }
      }
    }
    if (minDistance < 10) { // Words within 10 positions
      return 5
    }
  }

  // All tokens in body (anywhere): 4 points
  if (tokens.every(t => lowerBody.includes(t))) {
    return 4
  }

  // Partial matches: 1-3 points
  const matchedTokens = tokens.filter(t => {
    return lowerTitle.includes(t) || lowerKeywords.includes(t) || lowerBody.includes(t)
  }).length
  if (matchedTokens > 0) {
    return Math.max(1, Math.floor((matchedTokens / tokens.length) * 3))
  }

  return 0
}

export function snippet(body: string): string {
  if (!body) return ''
  if (body.length <= SNIPPET_LEN) return body
  const cut = body.slice(0, SNIPPET_LEN)
  const last = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '))
  if (last > SNIPPET_LEN * 0.5) return cut.slice(0, last + 1) + '…'
  return cut.trim() + '…'
}

type Row = SearchResult & { rank: number }

/**
 * Deduplicate results by removing overview pages when specific child results exist.
 * For example, if we have results for specific people, remove the /docs/history/people overview page.
 * Also: if we have results for a doc page and for section(s) of that page (path#fragment), drop the page-level result.
 */
function deduplicateResults(rows: Row[]): Row[] {
  const _resultPaths = new Set(rows.map(r => r.path))
  const filtered: Row[] = []
  const overviewPagesToCheck = ['/docs/history/people']

  for (const row of rows) {
    // Check if this is an overview page that should be excluded
    let shouldExclude = false
    for (const overviewPath of overviewPagesToCheck) {
      if (row.path === overviewPath) {
        // Check if we have specific child results
        if (overviewPath === '/docs/history/people') {
          const hasSpecificPeople = rows.some(r =>
            r.path.startsWith('/docs/history/people#') && r.path !== overviewPath
          )
          if (hasSpecificPeople) {
            shouldExclude = true
            break
          }
        }
      }
    }
    // Drop page-level result when we have section results for the same page (path#fragment)
    if (!shouldExclude && !row.path.includes('#')) {
      const hasSectionResult = rows.some(r => r.path.startsWith(row.path + '#'))
      if (hasSectionResult) {
        shouldExclude = true
      }
    }
    if (!shouldExclude) {
      filtered.push(row)
    }
  }

  return filtered
}

// LRU cache implementation for search results
class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value === undefined) {
      return undefined
    }
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing: move to end
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }
}

// Result cache to avoid re-searching identical queries
const resultCache = new LRUCache<string, SearchResult[]>(100)

export function search(
  q: string,
  index: IndexEntry[]
): SearchResult[] {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []

  // Check cache first
  const cacheKey = q.toLowerCase().trim()
  const cachedResult = resultCache.get(cacheKey)
  if (cachedResult !== undefined) {
    return cachedResult
  }

  const pageRows: Row[] = []
  const peopleRows: Row[] = []

  // Track high-ranking results for early termination
  let highRankCount = 0
  const HIGH_RANK_THRESHOLD = 7 // Rank >= 7 is considered high
  const EARLY_TERMINATION_THRESHOLD = MAX_RESULTS * 2 // Stop after finding 2x the needed results

  // Pre-compute searchable text once per entry for better performance
  for (const rec of index) {
    const searchableText = (
      rec.title + ' ' + 
      rec.body + ' ' + 
      (rec.keywords ?? []).join(' ')
    ).toLowerCase()

    // Check if all tokens appear in the searchable text
    if (!tokens.every((t) => searchableText.includes(t))) continue

    const row: Row = {
      path: rec.path,
      title: rec.title,
      section: rec.section,
      snippet: snippet(rec.body) || rec.title,
      rank: rank(rec, q, tokens),
    }

    // Only add if rank > 0 (has some relevance)
    if (row.rank > 0) {
      if (row.rank >= HIGH_RANK_THRESHOLD) {
        highRankCount++
      }
      if (rec.path.startsWith('/docs/history/people#')) {
        peopleRows.push(row)
      } else {
        pageRows.push(row)
      }
    }

    // Early termination: if we have enough high-ranking results and processed enough entries
    // This is a heuristic - we still want to check a reasonable number of entries
    if (highRankCount >= MAX_RESULTS && (pageRows.length + peopleRows.length) >= EARLY_TERMINATION_THRESHOLD) {
      break
    }
  }

  // Sort by rank (highest first)
  pageRows.sort((a, b) => b.rank - a.rank)
  peopleRows.sort((a, b) => b.rank - a.rank)

  // Combine results: pages first, then people
  const allResults = [...pageRows, ...peopleRows]

  // Deduplicate overview pages
  const deduplicated = deduplicateResults(allResults)

  // Return top MAX_RESULTS
  const results = deduplicated
    .slice(0, MAX_RESULTS)
    .map(({ rank: _r, ...r }) => r)

  // Cache results (LRU handles size limit automatically)
  resultCache.set(cacheKey, results)

  return results
}

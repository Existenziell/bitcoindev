import { describe, it, expect } from 'vitest'
import { normalize, rank, snippet, search } from '@/app/utils/searchLogic'
import type { IndexEntry } from '@/app/utils/searchLogic'

describe('normalize', () => {
  it('"  Foo-Bar  " → "foobar"', () => {
    expect(normalize('  Foo-Bar  ')).toBe('foobar')
  })
})

describe('rank', () => {
  it('returns 10 when phrase matches in title', () => {
    const rec: IndexEntry = { path: '/a', title: 'Exact Title Match', section: 's', body: 'x' }
    expect(rank(rec, 'Exact Title Match', ['exact', 'title', 'match'])).toBe(10)
  })

  it('returns 9 when phrase matches in keywords', () => {
    const rec: IndexEntry = {
      path: '/a',
      title: 'Other',
      section: 's',
      body: 'x',
      keywords: ['exact key phrase'],
    }
    expect(rank(rec, 'exact key phrase', ['exact', 'key', 'phrase'])).toBe(9)
  })

  it('returns 10 when phrase matches in title', () => {
    const rec: IndexEntry = { path: '/a', title: 'Partial Match Here', section: 's', body: 'x' }
    expect(rank(rec, 'partial match', ['partial', 'match'])).toBe(10)
  })

  it('returns 7 when all tokens in title but not as phrase', () => {
    const rec: IndexEntry = { path: '/a', title: 'Match Partial Here', section: 's', body: 'x' }
    expect(rank(rec, 'partial match', ['partial', 'match'])).toBe(7)
  })

  it('returns 5 when tokens in body are close together', () => {
    const rec: IndexEntry = { path: '/a', title: 'Other', section: 's', body: 'some body text with match' }
    expect(rank(rec, 'body match', ['body', 'match'])).toBe(5)
  })

  it('returns 4 when all tokens in body but far apart', () => {
    const rec: IndexEntry = { 
      path: '/a', 
      title: 'Other', 
      section: 's', 
      body: 'some body text with many many many many many many many many many many words in between and then match appears later' 
    }
    expect(rank(rec, 'body match', ['body', 'match'])).toBe(4)
  })

  it('returns 0 when no match', () => {
    const rec: IndexEntry = { path: '/a', title: 'Other', section: 's', body: 'x' }
    expect(rank(rec, 'nomatch', ['nomatch'])).toBe(0)
  })
})

describe('snippet', () => {
  it('returns body when short', () => {
    expect(snippet('Short.')).toBe('Short.')
  })

  it('truncates with … when long', () => {
    const long = 'a'.repeat(200)
    const result = snippet(long)
    expect(result.length).toBeLessThan(long.length)
    expect(result.endsWith('…')).toBe(true)
  })
})

describe('search', () => {
  const fixture: IndexEntry[] = [
    { path: '/docs/bitcoin', title: 'Bitcoin Protocol', section: 'bitcoin', body: 'The Bitcoin protocol overview. Bitcoin.' },
    { path: '/philosophy/fundamentals', title: 'Fundamentals', section: 'fundamentals', body: 'Bitcoin fundamentals. Learn about Bitcoin.' },
    { path: '/other', title: 'Other', section: 'x', body: 'No bitcoin here.' },
  ]

  it('returns non-empty list for "bitcoin"', () => {
    const results = search('bitcoin', fixture)
    expect(results.length).toBeGreaterThan(0)
  })

  it('ranks exact-title match first for "bitcoin"', () => {
    const results = search('bitcoin', fixture)
    expect(results[0].title).toBe('Bitcoin Protocol')
  })

  it('each result has path, title, section, snippet', () => {
    const results = search('bitcoin', fixture)
    for (const r of results) {
      expect(r).toHaveProperty('path')
      expect(r).toHaveProperty('title')
      expect(r).toHaveProperty('section')
      expect(r).toHaveProperty('snippet')
      expect(r.snippet.length).toBeGreaterThan(0)
    }
  })
})

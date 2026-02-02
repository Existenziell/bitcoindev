import { describe, it, expect } from 'vitest'
import { excerpt, parseH2Sections, parsePeopleSections } from '@/scripts/lib/search-index-helpers.js'

describe('excerpt', () => {
  it('returns as-is when short or under maxLen', () => {
    expect(excerpt('Short.')).toBe('Short.')
    expect(excerpt('x'.repeat(100), 500)).toBe('x'.repeat(100))
  })
  it('returns empty string for null/undefined', () => {
    expect(excerpt(null)).toBe('')
    expect(excerpt(undefined)).toBe('')
  })
  it('truncates at sentence or word boundary when over maxLen', () => {
    const long = 'First. Second. ' + 'a'.repeat(500)
    const out = excerpt(long, 50)
    expect(out.length).toBeLessThan(long.length)
    expect(out.length).toBeLessThanOrEqual(51)
  })
  it('appends … when cutting at word boundary (no . or space in second half)', () => {
    const noLateSpace = 'one two three ' + 'a'.repeat(400)
    const out = excerpt(noLateSpace, 30)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('parsePeopleSections', () => {
  it('returns [] for null or empty', () => {
    expect(parsePeopleSections(null)).toEqual([])
    expect(parsePeopleSections('')).toEqual([])
  })
  it('splits on ## and extracts slug, title, body', () => {
    const md = `Intro text.

## Alice

Alice bio here.

## Bob

Bob bio.`
    const sections = parsePeopleSections(md)
    expect(sections.length).toBe(2)
    expect(sections[0].slug).toBe('alice')
    expect(sections[0].title).toBe('Alice')
    expect(sections[0].body).toContain('Alice bio')
    expect(sections[1].slug).toBe('bob')
    expect(sections[1].title).toBe('Bob')
    expect(sections[1].body).toContain('Bob bio')
  })
  it('filters out slug "you"', () => {
    const md = `## You

Your entry.`
    const sections = parsePeopleSections(md)
    expect(sections.length).toBe(0)
  })
})

describe('parseH2Sections', () => {
  it('returns [] for null or empty', () => {
    expect(parseH2Sections(null)).toEqual([])
    expect(parseH2Sections('')).toEqual([])
  })
  it('extracts one H2 with slug, title, body', () => {
    const md = `Intro before first H2.

## The Orange Pill

The orange pill refers to the process of waking up to Bitcoin.`
    const sections = parseH2Sections(md)
    expect(sections.length).toBe(1)
    expect(sections[0].slug).toBe('the-orange-pill')
    expect(sections[0].title).toBe('The Orange Pill')
    expect(sections[0].body).toContain('orange pill')
  })
  it('extracts multiple H2s with correct slug, title, body', () => {
    const md = `Preamble.

## First Section

First body text.

## Second Section

Second body.`
    const sections = parseH2Sections(md)
    expect(sections.length).toBe(2)
    expect(sections[0].slug).toBe('first-section')
    expect(sections[0].title).toBe('First Section')
    expect(sections[0].body).toContain('First body')
    expect(sections[1].slug).toBe('second-section')
    expect(sections[1].title).toBe('Second Section')
    expect(sections[1].body).toContain('Second body')
  })
})

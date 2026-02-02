import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseGlossaryContent } from '@/scripts/lib/parse-glossary.js'

describe('parseGlossaryContent', () => {
  it('returns empty array for empty content', () => {
    expect(parseGlossaryContent('')).toEqual([])
  })

  it('returns empty array for content with no ## or ###', () => {
    expect(parseGlossaryContent('Some text\nwithout headers.')).toEqual([])
  })

  it('parses a single section and term with definition', () => {
    const content = `## A

### Address
A public identifier where Bitcoin can be received.
`
    const sections = parseGlossaryContent(content)
    expect(sections).toHaveLength(1)
    expect(sections[0]).toMatchObject({ letter: 'A', slug: 'a' })
    expect(sections[0].entries).toHaveLength(1)
    expect(sections[0].entries[0]).toMatchObject({
      term: 'Address',
      slug: 'address',
      definition: 'A public identifier where Bitcoin can be received.'
    })
    expect(sections[0].entries[0].relatedArticle).toBeUndefined()
  })

  it('extracts related comment and strips it from definition', () => {
    const content = `## A

### 2-of-3 Multisig
A common multisignature configuration.
<!-- related: /docs/wallets/multisig -->
`
    const sections = parseGlossaryContent(content)
    expect(sections).toHaveLength(1)
    expect(sections[0].entries[0]).toMatchObject({
      term: '2-of-3 Multisig',
      slug: '2-of-3-multisig',
      definition: 'A common multisignature configuration.',
      relatedArticle: '/docs/wallets/multisig'
    })
  })

  it('parses multiple sections and terms', () => {
    const content = `## 0-9

### 51% Attack
A theoretical attack.

### 21 Million
The maximum supply.

## A

### ASIC
Application-Specific Integrated Circuit.
`
    const sections = parseGlossaryContent(content)
    expect(sections).toHaveLength(2)

    expect(sections[0].letter).toBe('0-9')
    expect(sections[0].slug).toBe('0-9')
    expect(sections[0].entries).toHaveLength(2)
    expect(sections[0].entries[0].term).toBe('51% Attack')
    expect(sections[0].entries[0].definition).toBe('A theoretical attack.')
    expect(sections[0].entries[1].term).toBe('21 Million')
    expect(sections[0].entries[1].definition).toBe('The maximum supply.')

    expect(sections[1].letter).toBe('A')
    expect(sections[1].entries).toHaveLength(1)
    expect(sections[1].entries[0].term).toBe('ASIC')
    expect(sections[1].entries[0].definition).toBe('Application-Specific Integrated Circuit.')
  })

  it('preserves multiline definitions', () => {
    const content = `## A

### Atomic Swap
A peer-to-peer exchange.
<!-- related: /docs/advanced/atomic-swaps -->
Atomic swaps use hash time-locked contracts (HTLCs).
`
    const sections = parseGlossaryContent(content)
    expect(sections[0].entries[0].definition).toBe(
      'A peer-to-peer exchange.\nAtomic swaps use hash time-locked contracts (HTLCs).'
    )
    expect(sections[0].entries[0].relatedArticle).toBe('/docs/advanced/atomic-swaps')
  })

  it('produces same structure as real terms.md', () => {
    const termsPath = path.join(process.cwd(), 'app/docs/glossary/terms.md')
    const content = fs.readFileSync(termsPath, 'utf-8')
    const sections = parseGlossaryContent(content)

    expect(sections.length).toBeGreaterThan(0)
    for (const section of sections) {
      expect(section).toHaveProperty('letter')
      expect(section).toHaveProperty('slug')
      expect(section).toHaveProperty('entries')
      expect(Array.isArray(section.entries)).toBe(true)
      for (const entry of section.entries) {
        expect(entry).toHaveProperty('term')
        expect(entry).toHaveProperty('slug')
        expect(entry).toHaveProperty('definition')
        expect(typeof entry.term).toBe('string')
        expect(typeof entry.slug).toBe('string')
        expect(typeof entry.definition).toBe('string')
        if (entry.relatedArticle !== undefined) {
          expect(entry.relatedArticle).toMatch(/^\/docs\//)
        }
      }
    }

    const firstSection = sections[0]
    expect(firstSection.letter).toBe('0-9')
    expect(firstSection.entries.length).toBeGreaterThan(0)
    const withRelated = firstSection.entries.find((e) => e.term === '2-of-3 Multisig')
    expect(withRelated).toBeDefined()
    expect(withRelated.relatedArticle).toBe('/docs/wallets/multisig')
  })
})

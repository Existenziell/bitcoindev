import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseDocPages } from '@/scripts/lib/parse-doc-pages.js'
import { docPages } from '@/app/utils/navigation'

const navigationPath = path.join(process.cwd(), 'app/utils/navigation.ts')
const navContent = fs.readFileSync(navigationPath, 'utf-8')
const parsed = parseDocPages(navContent)

describe('parseDocPages', () => {
  it('returns a non-empty array', () => {
    expect(parsed.length).toBeGreaterThan(0)
  })

  it('each item has path, mdFile, title, section', () => {
    for (const p of parsed) {
      expect(p).toHaveProperty('path')
      expect(p).toHaveProperty('mdFile')
      expect(p).toHaveProperty('title')
      expect(p).toHaveProperty('section')
    }
  })

  it('parsed count matches runtime docPages', () => {
    expect(parsed.length).toBe(docPages.length)
  })

  it('each parsed entry exists in docPages with same path and mdFile', () => {
    for (const p of parsed) {
      const found = docPages.some((d) => d.path === p.path && d.mdFile === p.mdFile)
      expect(found, `parsed entry path=${p.path} mdFile=${p.mdFile} not found in docPages`).toBe(true)
    }
  })

  it('includes /philosophy/fundamentals', () => {
    expect(parsed.some((p) => p.path === '/philosophy/fundamentals')).toBe(true)
  })

  it('includes /docs/bitcoin/script', () => {
    expect(parsed.some((p) => p.path === '/docs/bitcoin/script')).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { getMarkdownForPath } from '@/app/utils/getMarkdownForPath'

const mockMap: Record<string, { content: string; filename: string }> = {
  '/docs/bitcoin/script': { content: '# Bitcoin Script\n', filename: 'script.md' },
  '/philosophy/fundamentals': { content: '# Fundamentals\n', filename: 'overview.md' },
}

describe('getMarkdownForPath', () => {
  it('path missing → error status 400', () => {
    const result = getMarkdownForPath(null, mockMap)
    expect('content' in result).toBe(false)
    expect('status' in result && (result as { status: number }).status).toBe(400)
    expect('error' in result && (result as { error: string }).error).toContain('Path parameter is required')
  })

  it('path with trailing slash → normalized before lookup', () => {
    const result = getMarkdownForPath('/docs/bitcoin/script/', mockMap)
    expect(result).toEqual({ content: '# Bitcoin Script\n', filename: 'script.md' })
  })

  it('known path → content and filename', () => {
    const result = getMarkdownForPath('/docs/bitcoin/script', mockMap)
    expect(result).toEqual({ content: '# Bitcoin Script\n', filename: 'script.md' })
  })

  it('unknown path → error status 404 with path', () => {
    const result = getMarkdownForPath('/docs/nonexistent', mockMap)
    expect('content' in result).toBe(false)
    expect('status' in result && (result as { status: number }).status).toBe(404)
    expect('path' in result && (result as { path: string }).path).toBe('/docs/nonexistent')
  })
})

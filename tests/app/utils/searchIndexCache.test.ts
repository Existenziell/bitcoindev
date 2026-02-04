import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadSearchIndex,
  getCachedIndex,
  isIndexLoading,
  getIndexError,
  clearCache,
} from '@/app/utils/searchIndexCache'

vi.mock('@/app/utils/buildId', () => ({
  withBuildId: (url: string) => url,
}))

describe('searchIndexCache', () => {
  beforeEach(() => {
    clearCache()
    global.fetch = vi.fn()
  })

  it('returns null from getCachedIndex when cache is empty', () => {
    expect(getCachedIndex()).toBeNull()
  })

  it('returns false from isIndexLoading when not loading', () => {
    expect(isIndexLoading()).toBe(false)
  })

  it('returns null from getIndexError when no error', () => {
    expect(getIndexError()).toBeNull()
  })

  it('loads index via fetch and caches result', async () => {
    const mockIndex = [{ path: '/test', title: 'Test', section: 'test', body: 'body' }]
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    })

    const result = await loadSearchIndex()

    expect(result).toEqual(mockIndex)
    expect(getCachedIndex()).toEqual(mockIndex)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('returns cached index on second load without fetching', async () => {
    const mockIndex = [{ path: '/a', title: 'A', section: 's', body: 'b' }]
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    })

    await loadSearchIndex()
    const second = await loadSearchIndex()

    expect(second).toEqual(mockIndex)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('returns same promise when load is in progress', async () => {
    let resolvePromise: (value: unknown[]) => void
    const fetchPromise = new Promise<unknown[]>((resolve) => {
      resolvePromise = resolve
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      Promise.resolve({ ok: true, json: () => fetchPromise })
    )

    const p1 = loadSearchIndex()
    const p2 = loadSearchIndex()
    expect(p1).toBe(p2)
    expect(isIndexLoading()).toBe(true)

    resolvePromise!([{ path: '/x', title: 'X', section: 's', body: 'b' }])
    await p1

    expect(getCachedIndex()).toHaveLength(1)
  })

  it('throws and sets error when fetch fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false })

    await expect(loadSearchIndex()).rejects.toThrow('Failed to load search index')
    expect(getIndexError()).toBeInstanceOf(Error)
    expect(getIndexError()?.message).toBe('Failed to load search index')
  })

  it('clearCache resets state', async () => {
    const mockIndex = [{ path: '/c', title: 'C', section: 's', body: 'b' }]
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockIndex,
    })
    await loadSearchIndex()
    expect(getCachedIndex()).not.toBeNull()

    clearCache()
    expect(getCachedIndex()).toBeNull()
    expect(isIndexLoading()).toBe(false)
    expect(getIndexError()).toBeNull()
  })
})

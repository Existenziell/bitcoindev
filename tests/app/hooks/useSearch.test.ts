import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSearch } from '@/app/hooks/useSearch'
import { useSearchIndex } from '@/app/hooks/useSearchIndex'
import { search } from '@/app/utils/searchLogic'
import { handleError } from '@/app/utils/errorHandling'
import type { IndexEntry } from '@/app/utils/searchLogic'

// Mock dependencies; preserve searchLogic constants (DEBOUNCE_MS, MIN_QUERY_LEN) so debounce works
vi.mock('@/app/utils/searchLogic', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/app/utils/searchLogic')>()
  return { ...mod, search: vi.fn() }
})
vi.mock('@/app/hooks/useSearchIndex')
vi.mock('@/app/utils/errorHandling')

describe('useSearch', () => {
  const mockIndex: IndexEntry[] = [
    { path: '/docs/bitcoin', title: 'Bitcoin Protocol', section: 'bitcoin', body: 'Bitcoin overview' },
    { path: '/philosophy/fundamentals', title: 'Fundamentals', section: 'fundamentals', body: 'Fundamentals content' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useSearchIndex as any).mockReturnValue({
      index: mockIndex,
      loading: false,
      error: null,
    })
  })

  it('initializes with empty query and results', async () => {
    const { result } = renderHook(() => useSearch())

    // useSearch schedules state updates in queueMicrotask; flush them inside act
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.query).toBe('')
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('debounces search queries', async () => {
    const mockResults = [
      { path: '/docs/bitcoin', title: 'Bitcoin Protocol', section: 'bitcoin', snippet: 'Bitcoin overview' },
    ]
    ;(search as any).mockReturnValue(mockResults)

    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('bit')
    })

    expect(result.current.query).toBe('bit')
    expect(result.current.results).toEqual([]) // Not searched yet due to debounce

    // Wait for debounce (180ms)
    await waitFor(
      () => {
        expect(search).toHaveBeenCalled()
      },
      { timeout: 300 }
    )

    expect(result.current.results).toEqual(mockResults)
  })

  it('does not search if query is too short', async () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('a')
    })

    await waitFor(() => {
      expect(result.current.query).toBe('a')
    }, { timeout: 300 })

    expect(search).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  it('searches when query meets minimum length', async () => {
    const mockResults = [
      { path: '/docs/bitcoin', title: 'Bitcoin Protocol', section: 'bitcoin', snippet: 'Bitcoin overview' },
    ]
    ;(search as any).mockReturnValue(mockResults)

    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('bitcoin')
    })

    await waitFor(
      () => {
        expect(search).toHaveBeenCalledWith('bitcoin', mockIndex)
      },
      { timeout: 300 }
    )

    expect(result.current.results).toEqual(mockResults)
  })

  it('shows loading when index is not available', async () => {
    ;(useSearchIndex as any).mockReturnValue({
      index: null,
      loading: true,
      error: null,
    })

    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.loading).toBe(true)
  })

  it('shows loading when query is set but index not loaded', async () => {
    ;(useSearchIndex as any).mockReturnValue({
      index: null,
      loading: false,
      error: null,
    })

    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('bitcoin')
    })

    // Wait for debounce to complete (180ms) and loading state to update
    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    }, { timeout: 400 })
  })

  it('handles search errors gracefully', async () => {
    const searchError = new Error('Search error')
    ;(search as any).mockImplementation(() => {
      throw searchError
    })

    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('bitcoin')
    })

    // Wait for debounce to complete and search to be called (which will throw)
    await waitFor(
      () => {
        expect(handleError).toHaveBeenCalledWith(searchError, 'useSearch')
      },
      { timeout: 300 }
    )

    expect(result.current.results).toEqual([])
  })

  it('propagates index error', async () => {
    const indexError = new Error('Index load failed')
    ;(useSearchIndex as any).mockReturnValue({
      index: null,
      loading: false,
      error: indexError,
    })

    const { result } = renderHook(() => useSearch())

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.indexError).toBe(indexError)
  })

  it('updates results when index becomes available', async () => {
    const mockResults = [
      { path: '/docs/bitcoin', title: 'Bitcoin Protocol', section: 'bitcoin', snippet: 'Bitcoin overview' },
    ]

    // Start without index
    ;(useSearchIndex as any).mockReturnValue({
      index: null,
      loading: true,
      error: null,
    })

    const { result, rerender } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('bitcoin')
    })

    // Now provide index
    ;(useSearchIndex as any).mockReturnValue({
      index: mockIndex,
      loading: false,
      error: null,
    })
    ;(search as any).mockReturnValue(mockResults)

    rerender()

    await waitFor(
      () => {
        expect(result.current.results).toEqual(mockResults)
      },
      { timeout: 300 }
    )
  })
})

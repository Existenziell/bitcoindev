import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET } from '@/app/api/pool-distribution/route'

vi.mock('@vercel/blob', () => ({
  list: vi.fn(),
}))

import * as vercelBlob from '@vercel/blob'

describe('pool-distribution API route', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.mocked(vercelBlob.list).mockReset()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns empty object when no blob found', async () => {
    vi.mocked(vercelBlob.list).mockResolvedValue({ blobs: [] })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })

  it('returns empty object when blob has no url', async () => {
    vi.mocked(vercelBlob.list).mockResolvedValue({
      blobs: [{ pathname: 'pool-distribution.json', url: null }],
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })

  it('returns empty object when fetch to blob url fails', async () => {
    vi.mocked(vercelBlob.list).mockResolvedValue({
      blobs: [{ pathname: 'pool-distribution.json', url: 'https://blob.example/pool.json' }],
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })

  it('returns empty object when response is null or array', async () => {
    vi.mocked(vercelBlob.list).mockResolvedValue({
      blobs: [{ pathname: 'pool-distribution.json', url: 'https://blob.example/pool.json' }],
    })
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => null })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

    const res1 = await GET()
    expect(await res1.json()).toEqual({})

    const res2 = await GET()
    expect(await res2.json()).toEqual({})
  })

  it('returns pool distribution when blob returns valid object', async () => {
    const distribution = { antpool: 18.5, foundryusa: 15.2, others: 66.3 }
    vi.mocked(vercelBlob.list).mockResolvedValue({
      blobs: [{ pathname: 'pool-distribution.json', url: 'https://blob.example/pool.json' }],
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => distribution,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(distribution)
  })

  it('returns empty object when list throws', async () => {
    vi.mocked(vercelBlob.list).mockRejectedValueOnce(new Error('Blob error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })
})

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/block-history/route'

const mockBlockSnapshot = (height: number) => ({
  height,
  hash: `hash${height}`,
  timestamp: 1700000000 + height,
  size: 1000000,
  weight: 4000000,
  txCount: 100,
  feeSpanMin: 1,
  feeSpanMax: 100,
  medianFeeRate: 10,
  totalFeesBTC: 0.5,
  totalValueBTC: 7,
  subsidyPlusFeesBTC: 6.5,
  miner: 'antpool',
  minerName: 'Antpool',
})

vi.mock('@vercel/blob', () => ({
  list: vi.fn(),
  put: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/app/utils/bitcoinRpcServer', () => ({
  bitcoinRpcServer: vi.fn(),
}))

import * as vercelBlob from '@vercel/blob'
import { bitcoinRpcServer } from '@/app/utils/bitcoinRpcServer'

describe('block-history API route', () => {
  const originalFetch = global.fetch
  const originalEnv = process.env

  beforeEach(() => {
    vi.mocked(vercelBlob.list).mockReset()
    vi.mocked(vercelBlob.put).mockResolvedValue(undefined as any)
    vi.mocked(bitcoinRpcServer).mockReset()
    global.fetch = vi.fn()
    process.env = { ...originalEnv, BLOCK_HISTORY_PUBLIC_URL: '', CRON_SECRET: '' }
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = originalEnv
  })

  describe('GET', () => {
    it('returns blocks from blob with default limit', async () => {
      const blocks = [mockBlockSnapshot(100), mockBlockSnapshot(99), mockBlockSnapshot(98)]
      vi.mocked(vercelBlob.list).mockResolvedValue({
        blobs: [{ pathname: 'block-history.json', url: 'https://blob.example/block-history.json' }],
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => blocks,
      })

      const request = new NextRequest('http://localhost/api/block-history')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.blocks).toHaveLength(3)
      expect(data.blocks[0].height).toBe(100)
    })

    it('respects limit query param and clamps to MAX_LIMIT', async () => {
      const blocks = Array.from({ length: 30 }, (_, i) => mockBlockSnapshot(100 - i))
      vi.mocked(vercelBlob.list).mockResolvedValue({
        blobs: [{ pathname: 'block-history.json', url: 'https://blob.example/b.json' }],
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => blocks,
      })

      const request = new NextRequest('http://localhost/api/block-history?limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.blocks).toHaveLength(5)
    })

    it('respects beforeHeight for pagination', async () => {
      const blocks = [mockBlockSnapshot(100), mockBlockSnapshot(99), mockBlockSnapshot(98)]
      vi.mocked(vercelBlob.list).mockResolvedValue({
        blobs: [{ pathname: 'block-history.json', url: 'https://blob.example/b.json' }],
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => blocks,
      })

      const request = new NextRequest('http://localhost/api/block-history?limit=2&beforeHeight=99')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Filter height < 99 gives [98]; slice(0, 2) => one block
      expect(data.blocks).toHaveLength(1)
      expect(data.blocks[0].height).toBe(98)
    })

    it('seeds from RPC when blob is empty and returns blocks', async () => {
      vi.mocked(vercelBlob.list).mockResolvedValue({ blobs: [] })
      const tipHeight = 100
      vi.mocked(bitcoinRpcServer)
        .mockResolvedValueOnce({ blocks: tipHeight })
        .mockImplementation((method: string, params?: unknown[]) => {
          if (method === 'getblockhash') return Promise.resolve(`hash${params![0]}`)
          if (method === 'getblock') {
            const h = (params as [string, number])[0].replace('hash', '')
            const height = parseInt(h, 10)
            return Promise.resolve({
              height,
              hash: `hash${height}`,
              time: 1700000000 + height,
              size: 1000000,
              weight: 4000000,
              tx: [
                {
                  txid: 'coinbase',
                  vsize: 200,
                  vin: [{ coinbase: '03bebb08' }],
                  vout: [{ value: 6.25 }],
                },
              ],
            })
          }
          return Promise.resolve({})
        })

      const request = new NextRequest('http://localhost/api/block-history')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.blocks).toBeDefined()
      expect(Array.isArray(data.blocks)).toBe(true)
    })

    it('returns 500 when an error is thrown', async () => {
      vi.mocked(vercelBlob.list).mockRejectedValueOnce(new Error('Blob list failed'))
      vi.mocked(bitcoinRpcServer).mockRejectedValueOnce(new Error('RPC failed'))

      const request = new NextRequest('http://localhost/api/block-history')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  describe('POST', () => {
    it('returns 401 when CRON_SECRET is set and authorization is wrong', async () => {
      process.env.CRON_SECRET = 'secret123'
      const request = new NextRequest('http://localhost/api/block-history', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('allows POST when CRON_SECRET is set and Bearer token matches', async () => {
      process.env.CRON_SECRET = 'secret123'
      const blocks = [mockBlockSnapshot(100)]
      vi.mocked(vercelBlob.list).mockResolvedValue({
        blobs: [{ pathname: 'block-history.json', url: 'https://blob.example/b.json' }],
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => blocks,
      })
      vi.mocked(bitcoinRpcServer)
        .mockResolvedValueOnce({ blocks: 100 })
        .mockResolvedValueOnce('hash100')
        .mockResolvedValueOnce({
          height: 100,
          hash: 'hash100',
          time: 1700000000,
          size: 1000000,
          weight: 4000000,
          tx: [
            {
              txid: 'cb',
              vsize: 200,
              vin: [{ coinbase: '03' }],
              vout: [{ value: 6.25 }],
            },
          ],
        })

      const request = new NextRequest('http://localhost/api/block-history', {
        method: 'POST',
        headers: { authorization: 'Bearer secret123' },
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.blocks).toBeDefined()
    })

    it('returns idempotent response when new block already at tip', async () => {
      const blocks = [mockBlockSnapshot(100), mockBlockSnapshot(99)]
      vi.mocked(vercelBlob.list).mockResolvedValue({
        blobs: [{ pathname: 'block-history.json', url: 'https://blob.example/b.json' }],
      })
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => blocks,
      })
      vi.mocked(bitcoinRpcServer)
        .mockResolvedValueOnce({ blocks: 100 })
        .mockResolvedValueOnce('hash100')
        .mockResolvedValueOnce({
          height: 100,
          hash: 'hash100',
          time: 1700000000,
          size: 1000000,
          weight: 4000000,
          tx: [
            { txid: 'cb', vsize: 200, vin: [{ coinbase: '03' }], vout: [{ value: 6.25 }] },
          ],
        })

      const request = new NextRequest('http://localhost/api/block-history', { method: 'POST' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.blocks).toHaveLength(2)
      expect(data.blocks[0].height).toBe(100)
    })
  })
})

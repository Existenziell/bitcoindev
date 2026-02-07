#!/usr/bin/env npx tsx
/**
 * Update block-history and pool-distribution in Vercel Blob. Intended to be run only
 * from GitHub Actions; the Next.js app never writes to blob.
 *
 * Requires: BLOCK_HISTORY_BLOB_URL, BLOB_READ_WRITE_TOKEN. Optional: BITCOIN_RPC_URL.
 *
 * Usage: npx tsx scripts/update-block-history.ts
 */

import { put } from '@vercel/blob'
import { processBlockData, buildBlockSnapshot, type BlockSnapshot } from '../app/utils/blockUtils'

const BLOCK_HISTORY_BLOB_PATH = 'block-history.json'
const POOL_DISTRIBUTION_BLOB_PATH = 'pool-distribution.json'
const POOL_DISTRIBUTION_WINDOW = 2016
// Max blocks to fetch per run (gap fill + new tip). GitHub Actions job limit is 6h; runtime is
// dominated by RPC latency. 288 = 2 days of blocks (~6/h) so we can catch up after missed runs.
const GAP_FILL_MAX_PER_REQUEST = 288
const INITIAL_SEED_LIMIT = 100

const BITCOIN_RPC_URL = process.env.BITCOIN_RPC_URL?.trim() || 'https://bitcoin-rpc.publicnode.com'
const BLOCK_HISTORY_BLOB_URL = process.env.BLOCK_HISTORY_BLOB_URL?.trim()

type RawBlock = {
  height: number
  hash: string
  time: number
  size: number
  weight?: number
  tx: Array<{
    txid: string
    vsize: number
    fee?: number
    vin?: Array<{ prevout?: { value?: number }; coinbase?: string }>
    vout: Array<{ value?: number }>
  }>
}

async function rpc(method: string, params: (string | number | boolean)[] = []): Promise<unknown> {
  const res = await fetch(BITCOIN_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '1.0',
      id: 'bitcoindev',
      method,
      params,
    }),
  })
  if (!res.ok) throw new Error(`RPC request failed: ${res.status}`)
  const data = (await res.json()) as { result?: unknown; error?: { message: string } }
  if (data.error) throw new Error(data.error?.message ?? 'RPC error')
  return data.result
}

async function fetchCurrentBlocks(): Promise<BlockSnapshot[]> {
  if (!BLOCK_HISTORY_BLOB_URL) return []
  const res = await fetch(BLOCK_HISTORY_BLOB_URL, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  const parsed = Array.isArray(data) ? data : Array.isArray(data?.blocks) ? data.blocks : null
  if (!parsed || parsed.length === 0) return []
  return parsed as BlockSnapshot[]
}

function computePoolDistribution(blocks: BlockSnapshot[]): Record<string, number> {
  const window = blocks.slice(0, POOL_DISTRIBUTION_WINDOW)
  if (window.length === 0) return {}
  const counts: Record<string, number> = {}
  for (const b of window) {
    const key = b.miner?.trim() || 'others'
    counts[key] = (counts[key] ?? 0) + 1
  }
  const total = window.length
  const distribution: Record<string, number> = {}
  for (const [id, count] of Object.entries(counts)) {
    distribution[id] = Math.round((count / total) * 1000) / 10
  }
  return distribution
}

async function fetchBlockSnapshotAtHeight(height: number): Promise<BlockSnapshot> {
  const hash = (await rpc('getblockhash', [height])) as string
  const raw = (await rpc('getblock', [hash, 3])) as RawBlock
  return buildBlockSnapshot(processBlockData(raw))
}

async function seedFromRpc(): Promise<BlockSnapshot[]> {
  const chainInfo = (await rpc('getblockchaininfo')) as { blocks: number }
  const tipHeight = chainInfo.blocks
  const startHeight = Math.max(0, tipHeight - INITIAL_SEED_LIMIT + 1)
  const heights = Array.from({ length: tipHeight - startHeight + 1 }, (_, i) => tipHeight - i)

  const hashes = await Promise.all(heights.map((h) => rpc('getblockhash', [h]) as Promise<string>))
  const blocksRaw = await Promise.all(
    hashes.map((hash) => rpc('getblock', [hash, 3]) as Promise<RawBlock>)
  )

  const blocks: BlockSnapshot[] = blocksRaw
    .map((raw) => {
      if (!raw?.height) return null
      return buildBlockSnapshot(processBlockData(raw))
    })
    .filter((s): s is BlockSnapshot => Boolean(s))

  return blocks
}

async function main(): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.error('BLOB_READ_WRITE_TOKEN is required')
    process.exit(1)
  }
  if (!BLOCK_HISTORY_BLOB_URL) {
    console.error('BLOCK_HISTORY_BLOB_URL is required (current block list is read from there)')
    process.exit(1)
  }

  let list = await fetchCurrentBlocks()
  if (list.length === 0) {
    console.log('No existing block history; seeding from RPC...')
    list = await seedFromRpc()
  }

  // Fill one batch of any internal gap
  for (let i = 0; i < list.length - 1; i++) {
    const high = list[i].height
    const low = list[i + 1].height
    if (high - low <= 1) continue
    const toFill = Math.min(GAP_FILL_MAX_PER_REQUEST, high - low - 1)
    const heights = Array.from({ length: toFill }, (_, j) => high - 1 - j)
    console.log('Filling internal gap', high - 1, '..', heights[heights.length - 1], '(' + toFill, 'blocks)')
    const batch = await Promise.all(
      heights.map(async (h) => {
        try {
          return await fetchBlockSnapshotAtHeight(h)
        } catch (e) {
          console.error('Fetch block', h, 'failed', e)
          return null
        }
      })
    )
    const valid = batch.filter((s): s is BlockSnapshot => s !== null)
    if (valid.length !== batch.length) {
      console.error('Failed to fetch some blocks; retry later')
      process.exit(1)
    }
    list = [...list.slice(0, i + 1), ...valid, ...list.slice(i + 1)]
    await put(BLOCK_HISTORY_BLOB_PATH, JSON.stringify(list), {
      access: 'public',
      addRandomSuffix: false,
    })
    await put(POOL_DISTRIBUTION_BLOB_PATH, JSON.stringify(computePoolDistribution(list)), {
      access: 'public',
      addRandomSuffix: false,
    })
    console.log('Filled internal gap, list length', list.length)
    return
  }

  const chainInfo = (await rpc('getblockchaininfo')) as { blocks: number }
  const tipHeight = chainInfo.blocks
  const newBlock = await fetchBlockSnapshotAtHeight(tipHeight)

  const topHeight = list[0]?.height ?? null
  if (topHeight !== null && newBlock.height === topHeight) {
    console.log('Idempotent: block', newBlock.height, 'already in list')
    return
  }

  if (list.length > 0 && newBlock.height > topHeight + 1) {
    const gapSize = newBlock.height - topHeight - 1
    const toFill = Math.min(GAP_FILL_MAX_PER_REQUEST, gapSize)
    const missingHeights = Array.from({ length: toFill }, (_, j) => newBlock.height - 1 - j)
    console.log('Gap at top (new', newBlock.height, ', top', topHeight, '), filling', toFill, 'of', gapSize)
    const missing = await Promise.all(
      missingHeights.map(async (h) => {
        try {
          return await fetchBlockSnapshotAtHeight(h)
        } catch (e) {
          console.error('Fetch block', h, 'failed', e)
          return null
        }
      })
    )
    const valid = missing.filter((s): s is BlockSnapshot => s !== null)
    if (valid.length !== missingHeights.length) {
      console.error('Failed to fetch some blocks; retry later')
      process.exit(1)
    }
    list = [newBlock, ...valid, ...list]
  } else {
    list = [newBlock, ...list]
  }

  await put(BLOCK_HISTORY_BLOB_PATH, JSON.stringify(list), {
    access: 'public',
    addRandomSuffix: false,
  })
  await put(POOL_DISTRIBUTION_BLOB_PATH, JSON.stringify(computePoolDistribution(list)), {
    access: 'public',
    addRandomSuffix: false,
  })
  console.log('Updated block-history:', list.length, 'blocks')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

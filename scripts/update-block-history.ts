#!/usr/bin/env npx tsx
/**
 * Update block-history and pool-distribution in public/data/. Intended to be run
 * from GitHub Actions or locally; the Next.js app reads these files.
 *
 * Usage: npx tsx scripts/update-block-history.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { processBlockData, buildBlockSnapshot, type BlockSnapshot } from '../app/utils/blockUtils'

const DATA_DIR = path.join(process.cwd(), 'public', 'data')
const BLOCK_HISTORY_PATH = path.join(DATA_DIR, 'block-history.json')
const POOL_DISTRIBUTION_PATH = path.join(DATA_DIR, 'pool-distribution.json')
const POOL_DISTRIBUTION_WINDOW = 2016
const TARGET_BLOCK_COUNT = 2016
const BOOTSTRAP_BLOCKS = 100
// Max blocks to fetch per run (gap fill + new tip). GitHub Actions job limit is 6h; runtime is
// dominated by RPC latency. 288 = 2 days of blocks (~6/h) so we can catch up after missed runs.
const GAP_FILL_MAX_PER_REQUEST = 288
// Limit concurrent RPC calls to avoid 504s from the public node.
const RPC_CONCURRENCY = 10

const BITCOIN_RPC_URL = 'https://bitcoin-rpc.publicnode.com'

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

async function readLocalBlockHistory(): Promise<BlockSnapshot[]> {
  try {
    const raw = await fs.promises.readFile(BLOCK_HISTORY_PATH, 'utf-8')
    const data = JSON.parse(raw)
    const parsed = Array.isArray(data) ? data : Array.isArray(data?.blocks) ? data.blocks : null
    if (!parsed || parsed.length === 0) return []
    return parsed as BlockSnapshot[]
  } catch {
    return []
  }
}

async function bootstrapFromRpc(): Promise<BlockSnapshot[]> {
  const chainInfo = (await rpc('getblockchaininfo')) as { blocks: number }
  const tipHeight = chainInfo.blocks
  const count = Math.min(BOOTSTRAP_BLOCKS, tipHeight + 1)
  const heights = Array.from({ length: count }, (_, j) => tipHeight - j)
  console.log('Bootstrapping block history from RPC:', count, 'blocks from tip', tipHeight)
  const results = await runWithConcurrency(
    heights,
    RPC_CONCURRENCY,
    async (h) => {
      try {
        return await fetchBlockSnapshotAtHeight(h)
      } catch (e) {
        console.error('Fetch block', h, 'failed', e)
        return null
      }
    }
  )
  const list = results.filter((s): s is BlockSnapshot => s !== null)
  if (list.length === 0) throw new Error('Bootstrap: could not fetch any blocks')
  return list.sort((a, b) => b.height - a.height)
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

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  )
  return results
}

async function writeData(list: BlockSnapshot[]): Promise<void> {
  await fs.promises.mkdir(DATA_DIR, { recursive: true })
  await fs.promises.writeFile(BLOCK_HISTORY_PATH, JSON.stringify(list))
  await fs.promises.writeFile(
    POOL_DISTRIBUTION_PATH,
    JSON.stringify(computePoolDistribution(list))
  )
}

async function main(): Promise<void> {
  let list = await readLocalBlockHistory()
  if (list.length === 0) {
    list = await bootstrapFromRpc()
    await writeData(list)
    console.log('Bootstrapped block-history:', list.length, 'blocks')
    return
  }

  // Extend list backward to TARGET_BLOCK_COUNT (e.g. 2016) if we have fewer
  while (list.length < TARGET_BLOCK_COUNT) {
    const oldestHeight = list[list.length - 1].height
    if (oldestHeight <= 0) break
    const need = TARGET_BLOCK_COUNT - list.length
    const toFetch = Math.min(GAP_FILL_MAX_PER_REQUEST, need, oldestHeight)
    const heights = Array.from({ length: toFetch }, (_, j) => oldestHeight - 1 - j)
    console.log('Extending block history:', toFetch, 'older blocks from', oldestHeight - 1, 'down')
    const batch = await runWithConcurrency(
      heights,
      RPC_CONCURRENCY,
      async (h) => {
        try {
          return await fetchBlockSnapshotAtHeight(h)
        } catch (e) {
          console.error('Fetch block', h, 'failed', e)
          return null
        }
      }
    )
    const valid = batch.filter((s): s is BlockSnapshot => s !== null)
    if (valid.length !== batch.length) {
      console.error('Failed to fetch some blocks; retry later')
      process.exit(1)
    }
    list = [...list, ...valid.sort((a, b) => b.height - a.height)]
    await writeData(list)
    console.log('Extended block-history:', list.length, 'blocks')
    if (list.length >= TARGET_BLOCK_COUNT || toFetch === 0) break
  }

  const chainInfo = (await rpc('getblockchaininfo')) as { blocks: number }
  const tipHeight = chainInfo.blocks
  const topHeight = list[0]?.height ?? null

  // Prioritize gap at tip: always catch up to latest blocks first
  if (tipHeight > topHeight) {
    const newBlock = await fetchBlockSnapshotAtHeight(tipHeight)
    const gapSize = newBlock.height - topHeight - 1
    const toFill = Math.min(GAP_FILL_MAX_PER_REQUEST, gapSize)
    const missingHeights = Array.from({ length: toFill }, (_, j) => newBlock.height - 1 - j)
    console.log('Gap at top (new', newBlock.height, ', top', topHeight, '), filling', toFill, 'of', gapSize)
    const missing = await runWithConcurrency(
      missingHeights,
      RPC_CONCURRENCY,
      async (h) => {
        try {
          return await fetchBlockSnapshotAtHeight(h)
        } catch (e) {
          console.error('Fetch block', h, 'failed', e)
          return null
        }
      }
    )
    const valid = missing.filter((s): s is BlockSnapshot => s !== null)
    if (valid.length !== missingHeights.length) {
      console.error('Failed to fetch some blocks; retry later')
      process.exit(1)
    }
    list = [newBlock, ...valid, ...list]
    await writeData(list)
    console.log('Updated block-history:', list.length, 'blocks')
    return
  }

  if (topHeight !== null && tipHeight === topHeight) {
    // Up to date at tip; fill one batch of any internal gap
    for (let i = 0; i < list.length - 1; i++) {
      const high = list[i].height
      const low = list[i + 1].height
      if (high - low <= 1) continue
      const toFill = Math.min(GAP_FILL_MAX_PER_REQUEST, high - low - 1)
      const heights = Array.from({ length: toFill }, (_, j) => high - 1 - j)
      console.log('Filling internal gap', high - 1, '..', heights[heights.length - 1], '(' + toFill, 'blocks)')
      const batch = await runWithConcurrency(
        heights,
        RPC_CONCURRENCY,
        async (h) => {
          try {
            return await fetchBlockSnapshotAtHeight(h)
          } catch (e) {
            console.error('Fetch block', h, 'failed', e)
            return null
          }
        }
      )
      const valid = batch.filter((s): s is BlockSnapshot => s !== null)
      if (valid.length !== batch.length) {
        console.error('Failed to fetch some blocks; retry later')
        process.exit(1)
      }
      list = [...list.slice(0, i + 1), ...valid, ...list.slice(i + 1)]
      await writeData(list)
      console.log('Filled internal gap, list length', list.length)
      return
    }
    console.log('Idempotent: block', topHeight, 'already in list')
    return
  }

  // List exists but tip is ahead by exactly 1 (no gap): just add the new tip block
  const newBlock = await fetchBlockSnapshotAtHeight(tipHeight)
  list = [newBlock, ...list]
  await writeData(list)
  console.log('Updated block-history:', list.length, 'blocks')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

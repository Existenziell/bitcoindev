import { NextRequest, NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'
import { bitcoinRpcServer } from '@/app/utils/bitcoinRpcServer'
import { processBlockData, buildBlockSnapshot, type BlockSnapshot } from '@/app/utils/blockUtils'
import { DEFAULT_LIMIT, MAX_LIMIT } from '@/app/utils/constants'

const BLOCK_HISTORY_BLOB_PATH = 'block-history.json'
const POOL_DISTRIBUTION_BLOB_PATH = 'pool-distribution.json'
/** Number of blocks used to compute pool distribution (~2 weeks). */
const POOL_DISTRIBUTION_WINDOW = 2016
/** Optional public URL to read block-history from (e.g. when Vercel list() is empty in dev). */
const BLOCK_HISTORY_PUBLIC_URL = process.env.BLOCK_HISTORY_BLOB_URL?.trim() || ''
/** Only used when blob is empty and we seed from RPC (avoid fetching entire chain). */
const INITIAL_SEED_LIMIT = 100
/** Number of blocks to fetch in parallel when filling gaps (reduces total time for large gaps). */
const GAP_FILL_BATCH_SIZE = 15
/** Max blocks to fill per POST so we stay under Vercel Hobby 10s limit. Rest is filled on later runs. */
const GAP_FILL_MAX_PER_REQUEST = 8

/** Revalidate cached response every 10 minutes. */
export const revalidate = 600

/** Allow up to 60s on Vercel Pro; on Hobby (10s) we rely on GAP_FILL_MAX_PER_REQUEST. */
export const maxDuration = 60

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

/** Read block history from optional public URL. Returns null if not set or fetch fails. */
async function readBlockHistoryFromPublicUrl(): Promise<BlockSnapshot[] | null> {
  if (!BLOCK_HISTORY_PUBLIC_URL) return null
  try {
    const res = await fetch(BLOCK_HISTORY_PUBLIC_URL, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const parsed = Array.isArray(data) ? data : Array.isArray(data?.blocks) ? data.blocks : null
    if (!parsed || parsed.length === 0) return null
    console.log('[block-history] Read from public URL:', parsed.length, 'blocks')
    return parsed as BlockSnapshot[]
  } catch (err) {
    console.log('[block-history] readBlockHistoryFromPublicUrl error:', err)
    return null
  }
}

/** Read block history from Blob (or public URL when set). Returns null if not found or parse fails. */
async function readBlockHistoryFromBlob(): Promise<BlockSnapshot[] | null> {
  if (BLOCK_HISTORY_PUBLIC_URL) {
    const fromUrl = await readBlockHistoryFromPublicUrl()
    if (fromUrl !== null) return fromUrl
  }
  try {
    const { blobs } = await list({ prefix: BLOCK_HISTORY_BLOB_PATH })
    const blob = blobs.find((b) => b.pathname === BLOCK_HISTORY_BLOB_PATH) ?? blobs[0]
    if (!blob?.url) {
      console.log('[block-history] Blob not found or no url')
      return null
    }
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) {
      console.log('[block-history] Blob fetch failed:', res.status)
      return null
    }
    const data = await res.json()
    const parsed = Array.isArray(data) ? data : Array.isArray(data?.blocks) ? data.blocks : null
    if (!parsed || parsed.length === 0) {
      console.log('[block-history] Blob empty or invalid')
      return null
    }
    console.log('[block-history] Read from Blob:', parsed.length, 'blocks')
    return parsed as BlockSnapshot[]
  } catch (err) {
    console.log('[block-history] readBlockHistoryFromBlob error:', err)
    return null
  }
}

/** Write block history to Blob. List must be newest-first, contiguous. */
async function writeBlockHistoryToBlob(blocks: BlockSnapshot[]): Promise<void> {
  console.log('[block-history] Writing to Blob:', blocks.length, 'blocks')
  await put(BLOCK_HISTORY_BLOB_PATH, JSON.stringify(blocks), {
    access: 'public',
    addRandomSuffix: false,
  })
}

/** Compute pool distribution from last POOL_DISTRIBUTION_WINDOW blocks. Returns identifier -> percentage (one decimal). */
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

/** Write pool distribution JSON to Blob. */
async function writePoolDistributionToBlob(distribution: Record<string, number>): Promise<void> {
  console.log('[block-history] Writing pool distribution to Blob')
  await put(POOL_DISTRIBUTION_BLOB_PATH, JSON.stringify(distribution), {
    access: 'public',
    addRandomSuffix: false,
  })
}

/** Seed Blob with last INITIAL_SEED_LIMIT blocks from RPC when blob is empty. Returns the list. */
async function seedBlockHistoryFromRpc(): Promise<BlockSnapshot[]> {
  console.log('[block-history] Seeding from RPC...')
  const chainInfo = await bitcoinRpcServer('getblockchaininfo')
  const tipHeight = (chainInfo as { blocks: number }).blocks
  const startHeight = Math.max(0, tipHeight - INITIAL_SEED_LIMIT + 1)
  const heights = Array.from({ length: tipHeight - startHeight + 1 }, (_, i) => tipHeight - i)

  const hashes = await Promise.all(
    heights.map((h) => bitcoinRpcServer('getblockhash', [h]) as Promise<string>)
  )

  const blocksRaw: RawBlock[] = await Promise.all(
    hashes.map((hash) => bitcoinRpcServer('getblock', [hash, 3]) as Promise<RawBlock>)
  )

  const blocks: BlockSnapshot[] = blocksRaw
    .map((raw) => {
      if (!raw?.height) return null
      return buildBlockSnapshot(processBlockData(raw))
    })
    .filter((s): s is BlockSnapshot => Boolean(s))

  await writeBlockHistoryToBlob(blocks)
  const distribution = computePoolDistribution(blocks)
  await writePoolDistributionToBlob(distribution)
  console.log('[block-history] Seed complete:', blocks.length, 'blocks')
  return blocks
}

/** Fetch a single block at height from RPC and return BlockSnapshot. */
async function fetchBlockSnapshotAtHeight(height: number): Promise<BlockSnapshot> {
  const hash = (await bitcoinRpcServer('getblockhash', [height])) as string
  const raw = (await bitcoinRpcServer('getblock', [hash, 3])) as RawBlock
  return buildBlockSnapshot(processBlockData(raw))
}

/** Apply limit and beforeHeight to full list; return paginated slice. */
function paginate(list: BlockSnapshot[], limit: number, beforeHeight: number | null): BlockSnapshot[] {
  if (beforeHeight !== null && !Number.isNaN(beforeHeight)) {
    const filtered = list.filter((b) => b.height < beforeHeight)
    return filtered.slice(0, limit)
  }
  return list.slice(0, limit)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    )
    const beforeHeightParam = searchParams.get('beforeHeight')
    const beforeHeight = beforeHeightParam ? parseInt(beforeHeightParam, 10) : null

    let list = await readBlockHistoryFromBlob()
    if (list === null) {
      list = await seedBlockHistoryFromRpc()
    }

    const blocks = paginate(list, limit, beforeHeight)
    console.log('[block-history] GET returning', blocks.length, 'blocks (limit=', limit, ', beforeHeight=', beforeHeight, ')')
    return NextResponse.json({ blocks })
  } catch (err) {
    console.error('Block history API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch block history' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    let list = await readBlockHistoryFromBlob()
    if (list === null) list = []

    // On Vercel Hobby we have ~10s; fill at most one batch per request so we don't time out.
    // First: fill one batch of any internal gap (from a previous partial gap-fill).
    for (let i = 0; i < list.length - 1; i++) {
      const high = list[i].height
      const low = list[i + 1].height
      if (high - low <= 1) continue
      const toFill = Math.min(GAP_FILL_MAX_PER_REQUEST, high - low - 1)
      const heights = Array.from({ length: toFill }, (_, j) => high - 1 - j)
      console.log('[block-history] POST: filling internal gap', high - 1, '..', heights[heights.length - 1], '(' + toFill, 'blocks)')
      const batch = await Promise.all(
        heights.map(async (h) => {
          try {
            return await fetchBlockSnapshotAtHeight(h)
          } catch (e) {
            console.error('[block-history] POST: fetch block', h, 'failed', e)
            return null
          }
        })
      )
      const valid = batch.filter((s): s is BlockSnapshot => s !== null)
      if (valid.length !== batch.length) {
        return NextResponse.json(
          { error: 'Failed to fetch some blocks; retry later' },
          { status: 503 }
        )
      }
      const updated = [...list.slice(0, i + 1), ...valid, ...list.slice(i + 1)]
      await writeBlockHistoryToBlob(updated)
      await writePoolDistributionToBlob(computePoolDistribution(updated))
      console.log('[block-history] POST: filled internal gap, list length', updated.length)
      return NextResponse.json({ blocks: updated })
    }

    const chainInfo = await bitcoinRpcServer('getblockchaininfo')
    const tipHeight = (chainInfo as { blocks: number }).blocks
    console.log('[block-history] POST: new block at height', tipHeight)
    const newBlock = await fetchBlockSnapshotAtHeight(tipHeight)

    const topHeight = list[0]?.height ?? null
    if (topHeight !== null && newBlock.height === topHeight) {
      console.log('[block-history] POST: idempotent (block', newBlock.height, 'already in list)')
      return NextResponse.json({ blocks: list })
    }

    if (list.length > 0 && newBlock.height > topHeight + 1) {
      // Gap at top: fill at most GAP_FILL_MAX_PER_REQUEST so we stay under 10s (Hobby).
      const gapSize = newBlock.height - topHeight - 1
      const toFill = Math.min(GAP_FILL_MAX_PER_REQUEST, gapSize)
      const missingHeights = Array.from({ length: toFill }, (_, j) => newBlock.height - 1 - j)
      console.log('[block-history] POST: gap at top (new', newBlock.height, ', top', topHeight, '), filling', toFill, 'of', gapSize, 'blocks')
      const missing = await Promise.all(
        missingHeights.map(async (h) => {
          try {
            return await fetchBlockSnapshotAtHeight(h)
          } catch (e) {
            console.error('[block-history] POST: fetch block', h, 'failed', e)
            return null
          }
        })
      )
      const valid = missing.filter((s): s is BlockSnapshot => s !== null)
      if (valid.length !== missingHeights.length) {
        return NextResponse.json(
          { error: 'Failed to fetch some blocks; retry later' },
          { status: 503 }
        )
      }
      const updated = [newBlock, ...valid, ...list]
      await writeBlockHistoryToBlob(updated)
      await writePoolDistributionToBlob(computePoolDistribution(updated))
      console.log('[block-history] POST: filled gap batch, prepended', 1 + valid.length, 'blocks, list length', updated.length)
      return NextResponse.json({ blocks: updated })
    }

    const updated = [newBlock, ...list]
    await writeBlockHistoryToBlob(updated)
    await writePoolDistributionToBlob(computePoolDistribution(updated))
    console.log('[block-history] POST: prepended block', newBlock.height, ', list length', updated.length)

    return NextResponse.json({ blocks: updated })
  } catch (err) {
    console.error('Block history POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to append block history' },
      { status: 500 }
    )
  }
}

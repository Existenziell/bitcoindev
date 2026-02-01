import { NextRequest, NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'
import { bitcoinRpcServer } from '@/app/utils/bitcoinRpcServer'
import { processBlockData, buildBlockSnapshot, type BlockSnapshot } from '@/app/utils/blockUtils'
import { DEFAULT_LIMIT, MAX_LIMIT } from '@/app/utils/constants'

const BLOCK_HISTORY_BLOB_PATH = 'block-history.json'
/** Optional public URL to read block-history from (e.g. when Vercel list() is empty in dev). */
const BLOCK_HISTORY_PUBLIC_URL = process.env.BLOCK_HISTORY_BLOB_URL?.trim() || ''
/** Only used when blob is empty and we seed from RPC (avoid fetching entire chain). */
const INITIAL_SEED_LIMIT = 100

/** Revalidate cached response every 10 minutes. */
export const revalidate = 600

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

/** Fetch missing blocks from RPC and write updated list to blob. Run fire-and-forget (do not await). */
function fillGapAndWriteBlob(list: BlockSnapshot[], tipHeight: number, topHeight: number): void {
  const missingHeights = Array.from(
    { length: tipHeight - topHeight },
    (_, i) => tipHeight - i
  )
  Promise.all(
    missingHeights.map(async (h) => {
      try {
        return await fetchBlockSnapshotAtHeight(h)
      } catch (e) {
        console.error('[block-history] gap-fill: fetch block', h, 'failed', e)
        return null
      }
    })
  ).then((results) => {
    const valid = results.filter((s): s is BlockSnapshot => s !== null)
    if (valid.length !== missingHeights.length) {
      console.error('[block-history] gap-fill: partial (got', valid.length, 'of', missingHeights.length, ')')
      return
    }
    const updated = [...valid, ...list]
    writeBlockHistoryToBlob(updated).then(() => {
      console.log('[block-history] gap-fill: wrote', updated.length, 'blocks')
    }).catch((err) => {
      console.error('[block-history] gap-fill: write failed', err)
    })
  })
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
    } else if (list.length > 0) {
      const chainInfo = await bitcoinRpcServer('getblockchaininfo')
      const tipHeight = (chainInfo as { blocks: number }).blocks
      const topHeight = list[0].height
      if (tipHeight > topHeight) {
        console.log('[block-history] GET: gap (tip', tipHeight, ', top', topHeight, '), filling in background')
        fillGapAndWriteBlob(list, tipHeight, topHeight)
      }
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

export async function POST() {
  try {
    const chainInfo = await bitcoinRpcServer('getblockchaininfo')
    const tipHeight = (chainInfo as { blocks: number }).blocks

    console.log('[block-history] POST: new block at height', tipHeight)
    const newBlock = await fetchBlockSnapshotAtHeight(tipHeight)

    let list = await readBlockHistoryFromBlob()
    if (list === null) list = []

    const topHeight = list[0]?.height ?? null
    if (topHeight !== null && newBlock.height === topHeight) {
      console.log('[block-history] POST: idempotent (block', newBlock.height, 'already in list)')
      return NextResponse.json({ blocks: list })
    }

    if (list.length > 0 && newBlock.height > topHeight + 1) {
      // Fill the entire gap so the stored list remains contiguous (no gaps).
      console.log('[block-history] POST: gap (new', newBlock.height, ', top', topHeight, '), filling from RPC')
      const missingHeights = Array.from(
        { length: newBlock.height - topHeight },
        (_, i) => newBlock.height - i
      )
      const missing: BlockSnapshot[] = []
      for (const h of missingHeights) {
        try {
          missing.push(await fetchBlockSnapshotAtHeight(h))
        } catch (e) {
          console.error('[block-history] POST: fetch block', h, 'failed', e)
          break
        }
      }
      if (missing.length !== missingHeights.length) {
        console.error('[block-history] POST: gap-fill partial (got', missing.length, 'of', missingHeights.length, '), not writing')
        return NextResponse.json(
          { error: 'Failed to fetch all missing blocks; retry later' },
          { status: 503 }
        )
      }
      const updated = [...missing, ...list]
      await writeBlockHistoryToBlob(updated)
      console.log('[block-history] POST: filled gap, prepended', missing.length, 'blocks, list length', updated.length)
      return NextResponse.json({ blocks: updated })
    }

    const updated = [newBlock, ...list]
    await writeBlockHistoryToBlob(updated)
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

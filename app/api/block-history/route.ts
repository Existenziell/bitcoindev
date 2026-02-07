import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import type { BlockSnapshot } from '@/app/utils/blockUtils'
import { DEFAULT_LIMIT, MAX_LIMIT } from '@/app/utils/constants'

const BLOCK_HISTORY_BLOB_PATH = 'block-history.json'
/** Optional public URL to read block-history from. When set, avoids list() and saves advanced ops. */
const BLOCK_HISTORY_PUBLIC_URL = process.env.BLOCK_HISTORY_BLOB_URL?.trim() || ''

/** Revalidate cached response every 10 minutes. */
export const revalidate = 600

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

/** Apply limit and beforeHeight to full list; return paginated slice. */
function paginate(blocks: BlockSnapshot[], limit: number, beforeHeight: number | null): BlockSnapshot[] {
  if (beforeHeight !== null && !Number.isNaN(beforeHeight)) {
    const filtered = blocks.filter((b) => b.height < beforeHeight)
    return filtered.slice(0, limit)
  }
  return blocks.slice(0, limit)
}

/**
 * GET only. This app never writes to blob; the GitHub workflow scripts/update-block-history.ts does.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    )
    const beforeHeightParam = searchParams.get('beforeHeight')
    const beforeHeight = beforeHeightParam ? parseInt(beforeHeightParam, 10) : null
    const heightParam = searchParams.get('height')
    const height = heightParam != null && heightParam !== '' ? parseInt(heightParam, 10) : null

    const list = await readBlockHistoryFromBlob()
    const fullList = list ?? []

    const minHeight = fullList.length > 0 ? fullList[fullList.length - 1].height : null
    const maxHeight = fullList.length > 0 ? fullList[0].height : null

    let blocks: BlockSnapshot[]
    if (height != null && !Number.isNaN(height)) {
      const i = fullList.findIndex((b) => b.height === height)
      if (i === -1) {
        blocks = []
      } else {
        const start = Math.max(0, i - Math.floor(limit / 2))
        blocks = fullList.slice(start, start + limit)
      }
      console.log('[block-history] GET returning', blocks.length, 'blocks (limit=', limit, ', height=', height, ')')
    } else {
      blocks = paginate(fullList, limit, beforeHeight)
      console.log('[block-history] GET returning', blocks.length, 'blocks (limit=', limit, ', beforeHeight=', beforeHeight, ')')
    }

    return NextResponse.json({ blocks, minHeight, maxHeight })
  } catch (err) {
    console.error('Block history API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch block history' },
      { status: 500 }
    )
  }
}

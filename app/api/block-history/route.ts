import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import type { BlockSnapshot } from '@/app/utils/blockUtils'
import { DEFAULT_LIMIT, MAX_LIMIT } from '@/app/utils/constants'

const BLOCK_HISTORY_PATH = path.join(process.cwd(), 'public', 'data', 'block-history.json')

/** Revalidate cached response every 10 minutes. */
export const revalidate = 600

/** Read block history from local file. Returns null if not found or parse fails. */
async function readBlockHistoryFromFile(): Promise<BlockSnapshot[] | null> {
  try {
    const raw = await fs.promises.readFile(BLOCK_HISTORY_PATH, 'utf-8')
    const data = JSON.parse(raw)
    const parsed = Array.isArray(data) ? data : Array.isArray(data?.blocks) ? data.blocks : null
    if (!parsed || parsed.length === 0) return null
    return parsed as BlockSnapshot[]
  } catch {
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
 * GET only. Block data is written by scripts/update-block-history.ts (run by GitHub workflow or locally).
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

    const list = await readBlockHistoryFromFile()
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

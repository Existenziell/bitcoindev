import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'

const POOL_DISTRIBUTION_BLOB_PATH = 'pool-distribution.json'

/** Optional public URL to read pool-distribution from. When set, avoids list() and saves advanced ops. */
const POOL_DISTRIBUTION_BLOB_URL = process.env.POOL_DISTRIBUTION_BLOB_URL?.trim() || ''

/** Revalidate cached response every 10 minutes. */
export const revalidate = 600

function parseDistribution(data: unknown): Record<string, number> | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return null
  return data as Record<string, number>
}

export async function GET() {
  try {
    if (POOL_DISTRIBUTION_BLOB_URL) {
      const res = await fetch(POOL_DISTRIBUTION_BLOB_URL, { cache: 'no-store' })
      if (res.ok) {
        const data = parseDistribution(await res.json())
        if (data) return NextResponse.json(data)
      }
    }

    const { blobs } = await list({ prefix: POOL_DISTRIBUTION_BLOB_PATH })
    const blob = blobs.find((b) => b.pathname === POOL_DISTRIBUTION_BLOB_PATH) ?? blobs[0]
    if (!blob?.url) {
      return NextResponse.json({})
    }
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({})
    }
    const data = parseDistribution(await res.json())
    if (!data) return NextResponse.json({})
    return NextResponse.json(data)
  } catch (err) {
    console.error('[pool-distribution] GET error:', err)
    return NextResponse.json({})
  }
}

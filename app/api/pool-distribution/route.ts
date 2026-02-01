import { NextResponse } from 'next/server'
import { list } from '@vercel/blob'

const POOL_DISTRIBUTION_BLOB_PATH = 'pool-distribution.json'

/** Revalidate cached response every 10 minutes. */
export const revalidate = 600

export async function GET() {
  try {
    const { blobs } = await list({ prefix: POOL_DISTRIBUTION_BLOB_PATH })
    const blob = blobs.find((b) => b.pathname === POOL_DISTRIBUTION_BLOB_PATH) ?? blobs[0]
    if (!blob?.url) {
      return NextResponse.json({})
    }
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({})
    }
    const data = await res.json()
    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({})
    }
    return NextResponse.json(data as Record<string, number>)
  } catch (err) {
    console.error('[pool-distribution] GET error:', err)
    return NextResponse.json({})
  }
}

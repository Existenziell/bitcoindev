import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const POOL_DISTRIBUTION_PATH = path.join(process.cwd(), 'public', 'data', 'pool-distribution.json')

/** Revalidate cached response every 10 minutes. */
export const revalidate = 600

function parseDistribution(data: unknown): Record<string, number> | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return null
  return data as Record<string, number>
}

export async function GET() {
  try {
    const raw = await fs.promises.readFile(POOL_DISTRIBUTION_PATH, 'utf-8')
    const data = parseDistribution(JSON.parse(raw))
    if (!data) return NextResponse.json({})
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({})
  }
}

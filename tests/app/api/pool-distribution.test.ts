import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/pool-distribution/route'

const readFileMock = vi.hoisted(() => vi.fn())
vi.mock('fs', () => ({
  promises: {
    readFile: readFileMock,
  },
}))

describe('pool-distribution API route', () => {
  beforeEach(() => {
    readFileMock.mockReset()
  })

  it('returns empty object when file is missing', async () => {
    readFileMock.mockRejectedValueOnce(new Error('ENOENT'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })

  it('returns empty object when file content is null', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify(null))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })

  it('returns empty object when file content is array', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify([]))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })

  it('returns pool distribution when file contains valid object', async () => {
    const distribution = { antpool: 18.5, foundryusa: 15.2, others: 66.3 }
    readFileMock.mockResolvedValueOnce(JSON.stringify(distribution))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(distribution)
  })

  it('returns empty object when readFile throws', async () => {
    readFileMock.mockRejectedValueOnce(new Error('EACCES'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({})
  })
})

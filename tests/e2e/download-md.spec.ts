import { test, expect } from '@playwright/test'

test.describe('Download .md', () => {
  test('API returns 200 and markdown for valid doc path', async ({ request }) => {
    const resp = await request.get(
      '/api/download-md?path=' + encodeURIComponent('/philosophy/fundamentals')
    )
    expect(resp.ok()).toBeTruthy()
    const ct = resp.headers()['content-type'] ?? ''
    expect(ct).toMatch(/text\/markdown/)
    const body = await resp.text()
    expect(body.length).toBeGreaterThan(0)
  })

  test('API returns 400 when path is missing', async ({ request }) => {
    const resp = await request.get('/api/download-md')
    expect(resp.status()).toBe(400)
  })

  test('API returns 404 for unknown path', async ({ request }) => {
    const resp = await request.get(
      '/api/download-md?path=' + encodeURIComponent('/docs/nonexistent')
    )
    expect(resp.status()).toBe(404)
  })
})

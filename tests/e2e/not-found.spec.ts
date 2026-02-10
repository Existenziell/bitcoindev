import { test, expect } from '@playwright/test'

test.describe('404 Not Found', () => {
  test('shows custom Block Not Found for unknown doc path', async ({ page }) => {
    await page.goto('/docs/nonexistent')
    await expect(page.getByRole('heading', { name: /Block Not Found/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Back to Genesis/i })).toHaveAttribute('href', '/')
    await expect(page.getByRole('link', { name: /Start Learning/i })).toHaveAttribute(
      'href',
      '/philosophy/fundamentals'
    )
  })

  test('shows custom Block Not Found for random path', async ({ page }) => {
    await page.goto('/fake-path')
    await expect(page.getByRole('heading', { name: /Block Not Found/i })).toBeVisible()
  })
})

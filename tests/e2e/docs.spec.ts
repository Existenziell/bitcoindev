import { test, expect } from '@playwright/test'

test.describe('Docs', () => {
  test('navigates to fundamentals and shows content', async ({ page }) => {
    await page.goto('/philosophy/fundamentals')
    await expect(page).toHaveURL('/philosophy/fundamentals')
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('navigates to a deep doc and shows content', async ({ page }) => {
    await page.goto('/docs/bitcoin/script')
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toContainText(/Bitcoin Script|Script/i)
  })

  test('shows breadcrumbs and Download .md on a doc page', async ({ page }) => {
    await page.goto('/philosophy/fundamentals')
    // There are two download buttons (top and bottom), so use .first()
    await expect(page.getByRole('button', { name: /Download markdown file/i }).first()).toBeVisible()
  })
})

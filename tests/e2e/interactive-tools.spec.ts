import { test, expect } from '@playwright/test'

test.describe('Interactive Tools', () => {
  test('list page loads with title and tool links', async ({ page }) => {
    await page.goto('/interactive-tools')
    await expect(page).toHaveTitle(/Interactive Tools|BitcoinDev/)
    await expect(page.getByRole('heading', { level: 1, name: /Interactive Tools/i })).toBeVisible()
    // Tool cards only (sidebar also has these links)
    await expect(page.locator('a.tool-card', { hasText: 'Address Decoder' })).toBeVisible()
    await expect(page.locator('a.tool-card', { hasText: 'Transaction Decoder' })).toBeVisible()
    await expect(page.locator('a.tool-card', { hasText: 'Fee Estimator' })).toBeVisible()
  })

  test('Address Decoder page loads', async ({ page }) => {
    await page.goto('/interactive-tools/address-decoder')
    await expect(page).toHaveTitle(/Address Decoder|BitcoinDev/)
    await expect(page.getByRole('heading', { level: 1, name: /Address Decoder/i })).toBeVisible()
  })

  test('Transaction Decoder page loads', async ({ page }) => {
    await page.goto('/interactive-tools/transaction-decoder')
    await expect(page).toHaveTitle(/Transaction Decoder|BitcoinDev/)
    await expect(page.getByRole('heading', { level: 1, name: /Transaction Decoder/i })).toBeVisible()
  })

  test('Fee Estimator page loads', async ({ page }) => {
    await page.goto('/interactive-tools/fee-estimator')
    await expect(page).toHaveTitle(/Fee Estimator|BitcoinDev/)
    await expect(page.getByRole('heading', { level: 1, name: /Fee Estimator/i })).toBeVisible()
  })

  test('Denominations Calculator page loads', async ({ page }) => {
    await page.goto('/interactive-tools/denominations-calculator')
    await expect(page).toHaveTitle(/Denominations Calculator|BitcoinDev/)
    await expect(page.getByRole('heading', { level: 1, name: /Denominations Calculator/i })).toBeVisible()
  })
})

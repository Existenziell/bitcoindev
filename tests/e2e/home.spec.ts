import { test, expect } from '@playwright/test'

test.describe('Home', () => {
  test('loads with title and primary CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/BitcoinDev/)

    const docsLink = page.getByRole('link', { href: '/philosophy/fundamentals' }).first()
    const toolsLink = page.getByRole('link', { href: '/interactive-tools' }).first()
    await expect(docsLink).toBeVisible()
    await expect(toolsLink).toBeVisible()
  })

  test('Explore BitcoinDev expands HorizontalNav', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button').filter({ hasText: /Explore BitcoinDev/i })
    await expect(toggle).toBeVisible()

    // Nav is open by default; click to collapse then expand to test toggle
    await toggle.click()
    await toggle.click()
    await expect(page.getByRole('link', { name: /Fundamentals/i }).first()).toBeVisible()
  })

  test('Live Network Stats section is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Network Stats/i })).toBeVisible()
  })
})

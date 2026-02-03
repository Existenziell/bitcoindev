import { test, expect } from '@playwright/test'

test.describe('Home', () => {
  test('loads with title and primary CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/BitcoinDev/)

    await expect(page.getByRole('link', { name: /Start Learning/i })).toHaveAttribute(
      'href',
      '/docs/fundamentals'
    )
    await expect(page.getByRole('link', { name: /Bitcoin CLI/i })).toHaveAttribute(
      'href',
      '/interactive-tools/terminal'
    )
    await expect(page.getByRole('link', { name: /Stack Lab/i }).first()).toHaveAttribute(
      'href',
      '/interactive-tools/stack-lab'
    )
  })

  test('Explore BitcoinDev expands HorizontalNav', async ({ page }) => {
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /Explore BitcoinDev/i })
    await expect(toggle).toBeVisible()

    await toggle.click()
    await expect(page.getByRole('link', { name: /Fundamentals/i }).first()).toBeVisible()
  })

  test('Live Network Stats section is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Live Network Stats/i })).toBeVisible()
  })
})

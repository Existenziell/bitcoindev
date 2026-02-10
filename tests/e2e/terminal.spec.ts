import { test, expect } from '@playwright/test'

test.describe('Terminal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.speak = () => {}
      }
    })
  })

  test('page loads with heading, input, and Run button', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await expect(page.getByRole('heading', { level: 1, name: /Bitcoin CLI Terminal/i })).toBeVisible()
    await expect(page.getByPlaceholder(/enter command/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Run' })).toBeVisible()
  })

  test('help shows Available commands', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('help')
    await page.getByRole('button', { name: 'Run' }).click()
    // "Available commands:" (with colon) is only in help output; startup log has "Type 'help' for available commands."
    await expect(page.getByText('Available commands:')).toBeVisible({ timeout: 10000 })
  })

  test('help getblockchaininfo shows Command and Description', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('help getblockchaininfo')
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.getByText('Command: getblockchaininfo')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Description:')).toBeVisible()
  })

  test('clear clears output', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('help')
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.getByText('Available commands:')).toBeVisible({ timeout: 10000 })

    await page.getByPlaceholder(/enter command/i).fill('clear')
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(page.getByText('Available commands:')).not.toBeVisible()
  })

  test('unknown command shows error', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('foo')
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.getByText(/unknown command/i)).toBeVisible({ timeout: 10000 })
    // Error message suggests "Type 'help' for available commands." - use last() since startup log also contains "help"
    await expect(page.getByText(/help/i).last()).toBeVisible()
  })

  test('getblockcount returns JSON number', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('getblockcount')
    await page.getByRole('button', { name: 'Run' }).click()
    // Wait for RPC to finish (Loading... disappears) so we don't race with the async response
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 20000 })
    // Result is a pre containing only digits (optionally with trailing whitespace)
    await expect(page.locator('pre').filter({ hasText: /^\d+\s*$/ })).toBeVisible({ timeout: 10000 })
  })

  test('secret trigger shows fake error then SECRET overlay', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('pizza')
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(
      page.getByText(/Kernel Panic|Quantum Entanglement|System Overload/)
    ).toBeVisible({ timeout: 10000 })

    await expect(
      page.getByRole('button', { name: 'Back to Terminal' })
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByRole('button', { name: 'Return Home' })
    ).toBeVisible()
  })

  test('Back to Terminal closes secret overlay', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('nakamoto')
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(
      page.getByRole('button', { name: 'Back to Terminal' })
    ).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Back to Terminal' }).click()

    await expect(
      page.getByRole('button', { name: 'Back to Terminal' })
    ).not.toBeVisible()
    await expect(page.getByPlaceholder(/enter command/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Run' })).toBeVisible()
  })

  test('Return Home navigates away from terminal', async ({ page }) => {
    await page.goto('/interactive-tools/terminal')
    await page.getByPlaceholder(/enter command/i).fill('secret')
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(
      page.getByRole('button', { name: 'Return Home' })
    ).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Return Home' }).click()

    await expect(page).toHaveURL('/')
  })
})

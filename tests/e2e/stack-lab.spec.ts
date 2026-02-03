import { test, expect } from '@playwright/test'

test.describe('Stack Lab', () => {
  test('page loads with title, heading, and subtitle', async ({ page }) => {
    await page.goto('/interactive-tools/stack-lab')
    await expect(page).toHaveTitle(/Stack Lab|B\+\+/)
    await expect(page.getByRole('heading', { level: 1, name: /Stack Lab/i })).toBeVisible()
    await expect(page.getByText('Interactive Bitcoin Script Playground')).toBeVisible()
  })

  test('Script Templates and workspace are visible after load', async ({ page }) => {
    await page.goto('/interactive-tools/stack-lab')
    await expect(page.getByText('Simple Addition').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Unlocking Script' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Locking Script', exact: true })).toBeVisible()
  })

  test('load Simple Addition template, Execute, and see success', async ({ page }) => {
    await page.goto('/interactive-tools/stack-lab')
    await expect(page.getByText('Simple Addition').first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /Simple Addition/i }).first().click()

    await page.getByRole('button', { name: /Execute/i }).click()

    await expect(page.getByText('Script Valid')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('1').first()).toBeVisible()
  })

  test('Reset clears scripts and stack', async ({ page }) => {
    await page.goto('/interactive-tools/stack-lab')
    await expect(page.getByText('Simple Addition').first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /Simple Addition/i }).first().click()
    await page.getByRole('button', { name: /Execute/i }).click()
    await expect(page.getByText('Script Valid')).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: /Reset/i }).click()

    await expect(page.getByText('Stack is empty')).toBeVisible()
    await expect(page.getByText('Script Valid')).not.toBeVisible()
  })

  test('Push Data: add value to Unlocking Script via modal', async ({ page }) => {
    await page.goto('/interactive-tools/stack-lab')
    await expect(page.getByText('Simple Addition').first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /Push Data/i }).first().click()
    await expect(page.getByRole('heading', { name: /Push Data to Unlocking/i })).toBeVisible()

    await page.getByPlaceholder(/Enter data/i).fill('42')
    await page.locator('.modal-card').getByRole('button', { name: 'Add' }).click()

    await expect(page.getByText('42')).toBeVisible()
  })

  test('Step: load template and step through execution', async ({ page }) => {
    await page.goto('/interactive-tools/stack-lab')
    await expect(page.getByText('Simple Addition').first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: /Simple Addition/i }).first().click()

    await page.getByRole('button', { name: /^→$/ }).click()
    await expect(page.getByRole('heading', { name: 'Execution Log' })).toBeVisible()

    await page.getByRole('button', { name: /^→$/ }).click()
    await page.getByRole('button', { name: /^→$/ }).click()
    await page.getByRole('button', { name: /^→$/ }).click()
    await page.getByRole('button', { name: /^→$/ }).click()

    await expect(page.getByText('1').first()).toBeVisible()
  })

  test('Challenges tab shows challenge list and difficulty filters', async ({ page }) => {
    await page.goto('/interactive-tools/stack-lab')
    await expect(page.getByText('Simple Addition').first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('tab', { name: /Challenges/i }).click()
    await expect(page.getByText(/Test your script knowledge|Select a challenge/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /Easy|Medium|Hard/i }).first()).toBeVisible()
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from '@/app/components/ThemeToggle'
import { useTheme } from 'next-themes'

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useTheme as any).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    })
  })

  it('renders theme toggle buttons', async () => {
    render(<ThemeToggle />)

    // Wait for mount (placeholder has no role/buttons)
    const lightButton = await screen.findByLabelText('Light theme')
    expect(lightButton).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /theme/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Dark theme')).toBeInTheDocument()
    expect(screen.getByLabelText('System theme')).toBeInTheDocument()
  })

  it('shows placeholder before mount to avoid hydration mismatch', async () => {
    const { container } = render(<ThemeToggle />)

    // Should show placeholder divs on first paint
    const placeholder = container.querySelector('div > div')
    expect(placeholder).toBeInTheDocument()

    // Flush mount effect (queueMicrotask) inside act to avoid act warning
    await act(async () => {
      await Promise.resolve()
    })
  })

  it('calls setTheme when light button is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const lightButton = await screen.findByLabelText('Light theme')
    await user.click(lightButton)

    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('calls setTheme when dark button is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const darkButton = await screen.findByLabelText('Dark theme')
    await user.click(darkButton)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme when system button is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const systemButton = await screen.findByLabelText('System theme')
    await user.click(systemButton)

    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })

  it('highlights active theme', async () => {
    ;(useTheme as any).mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    const darkButton = await screen.findByLabelText('Dark theme')
    expect(darkButton.className).toContain('bg-accent')
  })

  it('does not highlight inactive themes', async () => {
    ;(useTheme as any).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    })

    render(<ThemeToggle />)

    const darkButton = await screen.findByLabelText('Dark theme')
    expect(darkButton.className).not.toContain('bg-accent')
  })
})

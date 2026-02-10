import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import BitcoinHistoryBanner from '@/app/components/BitcoinHistoryBanner'
import type { BitcoinHistoryEvent } from '@/app/utils/bitcoinHistoryDates'

const mockGetTodayBitcoinEvent = vi.fn()
vi.mock('@/app/utils/bitcoinHistoryDates', () => ({
  getTodayBitcoinEvent: () => mockGetTodayBitcoinEvent(),
}))

vi.mock('next/image', () => ({
  default: ({ alt }: { src: string; alt: string }) => (
    <div role="img" aria-label={alt} data-testid="mock-image" />
  ),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

describe('BitcoinHistoryBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders null when getTodayBitcoinEvent returns null', async () => {
    mockGetTodayBitcoinEvent.mockReturnValue(null)
    const { container } = render(<BitcoinHistoryBanner />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(container.firstChild).toBeNull()
  })

  it('renders banner with event name and message when event exists', async () => {
    const event: BitcoinHistoryEvent = {
      month: 5,
      day: 22,
      eventName: 'Pizza Day',
      message:
        'Laszlo Hanyecz paid 10,000 BTC for two pizzas, marking the first real-world Bitcoin transaction.',
      link: '/philosophy/fundamentals/monetary-properties',
    }
    mockGetTodayBitcoinEvent.mockReturnValue(event)
    vi.useFakeTimers()

    render(<BitcoinHistoryBanner />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByRole('heading', { name: 'Happy Pizza Day!' })).toBeInTheDocument()
    expect(
      screen.getByText(/Exactly today, Laszlo Hanyecz paid 10,000 BTC/)
    ).toBeInTheDocument()
    const learnMore = screen.getByRole('link', { name: /Learn more/i })
    expect(learnMore).toHaveAttribute(
      'href',
      '/philosophy/fundamentals/monetary-properties'
    )

    vi.useRealTimers()
  })

  it('shows message with time when event has time', async () => {
    const event: BitcoinHistoryEvent = {
      month: 1,
      day: 3,
      eventName: 'Birthday Bitcoin',
      time: '18:15 UTC',
      message: 'the Bitcoin genesis block was mined.',
      link: '/philosophy/history',
    }
    mockGetTodayBitcoinEvent.mockReturnValue(event)

    render(<BitcoinHistoryBanner />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(
      screen.getByText(/Exactly 18:15 UTC today, the Bitcoin genesis block was mined\./)
    ).toBeInTheDocument()
  })

  it('does not show Learn more link when event has no link', async () => {
    const event: BitcoinHistoryEvent = {
      month: 5,
      day: 22,
      eventName: 'Pizza Day',
      message: 'Some message without link.',
    }
    mockGetTodayBitcoinEvent.mockReturnValue(event)

    render(<BitcoinHistoryBanner />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByRole('heading', { name: 'Happy Pizza Day!' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Learn more/i })).not.toBeInTheDocument()
  })

  it('does not render content until after mount', async () => {
    const event: BitcoinHistoryEvent = {
      month: 5,
      day: 22,
      eventName: 'Pizza Day',
      message: 'Test message.',
    }
    mockGetTodayBitcoinEvent.mockReturnValue(event)
    const { container } = render(<BitcoinHistoryBanner />)

    expect(container.firstChild).toBeNull()

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByRole('heading', { name: 'Happy Pizza Day!' })).toBeInTheDocument()
  })
})

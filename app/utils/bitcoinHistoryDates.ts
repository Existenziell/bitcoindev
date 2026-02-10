/**
 * Bitcoin historical events and date matching utilities.
 * Used to display celebratory messages on significant dates in Bitcoin's history.
 */

export interface BitcoinHistoryEvent {
  month: number // 1-12 (January = 1)
  day: number // 1-31
  year?: number // Optional: if provided, matches exact year; if not, matches annually
  time?: string // Optional: time of the event (e.g., "18:15 UTC")
  eventName: string // Name of the event (e.g., "Pizza Day", "Bitcoin's Birthday")
  message: string // The rest of the message after "Exactly [time] today, ..."
  link?: string // Optional: link to related section (e.g., '/philosophy/history' or '/philosophy/history/halvings')
}

/**
 * Significant dates in Bitcoin's history.
 * Dates without a year will match annually on that month/day.
 * Dates with a year will only match on the exact date.
 */
export const BITCOIN_HISTORY_EVENTS: BitcoinHistoryEvent[] = [
  {
    month: 10,
    day: 31,
    year: 2008,
    eventName: 'Bitcoin Whitepaper Day',
    message: 'Satoshi Nakamoto published the Bitcoin whitepaper, introducing the world to peer-to-peer electronic cash.',
    link: '/whitepaper',
  },
  {
    month: 1,
    day: 3,
    eventName: 'Birthday Bitcoin',
    message: 'the Bitcoin genesis block was mined, marking the birth of the Bitcoin network.',
    link: '/philosophy/history',
  },
  {
    month: 1,
    day: 12,
    year: 2009,
    eventName: 'First Bitcoin Transaction Day',
    message: 'Satoshi Nakamoto sent 10 BTC to Hal Finney in the first Bitcoin transaction.',
    link: '/philosophy/history',
  },
  {
    month: 5,
    day: 22,
    eventName: 'Pizza Day',
    message: 'Laszlo Hanyecz paid 10,000 BTC for two pizzas, marking the first real-world Bitcoin transaction.',
    link: '/philosophy/fundamentals/monetary-properties',
  },
  {
    month: 11,
    day: 28,
    year: 2012,
    eventName: 'First Bitcoin Halving',
    message: 'Bitcoin experienced its first halving, reducing the block reward from 50 BTC to 25 BTC.',
    link: '/philosophy/history/halvings',
  },
  {
    month: 7,
    day: 9,
    year: 2016,
    eventName: 'Second Bitcoin Halving',
    message: 'Bitcoin experienced its second halving, reducing the block reward from 25 BTC to 12.5 BTC.',
    link: '/philosophy/history/halvings',
  },
  {
    month: 5,
    day: 11,
    year: 2020,
    eventName: 'Third Bitcoin Halving',
    message: 'Bitcoin experienced its third halving, reducing the block reward from 12.5 BTC to 6.25 BTC.',
    link: '/philosophy/history/halvings',
  },
  {
    month: 4,
    day: 20,
    year: 2024,
    eventName: 'Fourth Bitcoin Halving',
    message: 'Bitcoin experienced its fourth halving, reducing the block reward from 6.25 BTC to 3.125 BTC.',
    link: '/philosophy/history/halvings',
  },
]

/**
 * Get the Bitcoin history event that matches today's date.
 * 
 * Priority:
 * 1. Exact year matches (if year is specified in event)
 * 2. Annual anniversaries (if year is not specified in event)
 * 
 * If multiple events match, returns the first one found.
 * 
 * @returns The matching event or null if no event matches today
 */
export function getTodayBitcoinEvent(): BitcoinHistoryEvent | null {
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // getMonth() returns 0-11, we need 1-12
  const currentDay = today.getDate()
  const currentYear = today.getFullYear()

  // First, check for exact year matches
  const exactMatch = BITCOIN_HISTORY_EVENTS.find(
    (event) =>
      event.year !== undefined &&
      event.month === currentMonth &&
      event.day === currentDay &&
      event.year === currentYear
  )

  if (exactMatch) {
    return exactMatch
  }

  // Then check for annual anniversaries (no year specified)
  const annualMatch = BITCOIN_HISTORY_EVENTS.find(
    (event) =>
      event.year === undefined &&
      event.month === currentMonth &&
      event.day === currentDay
  )

  return annualMatch || null
}

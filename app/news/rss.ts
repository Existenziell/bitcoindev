import { XMLParser } from 'fast-xml-parser'

type FeedType = 'official' | 'news' | 'mailing-list'

export interface NewsFeedConfig {
  id: string
  name: string
  url: string
  type: FeedType
}

export interface NewsItem {
  id: string
  title: string
  link: string
  sourceId: string
  sourceName: string
  type: FeedType
  publishedAt: Date
  description?: string
}

// Mixed feed sources: official + ecosystem news
export const NEWS_FEEDS: NewsFeedConfig[] = [
  {
    id: 'bitcoincore',
    name: 'Bitcoin Core',
    url: 'https://bitcoincore.org/en/feed.xml',
    type: 'official',
  },
  {
    id: 'bitcoin-optech',
    name: 'Bitcoin Optech',
    url: 'https://bitcoinops.org/feed.xml',
    type: 'news',
  },
  {
    id: 'decrypt',
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    type: 'news',
  },
  {
    id: 'bitcoin-dev-list',
    name: 'Bitcoin-Dev',
    url: 'https://gnusha.org/pi/bitcoindev/new.atom',
    type: 'mailing-list',
  },
]

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
})

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function ensureUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return null
  }
  return value
}

function getLink(rawItem: any): string | null {
  const rawLink = rawItem.link
  if (typeof rawLink === 'string') return ensureUrl(rawLink)
  if (rawLink && typeof rawLink === 'object') {
    const href = rawLink.href ?? rawLink['@_href'] ?? (Array.isArray(rawLink) ? rawLink[0]?.href ?? rawLink[0]?.['@_href'] : null)
    if (typeof href === 'string') return ensureUrl(href)
  }
  const guid = rawItem.guid
  if (guid && typeof guid === 'object' && (guid['#text'] ?? guid['_'] ?? guid)) {
    return ensureUrl(String(guid['#text'] ?? guid['_'] ?? guid))
  }
  return typeof guid === 'string' ? ensureUrl(guid) : null
}

function getTitle(rawItem: any): string {
  const t = rawItem.title
  if (typeof t === 'string') return t.trim()
  if (t && typeof t === 'object' && (t['#text'] ?? t['_'])) return String(t['#text'] ?? t['_']).trim()
  return ''
}

/** Strip HTML tags and decode common entities; truncate to maxLen. */
function plainSnippet(html: string, maxLen = 300): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLen ? `${text.slice(0, maxLen).trim()}…` : text
}

function getDescription(rawItem: any): string | undefined {
  const desc = rawItem.description ?? rawItem.summary
  let value: string | undefined
  if (typeof desc === 'string') value = desc.trim()
  else if (desc && typeof desc === 'object' && (desc['#text'] ?? desc['_']))
    value = String(desc['#text'] ?? desc['_']).trim()
  if (value) return value

  const content = rawItem.content
  if (typeof content === 'string' && content.length > 0) return plainSnippet(content)
  if (content && typeof content === 'object' && (content['#text'] ?? content['_']))
    return plainSnippet(String(content['#text'] ?? content['_']))
  return undefined
}

function normalizeItem(rawItem: any, feed: NewsFeedConfig): NewsItem | null {
  if (!rawItem) return null

  const title = getTitle(rawItem)
  const link = getLink(rawItem) ?? ''

  if (!title || !link) return null

  const publishedAt =
    parseDate(rawItem.pubDate ?? rawItem.published ?? rawItem.updated) ??
    new Date()

  const description = getDescription(rawItem)

  return {
    id: `${feed.id}:${link}`,
    title,
    link,
    sourceId: feed.id,
    sourceName: feed.name,
    type: feed.type,
    publishedAt,
    description,
  }
}

async function fetchFeed(feed: NewsFeedConfig): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      // Let page-level revalidate control caching; this ensures
      // we don't accidentally cache forever at the fetch layer.
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      console.error(`[news] Failed to fetch feed ${feed.id}: ${res.status} ${res.statusText}`)
      return []
    }

    const xml = await res.text()
    const parsed = parser.parse(xml)

    const raw =
      parsed?.rss?.channel?.item ??
      parsed?.feed?.entry ??
      []
    const channelItems: any[] = Array.isArray(raw) ? raw : raw ? [raw] : []

    const items = channelItems
      .map((item) => normalizeItem(item, feed))
      .filter((item): item is NewsItem => item !== null)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, 5)
    return items
  } catch (error) {
    console.error(`[news] Error fetching feed ${feed.id}:`, error)
    return []
  }
}

export async function fetchAllNewsItems(limit = 40): Promise<NewsItem[]> {
  const results = await Promise.all(NEWS_FEEDS.map((feed) => fetchFeed(feed)))

  const allItems = results.flat()

  // Dedupe by source+title so the same post (e.g. same thread with different link URLs) appears once
  const seen = new Map<string, NewsItem>()
  for (const item of allItems) {
    const key = `${item.sourceId}:${item.title}`
    if (!seen.has(key)) seen.set(key, item)
  }

  const deduped = Array.from(seen.values())

  deduped.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  )

  return deduped.slice(0, limit)
}


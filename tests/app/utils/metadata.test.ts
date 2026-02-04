import { describe, it, expect } from 'vitest'
import {
  generatePageMetadata,
  getSiteStructuredData,
  getDocPageStructuredData,
  SITE_URL,
  DEFAULT_OG_IMAGE,
} from '@/app/utils/metadata'

describe('generatePageMetadata', () => {
  it('returns fullTitle as "Title | BitcoinDev"', () => {
    const meta = generatePageMetadata({ title: 'Foo', description: 'Desc' })
    expect(meta.title).toBe('Foo | BitcoinDev')
  })

  it('returns description as given', () => {
    const meta = generatePageMetadata({ title: 'T', description: 'My description' })
    expect(meta.description).toBe('My description')
  })

  it('builds openGraph.url from SITE_URL and path when path is provided', () => {
    const meta = generatePageMetadata({ title: 'T', description: 'D', path: '/docs/bitcoin' })
    expect(meta.openGraph?.url).toBe(`${SITE_URL}/docs/bitcoin`)
  })

  it('uses SITE_URL only when path is default empty', () => {
    const meta = generatePageMetadata({ title: 'T', description: 'D' })
    expect(meta.openGraph?.url).toBe(SITE_URL)
  })

  it('uses default ogImage for openGraph.images[0].url when not overridden', () => {
    const meta = generatePageMetadata({ title: 'T', description: 'D' })
    expect(meta.openGraph?.images?.[0]?.url).toBe(DEFAULT_OG_IMAGE)
  })

  it('uses overridden ogImage when provided', () => {
    const custom = '/custom/og.png'
    const meta = generatePageMetadata({ title: 'T', description: 'D', ogImage: custom })
    expect(meta.openGraph?.images?.[0]?.url).toBe(custom)
    expect(meta.twitter?.images?.[0]).toMatchObject({ url: custom, width: 1200, height: 630 })
  })

  it('sets twitter.card to summary_large_image', () => {
    const meta = generatePageMetadata({ title: 'T', description: 'D' })
    expect(meta.twitter?.card).toBe('summary_large_image')
  })
})

describe('getSiteStructuredData', () => {
  it('returns JSON string with WebSite and Organization', () => {
    const json = getSiteStructuredData()
    const data = JSON.parse(json)
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
    expect(data[0]['@type']).toBe('WebSite')
    expect(data[0].name).toBe('BitcoinDev')
    expect(data[0].url).toBe(SITE_URL)
    expect(data[1]['@type']).toBe('Organization')
    expect(data[1].name).toBe('BitcoinDev')
  })

  it('includes schema.org context', () => {
    const json = getSiteStructuredData()
    const data = JSON.parse(json)
    expect(data[0]['@context']).toBe('https://schema.org')
    expect(data[0].publisher?.logo?.url).toContain(SITE_URL)
  })
})

describe('getDocPageStructuredData', () => {
  it('returns JSON string with BreadcrumbList and Article', () => {
    const breadcrumbs = [
      { label: 'Docs', href: '/docs' },
      { label: 'Bitcoin', href: '/docs/bitcoin' },
    ]
    const json = getDocPageStructuredData('/docs/bitcoin', 'Bitcoin', 'About Bitcoin', breadcrumbs)
    const data = JSON.parse(json)
    expect(data).toHaveLength(2)
    expect(data[0]['@type']).toBe('BreadcrumbList')
    expect(data[1]['@type']).toBe('Article')
    expect(data[1].headline).toBe('Bitcoin')
    expect(data[1].url).toBe(`${SITE_URL}/docs/bitcoin`)
  })

  it('maps breadcrumb href to full URL when relative', () => {
    const breadcrumbs = [{ label: 'Home', href: '/docs' }]
    const json = getDocPageStructuredData('/docs', 'Docs', 'Desc', breadcrumbs)
    const data = JSON.parse(json)
    const item = data[0].itemListElement[0]
    expect(item.item).toBe(`${SITE_URL}/docs`)
    expect(item.position).toBe(1)
    expect(item.name).toBe('Home')
  })

  it('keeps absolute href as-is in breadcrumb item', () => {
    const breadcrumbs = [{ label: 'External', href: 'https://example.com/page' }]
    const json = getDocPageStructuredData('/docs', 'Doc', 'D', breadcrumbs)
    const data = JSON.parse(json)
    expect(data[0].itemListElement[0].item).toBe('https://example.com/page')
  })
})

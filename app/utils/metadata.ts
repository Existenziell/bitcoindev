import type { Metadata } from 'next'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './constants'

// Site and OG config
export const DEFAULT_OG_IMAGE = '/images/og/og.png'
export const OG_LOGO = '/icons/logo/logo.png'

/** JSON-LD for WebSite + Organization (root layout). */
export function getSiteStructuredData(): string {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description:
        `${SITE_NAME} | ${SITE_DESCRIPTION}`,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}${OG_LOGO}` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}${OG_LOGO}`,
    },
  ]
  return JSON.stringify(data)
}

/** JSON-LD for doc pages: BreadcrumbList + Article. */
export function getDocPageStructuredData(
  path: string,
  title: string,
  description: string,
  breadcrumbs: { label: string; href: string }[]
): string {
  const url = `${SITE_URL}${path}`
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.label,
        item: item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url,
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    },
  ]
  return JSON.stringify(data)
}

export function generatePageMetadata({
  title,
  description,
  path = '',
  ogImage = DEFAULT_OG_IMAGE,
}: {
  title: string
  description: string
  path?: string
  ogImage?: string
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`
  const url = `${SITE_URL}${path}`

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
  }
}

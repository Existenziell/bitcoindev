import type { MetadataRoute } from 'next'

import { docPages } from '@/app/utils/navigation'
import { SITE_URL } from '@/app/utils/metadata'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPaths = [
    '/',
    '/docs',
    '/docs/glossary',
    '/tools',
    '/tools/hash',
    '/whitepaper',
    '/terminal',
    '/stack-lab',
    '/block-visualizer',
    '/about',
    '/feedback',
  ]

  const urls = new Set<string>([
    ...staticPaths.map((p) => `${SITE_URL}${p}`),
    ...docPages.map((p) => `${SITE_URL}${p.path}`),
  ])

  return Array.from(urls).map((url) => ({
    url,
    lastModified: now,
  }))
}


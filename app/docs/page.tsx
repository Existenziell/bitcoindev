import type { Metadata } from 'next'
import Link from 'next/link'
import { generatePageMetadata } from '@/app/utils/metadata'
import DocsSearch from '@/app/components/search/DocsSearch'
import { navItems, sections } from '@/app/utils/navigation'

export const metadata: Metadata = generatePageMetadata({
  title: 'Bitcoin Development Documentation',
  description:
    'Bitcoin development documentation for developers. Open source guides on fundamentals, protocol, wallets, Lightning, and more.',
  path: '/docs',
})

export default function DocsOverviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-page mb-4">Bitcoin Documentation</h1>
        <p className="text-secondary text-lg max-w-3xl">
          Explore the BitcoinDev documentation or use the search to find specific topics.
        </p>
      </div>
      <DocsSearch />

      <nav className="my-10" aria-label="Documentation sections">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
          {navItems.map((item) => {
            const sectionKey = item.href.replace(/^\/docs\//, '') || 'fundamentals'
            const meta = sections[sectionKey as keyof typeof sections]
            const description = meta?.description
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex flex-col gap-1 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-btc hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hover:no-underline"
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-btc transition-colors">
                    {item.title}
                  </span>
                  {description && (
                    <span className="text-sm text-secondary line-clamp-2">
                      {description}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

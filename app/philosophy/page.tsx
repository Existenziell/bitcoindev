import type { Metadata } from 'next'
import Link from 'next/link'
import { generatePageMetadata } from '@/app/utils/metadata'
import DocsSearch from '@/app/components/search/DocsSearch'
import { philosophyNavItems, sections } from '@/app/utils/navigation'

export const metadata: Metadata = generatePageMetadata({
  title: 'Bitcoin Philosophy',
  description:
    'Bitcoin philosophy, history, controversies, investment, and adoption. Narrative and conceptual material for understanding Bitcoin.',
  path: '/philosophy',
})

export default function PhilosophyOverviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="heading-page mb-4">Bitcoin Philosophy</h1>
        <p className="text-secondary text-lg max-w-3xl">
          Narrative and conceptual material for understanding Bitcoin and giving context to the Bitcoin documentation.
        </p>
      </div>
      <DocsSearch />

      <nav className="my-10" aria-label="Philosophy sections">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
          {philosophyNavItems.map((item) => {
            const sectionKey = item.href.replace(/^\/philosophy\//, '') || 'fundamentals'
            const meta = sections[sectionKey as keyof typeof sections]
            const description = meta?.description
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex flex-col gap-1 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:border-accent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hover:no-underline"
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent transition-colors">
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

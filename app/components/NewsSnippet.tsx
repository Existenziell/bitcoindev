import Link from 'next/link'
import { fetchAllNewsItems } from '@/app/news/rss'

const SNIPPET_LIMIT = 5

function formatSnippetDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function NewsSnippet() {
  const items = await fetchAllNewsItems(SNIPPET_LIMIT)

  if (items.length === 0) return null

  return (
    <div className="container-content pb-8 md:pb-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="heading-section-muted text-center mb-4">
          Latest Bitcoin News
        </h2>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 px-4 py-3 hover:border-accent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group hover:no-underline"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-accent block">
                  {item.title}
                </span>
                <span className="text-xs text-secondary mt-0.5 block">
                  {item.sourceName} · {formatSnippetDate(item.publishedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-center mt-4">
          <Link
            href="/news"
            className="link-primary link-incognito text-sm font-medium"
          >
            View all news →
          </Link>
        </p>
      </div>
    </div>
  )
}

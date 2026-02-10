import Link from 'next/link'
import { fetchAllNewsItems, NEWS_FEEDS } from '@/app/news/rss'
import { fetchBitcoinRepoStats } from '@/app/news/github'

export const revalidate = 1800 // 30 minutes

function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

export default async function NewsPage() {
  const [items, githubStats] = await Promise.all([
    fetchAllNewsItems(),
    fetchBitcoinRepoStats(),
  ])

  return (
    <main className='space-y-8'>
      <section className='space-y-3'>
        <h1 className='heading-page'>
          Bitcoin News
        </h1>
        <p className='text-lg text-muted-foreground max-w-2xl'>
          Aggregated Bitcoin news and official announcements from multiple reputable sources.
          Links below take you to the original publisher.
        </p>
        <div className='text-sm text-muted-foreground flex flex-wrap gap-2'>
          <span className='font-semibold'>
            Sources:
          </span>
          {NEWS_FEEDS.map((feed) => (
            <span
              key={feed.id}
              className='inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 px-3 py-1 text-xs'
            >
              <span className='font-medium'>
                {feed.name}
              </span>
              <span className='text-[10px] uppercase tracking-wide text-muted-foreground'>
                {feed.type === 'official' ? 'Official' : feed.type === 'mailing-list' ? 'Mailing list' : 'News'}
              </span>
            </span>
          ))}
        </div>
        <p className='text-xs text-muted-foreground'>
          This page refreshes roughly every 30 minutes. Always verify information and consider multiple sources.
        </p>
      </section>

      {githubStats && (
        <section aria-label='Bitcoin Core on GitHub' className='rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 p-4'>
          <h2 className='text-lg font-semibold mb-3'>
            Bitcoin Core on GitHub
          </h2>
          {githubStats.repoDescription && (
            <p className='text-sm text-muted-foreground mb-4 max-w-2xl'>
              {githubStats.repoDescription}
            </p>
          )}
          <div className='flex flex-wrap gap-4 gap-y-2 text-sm'>
            <a
              href={githubStats.repoUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='link-primary font-medium'
            >
              github.com/bitcoin/bitcoin
            </a>
            <span className='text-muted-foreground' aria-hidden='true'>·</span>
            <span title='Stars'>
              <strong className='text-foreground'>{formatNumber(githubStats.stars)}</strong>
              <span className='text-muted-foreground'> stars</span>
            </span>
            <span className='text-muted-foreground' aria-hidden='true'>·</span>
            <span title='Forks'>
              <strong className='text-foreground'>{formatNumber(githubStats.forks)}</strong>
              <span className='text-muted-foreground'> forks</span>
            </span>
            <span className='text-muted-foreground' aria-hidden='true'>·</span>
            <span title='Contributors'>
              <strong className='text-foreground'>
                {githubStats.contributors != null ? formatNumber(githubStats.contributors) : '—'}
              </strong>
              <span className='text-muted-foreground'> contributors</span>
            </span>
            {githubStats.defaultBranchCommits != null && (
              <>
                <span className='text-muted-foreground' aria-hidden='true'>·</span>
                <span title='Commits on default branch'>
                  <strong className='text-foreground'>{formatNumber(githubStats.defaultBranchCommits)}</strong>
                  <span className='text-muted-foreground'> commits</span>
                </span>
              </>
            )}
            <span className='text-muted-foreground' aria-hidden='true'>·</span>
            <span title='Open issues'>
              <strong className='text-foreground'>{formatNumber(githubStats.openIssues)}</strong>
              <span className='text-muted-foreground'> open issues</span>
            </span>
            {githubStats.language && (
              <>
                <span className='text-muted-foreground' aria-hidden='true'>·</span>
                <span className='text-muted-foreground'>{githubStats.language}</span>
              </>
            )}
          </div>
          {githubStats.pushedAt && (
            <p className='text-xs text-muted-foreground mt-2'>
              Last push: {formatDate(new Date(githubStats.pushedAt))}
            </p>
          )}
        </section>
      )}

      <section aria-label='Latest Bitcoin news' className='space-y-4'>
        {items.length === 0 ? (
          <p className='text-muted-foreground'>
            No news items available right now. Please try again in a few minutes.
          </p>
        ) : (
          <ul className='space-y-4'>
            {items.map((item) => (
              <li key={item.id}>
                <article className='group rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 p-4 hover:border-accent hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'>
                  <header className='flex flex-col gap-2'>
                    <div className='flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground'>
                      <span className='inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 px-2 py-0.5'>
                        <span className='font-medium'>
                          {item.sourceName}
                        </span>
                        <span className='text-[10px] uppercase tracking-wide'>
                          {item.type === 'official' ? 'Official' : item.type === 'mailing-list' ? 'Mailing list' : 'News'}
                        </span>
                      </span>
                      <time dateTime={item.publishedAt.toISOString()}>
                        {formatDate(item.publishedAt)}
                      </time>
                    </div>
                    <h2 className='text-base font-semibold leading-snug'>
                      <Link
                        href={item.link}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='link-primary'
                      >
                        {item.title}
                      </Link>
                    </h2>
                  </header>
                  {item.description && (
                    <p className='mt-2 text-sm text-muted-foreground line-clamp-3'>
                      {item.description}
                    </p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}


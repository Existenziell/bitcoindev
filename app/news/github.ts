/**
 * Fetches public stats for the bitcoin/bitcoin repo from GitHub API.
 * Cached with the page's revalidate (e.g. 30 min). Optional GITHUB_TOKEN
 * increases rate limits (60/h unauthenticated, 5000/h with token).
 */

const GITHUB_REPO = 'bitcoin/bitcoin'
const GITHUB_API = 'https://api.github.com'
const GITHUB_GRAPHQL = 'https://api.github.com/graphql'

export interface BitcoinRepoStats {
  stars: number
  forks: number
  watchers: number
  openIssues: number
  language: string | null
  contributors: number | null
  defaultBranchCommits: number | null
  pushedAt: string | null
  repoUrl: string
  repoDescription: string | null
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'BitcoinDev-News',
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/** Parse Link header to get last page number (total count when per_page=1). */
function getLastPageFromLink(linkHeader: string | null): number | null {
  if (!linkHeader) return null
  const lastMatch = linkHeader.match(/<[^>]+[?&]page=(\d+)>;\s*rel="last"/)
  return lastMatch ? parseInt(lastMatch[1], 10) : null
}

export async function fetchBitcoinRepoStats(): Promise<BitcoinRepoStats | null> {
  try {
    const [repoRes, contributorsRes] = await Promise.all([
      fetch(`${GITHUB_API}/repos/${GITHUB_REPO}`, {
        headers: getHeaders(),
        next: { revalidate: 1800 },
      }),
      fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contributors?per_page=1`, {
        headers: getHeaders(),
        next: { revalidate: 1800 },
      }),
    ])

    if (!repoRes.ok) {
      console.error('[news/github] Repo fetch failed:', repoRes.status, repoRes.statusText)
      return null
    }

    const repo = (await repoRes.json()) as {
      stargazers_count: number
      forks_count: number
      open_issues_count: number
      watchers_count?: number
      language: string | null
      pushed_at: string | null
      default_branch: string
      html_url: string
      description: string | null
    }

    const contributorsTotal =
      contributorsRes.ok && contributorsRes.headers.get('Link')
        ? getLastPageFromLink(contributorsRes.headers.get('Link'))
        : null

    // Optional: total commits on default branch via GraphQL (no auth required for public read)
    let defaultBranchCommits: number | null = null
    try {
      const graphqlRes = await fetch(GITHUB_GRAPHQL, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query {
              repository(owner: "bitcoin", name: "bitcoin") {
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 0) {
                        totalCount
                      }
                    }
                  }
                }
              }
            }
          `,
        }),
        next: { revalidate: 1800 },
      })
      if (graphqlRes.ok) {
        const data = (await graphqlRes.json()) as {
          data?: {
            repository?: {
              defaultBranchRef?: {
                target?: { history?: { totalCount?: number } }
              }
            }
          }
        };
        const count = data?.data?.repository?.defaultBranchRef?.target?.history?.totalCount
        if (typeof count === 'number') defaultBranchCommits = count
      }
    } catch {
      // Non-fatal; we still have other stats
    }

    return {
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      watchers: repo.watchers_count ?? repo.stargazers_count ?? 0,
      openIssues: repo.open_issues_count ?? 0,
      language: repo.language ?? null,
      contributors: contributorsTotal,
      defaultBranchCommits,
      pushedAt: repo.pushed_at ?? null,
      repoUrl: repo.html_url ?? `https://github.com/${GITHUB_REPO}`,
      repoDescription: repo.description ?? null,
    }
  } catch (error) {
    console.error('[news/github] Error fetching GitHub stats:', error)
    return null
  }
}

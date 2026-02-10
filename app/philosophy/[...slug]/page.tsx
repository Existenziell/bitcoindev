import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import DownloadMarkdownButton from '@/app/components/DownloadMarkdownButton'
import { docPages, getBreadcrumbsForPath, sections } from '@/app/utils/navigation'
import { generatePageMetadata, getDocPageStructuredData } from '@/app/utils/metadata'
import mdContent from '@/public/data/md-content.json'

export async function generateStaticParams() {
  return docPages
    .filter((page) => page.path.startsWith('/philosophy/'))
    .map((page) => {
      const slug = page.path.replace(/^\/philosophy\//, '').split('/').filter(Boolean)
      return { slug }
    })
}

interface PageProps {
  params: Promise<{
    slug: string[]
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return { title: 'Page Not Found | BitcoinDev' }
  }

  const path = `/philosophy/${slug.join('/')}`
  const page = docPages.find((p) => p.path === path)
  if (!page) {
    return { title: 'Page Not Found | BitcoinDev' }
  }

  const sectionInfo = sections[page.section]
  const description =
    page.description ??
    (sectionInfo ? sectionInfo.description : `${page.title} - Bitcoin philosophy and context`)

  return generatePageMetadata({
    title: page.title,
    description,
    path,
  })
}

export default async function PhilosophyDocPage({ params }: PageProps) {
  const { slug } = await params
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    notFound()
  }

  const path = `/philosophy/${slug.join('/')}`
  const entry = (mdContent as Record<string, { content: string }>)[path]
  if (!entry?.content) {
    notFound()
  }

  const page = docPages.find((p) => p.path === path)
  const sectionInfo = page ? sections[page.section] : null
  const description = sectionInfo
    ? sectionInfo.description
    : page
      ? `${page.title} - Bitcoin philosophy and context`
      : ''
  const breadcrumbs = getBreadcrumbsForPath(path)
  const docStructuredData = getDocPageStructuredData(
    path,
    page?.title ?? '',
    description,
    breadcrumbs
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: docStructuredData }}
      />
      <div className="relative">
        <div className="absolute top-0 right-0 z-10 hidden md:block">
          <DownloadMarkdownButton />
        </div>
        <MarkdownRenderer content={entry.content} />
        <div className="absolute -bottom-8 right-0 z-10 hidden md:block">
          <DownloadMarkdownButton />
        </div>
      </div>
    </>
  )
}

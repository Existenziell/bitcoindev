'use client'

import React, { useMemo } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { visit } from 'unist-util-visit'
import Link from 'next/link'
import CodeBlock, { MultiLanguageCodeBlock } from '@/app/components/CodeBlock'
import DenominationCalculator from '@/app/components/DenominationCalculator'
import PoolDistributionChart from '@/app/components/PoolDistributionChart'

const MermaidDiagram = dynamic(() => import('@/app/components/MermaidDiagram'), {
  ssr: false,
  loading: () => <div className="mermaid-diagram my-4 min-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 animate-pulse" aria-hidden />,
})
import { ChevronDown } from '@/app/components/Icons'
import ExternalLink from '@/app/components/ExternalLink'
import { generateSlug } from '@/scripts/lib/slug'

interface MarkdownRendererProps {
  content: string
}

interface CodeGroupBlock {
  id: string
  languages: { lang: string; code: string }[]
}

interface VideoGroupItem {
  videoId: string
  title: string
}

interface VideoGroupBlock {
  id: string
  items: VideoGroupItem[]
}

// Parse :::video-group and collect [text](url) as { videoId, title }
function parseVideoGroups(content: string): { processedContent: string; videoGroups: VideoGroupBlock[] } {
  const videoGroups: VideoGroupBlock[] = []
  let groupCounter = 0

  const videoGroupRegex = /:::video-group\s*\n([\s\S]*?)\n:::/g

  const processedContent = content.replace(videoGroupRegex, (match, groupContent) => {
    const groupId = `video-group-${groupCounter++}`
    const items: VideoGroupItem[] = []

    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g
    let linkMatch
    while ((linkMatch = linkRegex.exec(groupContent)) !== null) {
      const text = linkMatch[1].trim()
      const url = linkMatch[2]
      const videoId = getYouTubeVideoId(url)
      if (videoId) {
        items.push({ videoId, title: text })
      }
    }

    if (items.length > 0) {
      videoGroups.push({ id: groupId, items })
      return `<div data-video-group-id="${groupId}"></div>`
    }

    return match
  })

  return { processedContent, videoGroups }
}

function parseMermaidDiagrams(content: string): { processedContent: string; mermaidDiagrams: { id: string; source: string }[] } {
  const mermaidDiagrams: { id: string; source: string }[] = []
  let counter = 0
  const regex = /```mermaid\s*\n([\s\S]*?)```/g
  const processedContent = content.replace(regex, (_, source) => {
    const id = `mermaid-${counter++}`
    mermaidDiagrams.push({ id, source: source.trim() })
    return `<div data-mermaid-id="${id}"></div>`
  })
  return { processedContent, mermaidDiagrams }
}

function parseCodeGroups(content: string): { processedContent: string; codeGroups: CodeGroupBlock[] } {
  const codeGroups: CodeGroupBlock[] = []
  let groupCounter = 0

  const codeGroupRegex = /:::code-group\s*\n([\s\S]*?)\n:::/g

  const processedContent = content.replace(codeGroupRegex, (match, groupContent) => {
    const groupId = `code-group-${groupCounter++}`
    const languages: { lang: string; code: string }[] = []

    const codeBlockRegex = /```(\w+)\s*\n([\s\S]*?)```/g
    let codeMatch

    while ((codeMatch = codeBlockRegex.exec(groupContent)) !== null) {
      const lang = codeMatch[1]
      const code = codeMatch[2].trim()
      languages.push({ lang, code })
    }

    if (languages.length > 0) {
      codeGroups.push({ id: groupId, languages })
      return `<div data-code-group-id="${groupId}"></div>`
    }

    return match
  })

  return { processedContent, codeGroups }
}

function parseDenominationCalculator(content: string): string {
  return content.replace(/:::denomination-calculator\s*\n([\s\S]*?)\n:::/g, '<div data-denomination-calculator="true"></div>')
}

function parsePoolDistribution(content: string): string {
  return content.replace(/:::pool-distribution\s*:::/g, '<div data-pool-distribution="true"></div>')
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children
  }
  if (typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(extractText).join('')
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode }
    if (props && props.children) {
      return extractText(props.children)
    }
  }
  return ''
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

// Collapsed: text link with video name + chevron. Expanded: link row (chevron up) + YouTube iframe. Click to toggle.
function YouTubeEmbed({
  videoId,
  title,
  inGroup,
}: {
  videoId: string
  title?: string
  inGroup?: boolean
}) {
  const [expanded, setExpanded] = React.useState(false)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  React.useEffect(() => {
    if (expanded && iframeRef.current) {
      iframeRef.current.setAttribute('credentialless', '')
    }
  }, [expanded])

  const label = (title && title.trim()) || 'Watch video'

  return (
    <div className={inGroup ? '' : 'my-6'}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="text-btc hover:underline inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0 font-inherit text-left"
      >
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
        {label}
      </button>
      {expanded && (
        <div className="relative w-full rounded-md overflow-hidden mt-2" style={{ paddingBottom: '56.25%' }}>
          <iframe
            ref={iframeRef}
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0`}
            title="YouTube video player"
            loading="lazy"
            allow="accelerometer; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  )
}

// Memoize plugin arrays at module level to prevent recreation
const remarkPlugins = [remarkGfm]

// Mark mermaid code blocks as no-highlight so rehype-highlight skips them (we render as diagrams)
function rehypeMermaidNoHighlight() {
  return (tree: Parameters<typeof visit>[0]) => {
    visit(tree, 'element', (node: { tagName?: string; properties?: { className?: unknown[] } }, _index, parent: { type?: string; tagName?: string } | null) => {
      if (node.tagName !== 'code' || !parent || parent.type !== 'element' || parent.tagName !== 'pre') return
      const classes = node.properties?.className
      if (!Array.isArray(classes)) return
      const hasMermaid = classes.some((c: unknown) => String(c).startsWith('language-') && String(c).slice(9) === 'mermaid')
      if (hasMermaid) {
        node.properties = node.properties || {}
        node.properties.className = [...classes, 'no-highlight']
      }
    })
  }
}

const rehypePlugins = [rehypeRaw, rehypeMermaidNoHighlight, rehypeHighlight]

// any ok: react-markdown internals, we pass props through
const createHeading = (level: number) => {
  const HeadingComponent = ({ children, ...props }: any) => {
    const text = extractText(children)
    const id = generateSlug(text)
    const { node: _node, ...htmlProps } = props

    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements
    return (
      <Tag id={id} {...htmlProps}>
        {children}
      </Tag>
    )
  }
  HeadingComponent.displayName = `Heading${level}`
  return HeadingComponent
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Memoize mermaid/code/video group and denomination calculator parsing (expensive)
  const { processedContent, codeGroupMap, videoGroupMap, mermaidDiagramMap } = useMemo(() => {
    const { processedContent: afterMermaid, mermaidDiagrams } = parseMermaidDiagrams(content)
    const { processedContent: afterCode, codeGroups } = parseCodeGroups(afterMermaid)
    const { processedContent: afterVideo, videoGroups } = parseVideoGroups(afterCode)
    const afterDenomination = parseDenominationCalculator(afterVideo)
    const finalContent = parsePoolDistribution(afterDenomination)
    const codeGroupMap = new Map(codeGroups.map(g => [g.id, g]))
    const videoGroupMap = new Map(videoGroups.map(g => [g.id, g]))
    const mermaidDiagramMap = new Map(mermaidDiagrams.map(d => [d.id, d.source]))
    return { processedContent: finalContent, codeGroupMap, videoGroupMap, mermaidDiagramMap }
  }, [content])

  // Memoize components; any ok for react-markdown pass-through
  const components = useMemo<Components>(() => ({
    div: ({ node: _node, children, ...props }: any) => {
      const mermaidId = props['data-mermaid-id']
      if (mermaidId && mermaidDiagramMap.has(mermaidId)) {
        return <MermaidDiagram source={mermaidDiagramMap.get(mermaidId)!} />
      }
      const codeGroupId = props['data-code-group-id']
      if (codeGroupId && codeGroupMap.has(codeGroupId)) {
        const group = codeGroupMap.get(codeGroupId)!
        return (
          <MultiLanguageCodeBlock
            languages={group.languages.map(({ lang, code }) => ({
              lang,
              code,
              className: `language-${lang}`
            }))}
          />
        )
      }
      const videoGroupId = props['data-video-group-id']
      if (videoGroupId && videoGroupMap.has(videoGroupId)) {
        const group = videoGroupMap.get(videoGroupId)!
        return (
          <div className="my-6 flex flex-col gap-4">
            {group.items.map(({ videoId, title }) => (
              <YouTubeEmbed key={videoId} videoId={videoId} title={title} inGroup />
            ))}
          </div>
        )
      }
      if ('data-denomination-calculator' in props || props['data-denomination-calculator']) {
        return <DenominationCalculator />
      }
      if ('data-pool-distribution' in props || props['data-pool-distribution']) {
        return <PoolDistributionChart />
      }
      return <div {...props}>{children}</div>
    },
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    p: ({ children, ...props }: any) => {
      const childrenArray = React.Children.toArray(children)

      // Check for standalone tx-binary-map.png image
      for (const child of childrenArray) {
        if (React.isValidElement(child)) {
          const childProps = child.props as { src?: string }
          const src = childProps?.src
          
          if (src && src.includes('tx-binary-map.png')) {
            const otherChildren = childrenArray.filter(c => c !== child)
            const otherText = otherChildren.map(extractText).join('').trim()
            
            // Standalone image → wrap in div with background
            if (otherText === '' || childrenArray.length === 1) {
              return (
                <div className="bg-white rounded-lg p-4 my-4">
                  {child}
                </div>
              )
            }
          }
        }
      }

      for (const child of childrenArray) {
        if (React.isValidElement(child)) {
          const childProps = child.props as { 'data-youtube-embed'?: string; 'data-youtube-title'?: string }
          const videoId = childProps?.['data-youtube-embed']
          const title = childProps?.['data-youtube-title']

          if (videoId) {
            const otherChildren = childrenArray.filter(c => c !== child)
            const otherText = otherChildren.map(extractText).join('').trim()

            // Standalone embed → return only embed
            if (otherText === '' || childrenArray.length === 1) {
              return <YouTubeEmbed videoId={videoId} title={title} />
            }
          }
        }
      }

      // Fallback: direct YouTube links in <a>
      for (const child of childrenArray) {
        if (React.isValidElement(child)) {
          const childProps = child.props as { href?: string; children?: React.ReactNode }
          const href = childProps?.href

          if (href && typeof href === 'string' && (href.includes('youtube.com') || href.includes('youtu.be'))) {
            const videoId = getYouTubeVideoId(href)
            if (videoId) {
              const otherChildren = childrenArray.filter(c => c !== child)
              const otherText = otherChildren.map(extractText).join('').trim()

              if (otherText === '' || childrenArray.length === 1) {
                const title = extractText(childProps?.children)
                return <YouTubeEmbed videoId={videoId} title={title} />
              }
            }
          }
        }
      }

      return <p {...props}>{children}</p>
    },
    a: ({ href, children, ...props }: any) => {
      if (href && typeof href === 'string' && (href.includes('youtube.com') || href.includes('youtu.be'))) {
        const videoId = getYouTubeVideoId(href)
        if (videoId) {
          const title = extractText(children)
          return (
            <span data-youtube-embed={videoId} data-youtube-title={title} style={{ display: 'block' }}>
              <YouTubeEmbed videoId={videoId} title={title} />
            </span>
          )
        }
      }
      if (href?.startsWith('/')) {
        return (
          <Link href={href} {...props}>
            {children}
          </Link>
        )
      }
      if (href?.startsWith('#')) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        )
      }
      return (
        <ExternalLink href={href} className={props.className}>
          {children}
        </ExternalLink>
      )
    },
    code: ({ inline, className, children, ...props }: any) => {
      if (inline) {
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        )
      }
      // Block: pass through; pre wraps
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }: any) => {
      // react-markdown puts code inside pre
      const codeElement = React.Children.toArray(children)[0]

      if (React.isValidElement(codeElement) && codeElement.type === 'code') {
        const className = (codeElement.props as { className?: string })?.className || ''
        const match = /language-(\w+)/.exec(className)
        const language = match ? match[1] : ''
        const codeChildren = (codeElement.props as { children?: React.ReactNode })?.children
        const raw = codeChildren != null ? (typeof codeChildren === 'string' ? codeChildren : extractText(codeChildren)) : ''
        const source = typeof raw === 'string' ? raw : ''
        const looksLikeMermaid = /^\s*(flowchart|sequenceDiagram|graph|stateDiagram|classDiagram|erDiagram|journey|gantt|pie|requirement)/m.test(source)

        if (language === 'mermaid' || looksLikeMermaid) {
          return <MermaidDiagram source={source} />
        }

        // CodeBlock to avoid pre-in-p
        return (
          <CodeBlock language={language} className={className} rawCode={source} {...props}>
            {codeChildren}
          </CodeBlock>
        )
      }

      return (
        <pre className="code-block-pre rounded-lg mb-4" {...props}>
          {children}
        </pre>
      )
    },
    img: ({ src, alt, ...props }: any) => (
      // Markdown images: src/alt are dynamic; next/image requires known dimensions or unoptimized
      // eslint-disable-next-line @next/next/no-img-element -- dynamic markdown content
      <img src={src} alt={alt} className="max-w-full h-auto my-4" {...props} />
    ),
  }), [codeGroupMap, videoGroupMap, mermaidDiagramMap])

  return (
    <div className="markdown-content prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

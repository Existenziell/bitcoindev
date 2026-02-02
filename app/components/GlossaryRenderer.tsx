'use client'

import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Link from 'next/link'
import { ChevronRight, ExternalLinkIcon } from '@/app/components/Icons'
import { docPages } from '@/app/utils/navigation'

export interface GlossaryEntry {
  term: string
  slug: string
  definition: string
  relatedArticle?: string
}

export interface GlossarySection {
  letter: string
  slug: string
  entries: GlossaryEntry[]
}

interface GlossaryRendererProps {
  sections: GlossarySection[]
}

// Inline-only markdown for definitions
function DefinitionRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        p: ({ children }) => <p className="mb-4 leading-7 last:mb-0">{children}</p>,
        a: ({ href, children }) => {
          if (href?.startsWith('/')) {
            return <Link href={href} className="text-btc hover:underline">{children}</Link>
          }
          if (href?.startsWith('#')) {
            return <a href={href} className="text-btc hover:underline">{children}</a>
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="external group inline-flex items-center text-btc hover:underline"
            >
              {children}
              <span className="inline-block w-0 group-hover:w-3 overflow-hidden transition-all duration-200 ml-0.5">
                <ExternalLinkIcon className="opacity-0 group-hover:opacity-70 transition-opacity duration-200" />
              </span>
            </a>
          )
        },
        code: ({ children }) => (
          <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-btc">
            {children}
          </code>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default function GlossaryRenderer({ sections }: GlossaryRendererProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        setActiveSlug(hash)

        // Brief delay for details to expand
        setTimeout(() => {
          const element = document.getElementById(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        setActiveSlug(null)
      }
    }

    handleHash()
    // hashchange + popstate for back/forward
    window.addEventListener('hashchange', handleHash)
    window.addEventListener('popstate', handleHash)
    
    return () => {
      window.removeEventListener('hashchange', handleHash)
      window.removeEventListener('popstate', handleHash)
    }
  }, [])

  const handleTermClick = (slug: string, isOpen: boolean) => {
    if (isOpen) {
      // replaceState to avoid extra history (double-back)
      const currentHash = window.location.hash.slice(1)
      if (currentHash !== slug) {
        window.history.replaceState(null, '', `#${slug}`)
      }
      setActiveSlug(slug)
    } else {
      if (activeSlug === slug) {
        window.history.replaceState(null, '', window.location.pathname)
        setActiveSlug(null)
      }
    }
  }

  const handleLetterClick = (sectionSlug: string, e: React.MouseEvent) => {
    e.preventDefault()
    const element = document.getElementById(sectionSlug)
    if (element) {
      window.history.replaceState(null, '', `#${sectionSlug}`)
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const hash = window.location.hash.slice(1)
      setActiveSlug(hash)
    }
  }

  return (
    <div className="glossary-accordion glossary-content">
      {/* Letter navigation */}
      <div className="mb-8 pb-4 border-b border-gray-300 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {sections.map((section) => (
            <a
              key={section.slug}
              href={`#${section.slug}`}
              onClick={(e) => handleLetterClick(section.slug, e)}
              className="text-btc hover:text-btc-dark dark:hover:text-btc-light hover:underline font-medium transition-colors"
            >
              {section.letter}
            </a>
          ))}
        </div>
      </div>
      {sections.map((section) => (
        <div key={section.slug} className="mb-8">
          {/* Section letter header */}
          <h2 id={section.slug}>
            {section.letter}
          </h2>

          {/* Entries as collapsible details elements */}
          <div className="space-y-2">
            {section.entries.map((entry) => (
              <details
                key={entry.slug}
                id={entry.slug}
                className="glossary-entry group"
                open={activeSlug === entry.slug}
                onToggle={(e) => {
                  const details = e.currentTarget as HTMLDetailsElement
                  handleTermClick(entry.slug, details.open)
                }}
              >
                <summary className="glossary-summary">
                  {/* Chevron icon */}
                  <ChevronRight className="w-4 h-4 text-secondary transition-transform duration-200 group-open:rotate-90 flex-shrink-0" />
                  <h3 className="">
                    {entry.term}
                  </h3>
                </summary>

                <div className="glossary-definition px-4 py-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700 mt-2 text-gray-800 dark:text-gray-200">
                  <DefinitionRenderer content={entry.definition} />
                  {entry.relatedArticle && (
                    <p className="mt-3 text-sm">
                      <Link
                        href={entry.relatedArticle}
                        className="text-btc hover:underline inline-flex items-center gap-1"
                      >
                        {docPages.find((p) => p.path === entry.relatedArticle)?.title ?? 'Related article'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

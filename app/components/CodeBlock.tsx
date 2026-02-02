'use client'

import { useState, useEffect, memo } from 'react'
import type { ReactNode } from 'react'
import { languageNames } from '@/app/utils/languageNames'
import type { HLJSApi } from 'highlight.js'
import copyToClipboard from '@/app/utils/copyToClipboard'
import { CopyIcon } from '@/app/components/Icons'

// Escape HTML for fallback rendering
const escapeHtml = (code: string) =>
  code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// Dynamic import for highlight.js - only needed for MultiLanguageCodeBlock (client-side)
let hljsInstance: HLJSApi | null = null
let hljsPromise: Promise<HLJSApi> | null = null

const getHljs = (): Promise<HLJSApi> => {
  if (hljsInstance) return Promise.resolve(hljsInstance)
  if (hljsPromise) return hljsPromise

  hljsPromise = (async () => {
    const hljsModule = await import('highlight.js/lib/core')
    const hljs = hljsModule.default
    // Register only common languages to reduce bundle size
    const [javascript, typescript, python, rust, go, bash, json, sql, cpp] = await Promise.all([
      import('highlight.js/lib/languages/javascript'),
      import('highlight.js/lib/languages/typescript'),
      import('highlight.js/lib/languages/python'),
      import('highlight.js/lib/languages/rust'),
      import('highlight.js/lib/languages/go'),
      import('highlight.js/lib/languages/bash'),
      import('highlight.js/lib/languages/json'),
      import('highlight.js/lib/languages/sql'),
      import('highlight.js/lib/languages/cpp'),
    ])
    hljs.registerLanguage('javascript', javascript.default)
    hljs.registerLanguage('js', javascript.default)
    hljs.registerLanguage('typescript', typescript.default)
    hljs.registerLanguage('ts', typescript.default)
    hljs.registerLanguage('python', python.default)
    hljs.registerLanguage('rust', rust.default)
    hljs.registerLanguage('go', go.default)
    hljs.registerLanguage('bash', bash.default)
    hljs.registerLanguage('shell', bash.default)
    hljs.registerLanguage('json', json.default)
    hljs.registerLanguage('sql', sql.default)
    hljs.registerLanguage('cpp', cpp.default)
    hljs.registerLanguage('c++', cpp.default)
    hljsInstance = hljs
    return hljs
  })()

  return hljsPromise
}

interface CodeBlockProps {
  language: string
  children: ReactNode
  className?: string
  rawCode?: string
  [key: string]: any
}

function CodeBlock({ language, children, className, rawCode, ...props }: CodeBlockProps) {
  const displayName = languageNames[language] || (language.charAt(0).toUpperCase() + language.slice(1).toLowerCase())

  // Syntax highlighting is done at BUILD TIME via rehype-highlight
  // This component just provides the wrapper and language label
  return (
    <div className="code-block-wrapper my-4">
      <div className="code-block-header flex items-center justify-between" role="group" aria-label={`Code block: ${displayName}`}>
        <span className="text-xs font-mono text-secondary tracking-wider">
          {displayName}
        </span>
        {rawCode != null && (
          <button
            type="button"
            onClick={() => copyToClipboard(rawCode, 'Code')}
            className="p-1.5 rounded text-secondary hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Copy code"
            title="Copy code"
          >
            <CopyIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      <pre className="hljs bg-gray-100 dark:bg-gray-900 rounded-b-lg p-4 overflow-x-auto border border-gray-300 dark:border-gray-700 border-t-0" role="code" aria-label={`${displayName} code`}>
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

export default memo(CodeBlock)

interface MultiLanguageCodeBlockProps {
  languages: { lang: string; code: string; className?: string }[]
}

export function MultiLanguageCodeBlock({ languages }: MultiLanguageCodeBlockProps) {
  const [selectedLang, setSelectedLang] = useState(languages[0]?.lang || 'python')
  const [highlightedLanguages, setHighlightedLanguages] = useState<
    { lang: string; highlighted: string; className?: string }[]
  >([])

  // Load highlight.js and process code asynchronously
  useEffect(() => {
    let cancelled = false

    const highlightCode = async () => {
      const hljs = await getHljs()
      if (cancelled) return

      const results = languages.map(({ lang, code, className }) => {
        let highlighted: string
        try {
          const result = hljs.highlight(code, { language: lang, ignoreIllegals: true })
          highlighted = result.value
        } catch {
          try {
            const result = hljs.highlightAuto(code)
            highlighted = result.value
          } catch {
            highlighted = escapeHtml(code)
          }
        }
        return { lang, highlighted, className }
      })

      if (!cancelled) {
        setHighlightedLanguages(results)
      }
    }

    // Show escaped code immediately, then highlight
    queueMicrotask(() => {
      setHighlightedLanguages(
        languages.map(({ lang, code, className }) => ({
          lang,
          highlighted: escapeHtml(code),
          className,
        }))
      )
    })

    highlightCode()

    return () => {
      cancelled = true
    }
  }, [languages])

  const selectedCode = highlightedLanguages.find(l => l.lang === selectedLang)

  if (languages.length === 0) return null

  return (
    <div className="multi-language-code-block my-4">
      <div className="code-block-header flex items-center justify-between">
        <div className="flex gap-2" role="tablist" aria-label="Programming language selector">
          {languages.map(({ lang }) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              role="tab"
              aria-selected={selectedLang === lang}
              aria-controls={`code-block-${lang}`}
              className={`px-3 py-1 text-xs font-mono tracking-wider rounded transition-colors ${
                selectedLang === lang
                  ? 'bg-btc text-gray-900 font-semibold'
                  : 'text-secondary hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {languageNames[lang] || (lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase())}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const code = languages.find(l => l.lang === selectedLang)?.code ?? ''
            const label = `${languageNames[selectedLang] || selectedLang} code`
            copyToClipboard(code, label)
          }}
          className="p-1.5 rounded text-secondary hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Copy code"
          title="Copy code"
        >
          <CopyIcon className="w-4 h-4" />
        </button>
      </div>
      <pre
        className="hljs bg-gray-100 dark:bg-gray-900 rounded-b-lg p-4 overflow-x-auto border border-gray-300 dark:border-gray-700 border-t-0"
        role="code"
        aria-label={`${languageNames[selectedLang] || selectedLang} code`}
        id={`code-block-${selectedLang}`}
        tabIndex={0}
      >
        <code
          className={`language-${selectedLang} ${selectedCode?.className || ''}`}
          dangerouslySetInnerHTML={{ __html: selectedCode?.highlighted || '' }}
        />
      </pre>
    </div>
  )
}

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface MermaidDiagramProps {
  source: string
}

const LIGHT_THEME = {
  background: '#f9fafb',
  primaryColor: '#ffffff',
  primaryTextColor: '#111827',
  primaryBorderColor: '#e5e7eb',
  lineColor: '#4b5563',
  fontFamily: '"Ubuntu", "sans-serif"',
  fontSize: '16px',
}

const DARK_THEME = {
  background: '#111827',
  primaryColor: '#1f2937',
  primaryTextColor: '#e5e7eb',
  primaryBorderColor: '#374151',
  lineColor: '#9ca3af',
  fontFamily: '"Ubuntu", "sans-serif"',
  fontSize: '16px',
}

export default function MermaidDiagram({ source }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (!containerRef.current || !source.trim()) return

    let cancelled = false
    setError(null)
    const theme = isDark ? DARK_THEME : LIGHT_THEME

    async function renderDiagram() {
      const { default: mermaid } = await import('mermaid')
      mermaid.initialize({
        theme: 'base',
        flowchart: {
          padding: 24,
          diagramPadding: 16,
        },
        themeVariables: {
          background: theme.background,
          primaryColor: theme.primaryColor,
          primaryTextColor: theme.primaryTextColor,
          primaryBorderColor: theme.primaryBorderColor,
          lineColor: theme.lineColor,
          fontFamily: theme.fontFamily,
          fontSize: theme.fontSize,
          pieTitleTextSize: '16px',
          pieSectionTextSize: '16px',
          pieLegendTextSize: '16px',
        },
        themeCSS: [
          `.nodeLabel, .edgeLabel, .cluster-label, .label, .label span { font-family: ${theme.fontFamily} !important; font-size: ${theme.fontSize} !important; line-height: 1.15 !important; }`,
          `text { font-family: ${theme.fontFamily} !important; font-size: ${theme.fontSize} !important; }`,
          `.actor, .messageText, .labelText, .loopText, .section0, .section1, .section2, .pieCircle { font-family: ${theme.fontFamily} !important; font-size: ${theme.fontSize} !important; }`,
        ].join(' '),
      })
      const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`
      try {
        const { svg, bindFunctions } = await mermaid.render(id, source)
        if (cancelled || !containerRef.current) return
        containerRef.current.innerHTML = svg
        const svgEl = containerRef.current.querySelector('svg')
        if (svgEl && bindFunctions) bindFunctions(containerRef.current)
        /* Force fixed font size: strip inline/attr font-size so it never scales with box; CSS sets 16px. */
        const root = containerRef.current
        const stripFontSize = (el: Element) => {
          const html = el as HTMLElement
          if (html.style?.fontSize) html.style.removeProperty('font-size')
          const attr = el.getAttribute('style')
          if (attr?.includes('font-size')) {
            const filtered = attr
              .split(';')
              .map((s) => s.trim())
              .filter((decl) => !decl.toLowerCase().startsWith('font-size'))
              .join('; ')
            el.setAttribute('style', filtered ? `${filtered}; ` : '')
          }
          if (el.hasAttribute('font-size')) el.removeAttribute('font-size')
        }
        root.querySelectorAll('.nodeLabel, .edgeLabel, .label, .cluster-label, [class*="label"], foreignObject *, text').forEach(stripFontSize)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      }
    }

    renderDiagram()
    return () => {
      cancelled = true
    }
  }, [source, isDark])

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
        Mermaid error: {error}
      </div>
    )
  }

  return (
    <div className="mermaid-diagram my-4 flex justify-center overflow-visible min-w-0" ref={containerRef} />
  )
}

'use client'

import {
  DocumentIcon,
  BookOpenIcon,
  UserIcon,
  TerminalIcon,
  StackLabIcon,
  BlockVisualizerIcon,
  HashIcon,
  CalculatorIcon,
} from '@/app/components/Icons'

type IconComponentProps = { className?: string }

const TOOL_PATHS = new Set([
  '/terminal',
  '/stack-lab',
  '/block-visualizer',
  '/tools/hash',
  '/docs/fundamentals/denominations',
])

const TOOL_ICON_BY_PATH: Record<string, React.ComponentType<IconComponentProps>> = {
  '/terminal': TerminalIcon,
  '/stack-lab': StackLabIcon,
  '/block-visualizer': BlockVisualizerIcon,
  '/tools/hash': HashIcon,
  '/docs/fundamentals/denominations': CalculatorIcon,
}

export function isTool(path: string): boolean {
  return TOOL_PATHS.has(path)
}

export function getSearchResultIcon(path: string): React.ComponentType<IconComponentProps> {
  if (path.startsWith('/docs/history/people#')) return UserIcon
  const toolIcon = TOOL_ICON_BY_PATH[path]
  if (toolIcon) return toolIcon
  return DocumentIcon
}

export function getSearchResultSectionLabel(
  path: string,
  section: string,
  sectionTitle: (id: string) => string
): string {
  if (path.startsWith('/docs/history/people#')) return 'People'
  if (isTool(path)) return 'Tool'
  return sectionTitle(section)
}

interface SearchResultIconProps extends IconComponentProps {
  path: string
}

/**
 * Renders the appropriate icon for a search result (people, tool, or document).
 * Use in SearchModal and DocsSearch for consistent result icons.
 */
export function SearchResultIcon({ path, className, ...props }: SearchResultIconProps) {
  if (path.startsWith('/docs/history/people#')) return <UserIcon className={className} {...props} />
  if (path === '/terminal') return <TerminalIcon className={className} {...props} />
  if (path === '/stack-lab') return <StackLabIcon className={className} {...props} />
  if (path === '/block-visualizer') return <BlockVisualizerIcon className={className} {...props} />
  if (path === '/tools/hash') return <HashIcon className={className} {...props} />
  if (path === '/docs/fundamentals/denominations') return <CalculatorIcon className={className} {...props} />
  return <BookOpenIcon className={className} {...props} />
}

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
  AddressDecoderIcon,
  TransactionDecoderIcon,
  FeeEstimatorIcon,
} from '@/app/components/Icons'

type IconComponentProps = { className?: string }

const TOOL_PATHS = new Set([
  '/interactive-tools/terminal',
  '/interactive-tools/stack-lab',
  '/interactive-tools/block-visualizer',
  '/interactive-tools/hash',
  '/interactive-tools/address-decoder',
  '/interactive-tools/transaction-decoder',
  '/interactive-tools/fee-estimator',
  '/interactive-tools/denominations-calculator',
  '/docs/fundamentals/denominations',
])

const TOOL_ICON_BY_PATH: Record<string, React.ComponentType<IconComponentProps>> = {
  '/interactive-tools/terminal': TerminalIcon,
  '/interactive-tools/stack-lab': StackLabIcon,
  '/interactive-tools/block-visualizer': BlockVisualizerIcon,
  '/interactive-tools/hash': HashIcon,
  '/interactive-tools/address-decoder': AddressDecoderIcon,
  '/interactive-tools/transaction-decoder': TransactionDecoderIcon,
  '/interactive-tools/fee-estimator': FeeEstimatorIcon,
  '/interactive-tools/denominations-calculator': CalculatorIcon,
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
  if (path === '/interactive-tools/terminal') return <TerminalIcon className={className} {...props} />
  if (path === '/interactive-tools/stack-lab') return <StackLabIcon className={className} {...props} />
  if (path === '/interactive-tools/block-visualizer') return <BlockVisualizerIcon className={className} {...props} />
  if (path === '/interactive-tools/hash') return <HashIcon className={className} {...props} />
  if (path === '/interactive-tools/address-decoder') return <AddressDecoderIcon className={className} {...props} />
  if (path === '/interactive-tools/transaction-decoder') return <TransactionDecoderIcon className={className} {...props} />
  if (path === '/interactive-tools/fee-estimator') return <FeeEstimatorIcon className={className} {...props} />
  if (path === '/interactive-tools/denominations-calculator') return <CalculatorIcon className={className} {...props} />
  if (path === '/docs/fundamentals/denominations') return <CalculatorIcon className={className} {...props} />
  return <BookOpenIcon className={className} {...props} />
}

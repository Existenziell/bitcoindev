import { createToolLayout } from '@/app/utils/toolLayout'

const { metadata: toolMetadata, ToolLayout } = createToolLayout({
  title: 'Hash Tool',
  description: 'Compute SHA-256, HASH256, and HASH160. Used in Bitcoin for block hashes, TXIDs, addresses, and script.',
  path: 'hash',
})

export const metadata = toolMetadata
export default ToolLayout

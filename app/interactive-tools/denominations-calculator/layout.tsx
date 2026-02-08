import { createToolLayout } from '@/app/utils/toolLayout'

const { metadata: toolMetadata, ToolLayout } = createToolLayout({
  title: 'Denominations Calculator',
  description:
    'Convert between Bitcoin units: satoshis (sats), BTC, bits (µBTC), millibits (mBTC), and more. Interactive calculator with live conversion.',
  path: 'denominations-calculator',
})

export const metadata = toolMetadata
export default ToolLayout

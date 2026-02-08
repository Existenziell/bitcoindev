import { createToolLayout } from '@/app/utils/toolLayout'

const { metadata: toolMetadata, ToolLayout } = createToolLayout({
  title: 'Fee Estimator',
  description:
    'Estimate Bitcoin transaction fee from size (vBytes) and current network rate. See fee in sats and USD for 1-block and 6-block targets.',
  path: 'fee-estimator',
})

export const metadata = toolMetadata
export default ToolLayout

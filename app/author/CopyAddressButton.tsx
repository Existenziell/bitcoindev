'use client'

import { CopyIcon } from '@/app/components/Icons'
import copyToClipboard from '@/app/utils/copyToClipboard'

interface CopyAddressButtonProps {
  text: string
  label: string
  customSuccessMessage?: string
  ariaLabel: string
}

export default function CopyAddressButton({
  text,
  label,
  customSuccessMessage,
  ariaLabel,
}: CopyAddressButtonProps) {
  const handleCopy = () => {
    copyToClipboard(text, label, customSuccessMessage)
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center p-2 rounded-md bg-btc hover:bg-btc/90 text-gray-900 transition-colors shrink-0"
      aria-label={ariaLabel}
    >
      <CopyIcon />
    </button>
  )
}

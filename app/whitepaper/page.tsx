import Image from 'next/image'
import Link from 'next/link'
import { DownloadPDFIcon } from '@/app/components/Icons'
import ExternalLink from '@/app/components/ExternalLink'

export default function WhitepaperPage() {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="heading-page text-center">
          Bitcoin Whitepaper
        </h1>
          <p className="text-center text-sm text-secondary max-w-lg mx-auto leading-relaxed">
            Satoshi Nakamoto announced the whitepaper on the{' '}
            <ExternalLink href="https://www.metzdowd.com/pipermail/cryptography/2008-October/014810.html" className="link">
              cryptography mailing list
            </ExternalLink>
            {' '}on October 31, 2008.
            The Bitcoin network launched on January 3, 2009, when Satoshi mined the{' '}
            <Link href="/docs/history/genesis-block" className="link">
              Genesis Block
            </Link>.
          </p>
      </div>

        <div className="flex flex-col items-center mb-6">
        <a
          href="/data/bitcoin.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center"
        >
          <DownloadPDFIcon />
          Open PDF
        </a>
      </div>

      <div className="relative aspect-[3/4] w-full max-w-xl mx-auto mb-8 rounded-md overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <Image
          src="/images/whitepaper.jpg"
          alt="Bitcoin Whitepaper Cover"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      </div>
    </div>
  )
}

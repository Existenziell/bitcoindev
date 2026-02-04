import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import QuoteRotator from '@/app/components/QuoteRotator'
import LiveStats from '@/app/components/LiveStats'
import HorizontalNav from '@/app/components/HorizontalNav'
import BitcoinHistoryBanner from '@/app/components/BitcoinHistoryBanner'
import { BookOpenIcon, ToolsIcon } from '@/app/components/Icons'
import { ctaLinks } from '@/app/utils/navigation'
import { generatePageMetadata } from '@/app/utils/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Bitcoin Development & Developer Guide | BitcoinDev',
  description:
    'Bitcoin development guide for developers. Open source documentation, CLI terminal, Stack Lab, Block Visualizer. No ads. Always free.',
  path: '/',
})

// Map icons to CTA links by href
const ctaIcons: Record<string, React.ReactNode> = {
  '/docs/fundamentals':  <BookOpenIcon />,
  '/interactive-tools': <ToolsIcon />,
}

export default function Home() {
  return (
    <main className="flex-1 page-bg flex flex-col">
      <div className="flex-grow">
        <div className="bg-gray-100 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
          <div className="container-content py-8 md:py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <QuoteRotator />
              </div>
              <div className="order-1 md:order-2 relative aspect-video overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                <Image
                  src="/images/hope.jpg"
                  alt="Bitcoin inspiration"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container-content py-8 md:py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="heading-page mb-1">
              A Developer&apos;s Guide to Bitcoin
            </h1>
            <p className="text-secondary mb-6">
              Open source and always free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              {ctaLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${index === 0 ? 'btn-primary' : 'btn-secondary'} min-w-[200px]`}
                >
                  {link.title}
                  {ctaIcons[link.href]}
                </Link>
              ))}
            </div>
            <div className="text-left max-w-2xl mx-auto space-y-4 text-secondary leading-relaxed mb-4">
              <p>
                BitcoinDev is a Bitcoin resource for anyone who wants to learn about Bitcoin, developers, beginners, and curious non-devs alike.
                I want to share my enthusiasm for Bitcoin and my own experience wandering down the rabbit hole (and the &quot;aha&quot; moments along the way) so more people can get up to speed with less friction.
              </p>
              <p>
                I created BitcoinDev to offer free and open source documentation that goes from Bitcoin 
                fundamentals to advanced protocol details.
                The site includes interactive tools you can use in the browser: a CLI terminal for Bitcoin RPC commands, Stack Lab for Bitcoin Script, 
                a block visualizer, and utilities for hashes, addresses, and transactions.
              </p>
              <p>
                All content is open source, free, and will always remain so. No ads, no paywalls, no tracking. Just pure Bitcoin knowledge for anyone who wants to learn and build on Bitcoin.
              </p>
            </div>
          </div>
        </div>

        <BitcoinHistoryBanner />

        <HorizontalNav />

        <LiveStats />
      </div>

      <Footer />
    </main>
  )
}

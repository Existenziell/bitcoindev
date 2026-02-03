import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/app/components/Footer'
import QuoteRotator from '@/app/components/QuoteRotator'
import LiveStats from '@/app/components/LiveStats'
import HorizontalNav from '@/app/components/HorizontalNav'
import BitcoinHistoryBanner from '@/app/components/BitcoinHistoryBanner'
import { ChevronRight, TerminalIcon, StackLabIcon } from '@/app/components/Icons'
import { ctaLinks } from '@/app/utils/navigation'

// Map icons to CTA links by href
const ctaIcons: Record<string, React.ReactNode> = {
  '/docs/fundamentals': <ChevronRight />,
  '/interactive-tools/terminal': <TerminalIcon />,
  '/interactive-tools/stack-lab': <StackLabIcon />,
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

        {/* Start Learning CTA */}
        <div className="container-content py-8 md:py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="heading-page mb-1">
              A Developer&apos;s Guide to Bitcoin
            </h2>
            <p className="text-secondary mb-6">
              Open source and always free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {ctaLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={index === 0 ? 'btn-primary' : 'btn-secondary'}
                >
                  {link.title}
                  {ctaIcons[link.href]}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bitcoin History Banner */}
        <BitcoinHistoryBanner />

        {/* Horizontal Navigation */}
        <HorizontalNav />

        {/* Live Stats */}
        <LiveStats />
      </div>

      <Footer />
    </main>
  )
}

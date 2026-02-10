import Link from 'next/link'
import Footer from '@/app/components/Footer'
import { ChevronRight, HomeIcon } from '@/app/components/Icons'

export const metadata = {
  title: '404 - Block Not Found | BitcoinDev',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <main className="flex-1 page-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <span className="text-8xl md:text-9xl font-bold text-accent">4</span>
            <span className="text-8xl md:text-9xl font-bold text-gray-300 dark:text-gray-700">0</span>
            <span className="text-8xl md:text-9xl font-bold text-accent">4</span>
          </div>

          <h1 className="heading-page">
            Block Not Found
          </h1>
          <p className="text-secondary mb-8">
            This page doesn&apos;t exist on the blockchain. Perhaps it was orphaned, or maybe it never existed in the first place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="btn-primary"
            >
              <HomeIcon />
              <span>Back to Genesis</span>
            </Link>
            <Link
              href="/philosophy/fundamentals"
              className="btn-secondary"
            >
              Start Learning
              <ChevronRight />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

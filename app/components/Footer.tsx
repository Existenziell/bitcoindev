'use client'

import Link from 'next/link'
import { footerLinksExplore, footerLinksExternal } from '@/app/utils/navigation'
import ExternalLink from '@/app/components/ExternalLink'

export default function Footer() {
  return (
    <footer className='border-t border-gray-200 dark:border-gray-700 bg-gray-100/80 dark:bg-gray-800/50 overflow-hidden mt-8'>
      <div className='container-content pt-8 pb-4'>
        <div className='grid grid-cols-[1fr_auto_1fr] md:flex md:flex-row md:items-start gap-8 mb-8 relative'>
          <nav aria-label='External resources' className='w-full md:flex-1'>
            <h2 className="heading-section-sm mb-3 text-center">
              More Resources
            </h2>
            <ul className='flex flex-col md:flex-row md:flex-wrap md:justify-center md:gap-x-6 gap-y-1'>
              {footerLinksExternal.map((resource) => (
                <li key={resource.name} className='text-center'>
                  <ExternalLink
                    href={resource.url}
                    className='text-sm text-secondary hover:text-accent transition-colors no-underline hover:underline'
                  >
                    {resource.name}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className='w-px bg-gray-200 dark:bg-gray-700 self-stretch' aria-hidden='true' />
          <nav aria-label='Site navigation' className='w-full md:flex-1'>
            <h2 className="heading-section-sm mb-3 text-center">
              Explore BitcoinDev
            </h2>
            <ul className='flex flex-col md:flex-row md:flex-wrap md:justify-center md:gap-x-6 gap-y-1'>
              {footerLinksExplore.map((link) => (
                <li key={link.href} className='text-center'>
                  <Link
                    href={link.href}
                    className='text-sm text-secondary hover:text-accent transition-colors no-underline hover:underline'
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='footer-bar'>
          <Link
            href='/about'
            className='hover:text-accent transition-colors no-underline hover:underline'
          >
            Made with <span className='text-accent' aria-hidden='true'>&#9829;</span> by Chris
          </Link>
          <span aria-hidden='true' className='hidden md:inline'>|</span>
          <span>Open source · No ads · <Link href="/privacy" className="hover:text-accent transition-colors no-underline hover:underline">No tracking</Link></span>
          <span aria-hidden='true' className='hidden md:inline'>|</span>
          <span>© {new Date().getFullYear()} BitcoinDev</span>
        </div>
      </div>
    </footer>
  )
}

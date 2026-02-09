'use client'

import Link from 'next/link'
import Image from 'next/image'
import { footerLinksExplore, footerLinksExternal } from '@/app/utils/navigation'
import ExternalLink from '@/app/components/ExternalLink'

export default function Footer() {
  return (
    <footer className='border-separator bg-gray-100/80 dark:bg-gray-800/50 overflow-hidden mt-8'>
      <div className='container-content pt-10 md:pt-12 pb-4'>
        <div className='flex flex-col md:grid md:grid-cols-[1fr_1px_auto_1px_1fr] md:items-start gap-8 mb-8'>
          <nav aria-label='Site navigation' className='w-full md:flex-1 text-center md:text-right'>
            <h2 className='heading-section-sm mb-3'>
              BitcoinDev Docs
            </h2>
            <ul className='flex flex-col gap-y-1'>
              {footerLinksExplore
                .filter((link) => !['/about', '/privacy', '/feedback'].includes(link.href))
                .map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className='text-sm link-muted'
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </nav>
          <div
            className='hidden md:block w-px bg-gray-200 dark:bg-gray-700 self-stretch min-h-[1px]'
            aria-hidden='true'
          />
          <div className='flex flex-col items-center gap-3 flex-shrink-0 md:justify-self-center'>
            <Link
              href='/'
              className='footer-logo-link block'
              aria-label='BitcoinDev Home'
            >
              <span className='relative w-24 h-24 block'>
                <Image
                  src='/icons/logo/logo.png'
                  alt='BitcoinDev Logo'
                  fill
                  sizes='96px'
                  className='opacity-75 dark:invert hover:opacity-100 transition-opacity duration-200 object-contain'
                />
              </span>
            </Link>
            <nav aria-label='Site info' className='flex flex-col gap-y-1 text-center'>
              <Link href='/about' className='text-sm link-muted'>About</Link>
              <Link href='/privacy' className='text-sm link-muted'>Privacy Policy</Link>
              <Link href='/feedback' className='text-sm link-muted'>Feedback</Link>
            </nav>
          </div>
          <div
            className='hidden md:block w-px bg-gray-200 dark:bg-gray-700 self-stretch min-h-[1px]'
            aria-hidden='true'
          />
          <nav aria-label='External resources' className='w-full md:flex-1 text-center md:text-left'>
            <h2 className='heading-section-sm mb-3'>
              More Resources
            </h2>
            <ul className='flex flex-col gap-y-1 pl-3.5 md:pl-0'>
              {footerLinksExternal.map((resource) => (
                <li key={resource.name}>
                  <ExternalLink
                    href={resource.url}
                    className='text-sm link-muted'
                  >
                    {resource.name}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='footer-bar'>
          <Link
            href='/about'
            className='link-muted'
          >
            Made with <span className='text-accent' aria-hidden='true'>&#9829;</span> by Chris
          </Link>
          <span aria-hidden='true' className='hidden md:inline'>|</span>
          <span>Open source · No ads · <Link href="/privacy" className="link-muted">No tracking</Link></span>
          <span aria-hidden='true' className='hidden md:inline'>|</span>
          <span>© {new Date().getFullYear()} BitcoinDev</span>
        </div>
      </div>
    </footer>
  )
}

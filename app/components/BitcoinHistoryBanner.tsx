'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTodayBitcoinEvent } from '@/app/utils/bitcoinHistoryDates'
import { ChevronRight } from '@/app/components/Icons'

export default function BitcoinHistoryBanner() {
  const [event, setEvent] = useState<ReturnType<typeof getTodayBitcoinEvent>>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Client-only: check date after mount to avoid hydration mismatches
    const todayEvent = getTodayBitcoinEvent()
    queueMicrotask(() => {
      setIsMounted(true)
      setEvent(todayEvent)
      if (todayEvent) {
        setTimeout(() => setIsVisible(true), 100)
      }
    })
  }, [])

  // Don't render anything until mounted (client-side only)
  if (!isMounted || !event) {
    return null
  }

  return (
    <div className="w-full py-6 mb-8">
      <div 
        className={`w-full bg-white dark:bg-gray-800 border-y-2 border-accent/50 dark:border-accent/60 py-6 md:py-8 shadow-lg transition-opacity duration-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="container-content">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-shrink-0" aria-hidden="true">
              <Image
                src="/icons/bitcoin.png"
                alt="Bitcoin"
                width={64}
                height={64}
                className="w-12 h-12 md:w-16 md:h-16"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-bold text-accent mb-2">
                Happy {event.eventName}!
              </h3>
              <p className="text-base md:text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
                {event.time 
                  ? `Exactly ${event.time} today, ${event.message}`
                  : `Exactly today, ${event.message}`
                }
              </p>
              {event.link && (
                <Link
                  href={event.link}
                  className="inline-flex items-center gap-1 text-accent hover:text-accent/80 font-medium transition-colors text-sm md:text-base"
                >
                  Learn more
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

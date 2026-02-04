'use client'

import { useEffect, useState } from 'react'

interface NotificationState {
  show: boolean
  text: string
  isError: boolean
  raw: boolean
  exiting: boolean
}

// Custom event for showing notifications
const NOTIFICATION_EVENT = 'app:notification'

interface NotificationDetail {
  text: string
  isError?: boolean
  raw?: boolean
}

/** Show notification toast. Call from anywhere. */
export function showNotification(text: string, isError = false, raw = false) {
  window.dispatchEvent(
    new CustomEvent<NotificationDetail>(NOTIFICATION_EVENT, {
      detail: { text, isError, raw }
    })
  )
}

const CheckIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

/** Listens for custom events; no context. */
export default function Notification() {
  const [state, setState] = useState<NotificationState>({
    show: false,
    text: '',
    isError: false,
    raw: false,
    exiting: false,
  })

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const handleNotification = (event: CustomEvent<NotificationDetail>) => {
      if (timeoutId) clearTimeout(timeoutId)

      setState({
        show: true,
        text: event.detail.text,
        isError: event.detail.isError ?? false,
        raw: event.detail.raw ?? false,
        exiting: false,
      })

      const hideDelay = event.detail.isError ? 2000 : 3000
      timeoutId = setTimeout(() => {
        setState(prev => ({ ...prev, exiting: true }))
        timeoutId = null
      }, hideDelay)
    }

    window.addEventListener(NOTIFICATION_EVENT, handleNotification as (e: Event) => void)

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleNotification as (e: Event) => void)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleAnimationEnd = () => {
    setState(prev => (prev.exiting ? { ...prev, show: false, exiting: false } : prev))
  }

  if (!state.show) return null

  const message = state.raw
    ? state.text
    : state.isError
      ? (state.text || 'Failed to copy to clipboard')
      : `${state.text} copied to clipboard`

  const isError = state.isError

  // Support multi-line messages: normalize literal \n then split for rendering
  const lines = message.replace(/\\n/g, '\n').split('\n')

  return (
    <div
      role="status"
      aria-live="polite"
      onAnimationEnd={handleAnimationEnd}
      className={`
        notification-toast fixed left-1/2 bottom-6 z-50 -translate-x-1/2
        flex items-center justify-center gap-3 px-5 py-4 rounded-lg text-base font-medium
        shadow-lg ring-1 w-full md:w-max max-w-[calc(100vw-2rem)]
        ${state.exiting ? 'animate-toast-out' : 'animate-toast-in'}
        ${isError
          ? 'bg-red-50 dark:bg-red-950/90 text-red-700 dark:text-red-300 ring-red-200 dark:ring-red-800'
          : 'bg-accent text-gray-900 ring-amber-800/30 dark:ring-amber-600/40'
        }
      `}
    >
      {isError ? <XIcon /> : <CheckIcon />}
      <span className="flex flex-col items-center text-center">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </span>
    </div>
  )
}

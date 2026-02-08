'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SITE_URL } from '@/app/utils/constants'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xvzkeedd'

function FeedbackForm() {
  return (
    <div className="text-center pb-20">
      <h1 className="heading-page-hero">Feedback</h1>
      <p className="text-gray-800 dark:text-gray-200 leading-7">
        Your feedback would mean a lot to me.
        <br />
        What worked for you? What didn&apos;t?
        <br />
        Thank you for your help! 🧡
      </p>

      <form
        action={FORMSPREE_ENDPOINT}
        method="POST"
        className="space-y-4 text-left md:mt-8"
      >
        <input
          type="hidden"
          name="_next"
          value={`${SITE_URL}/feedback?thanks=1`}
        />
        <input type="hidden" name="_subject" value="BitcoinDev Feedback" />

        <div>
          <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message <span className="text-accent" aria-hidden="true">*</span>
          </label>
          <textarea
            id="feedback-message"
            name="message"
            required
            rows={5}
            placeholder="Your feedback..."
            className="input-panel w-full px-3 py-2 md:min-h-[20rem] resize-y"
          />
        </div>

        <div>
          <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email <span className="text-secondary text-xs">(optional, for follow-up)</span>
          </label>
          <input
            id="feedback-email"
            name="email"
            type="email"
            placeholder="you@bitcoin.org"
            className="input-panel w-full px-3 py-2"
          />
        </div>

        <button type="submit" className="btn-primary">
          Send feedback
        </button>
      </form>
    </div>
  )
}

function FeedbackContent() {
  const searchParams = useSearchParams()
  const thanks = searchParams.get('thanks') === '1'

  if (thanks) {
    return (
      <div className="text-center">
        <h1 className="heading-page-hero">Thank you</h1>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-6">
          Your feedback helps us improve BitcoinDev. We appreciate you taking the time to share your thoughts.
        </p>
        <Link href="/" className="link-incognito">
          ← Back to Genesis
        </Link>
      </div>
    )
  }

  return <FeedbackForm />
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<FeedbackForm />}>
      <FeedbackContent />
    </Suspense>
  )
}

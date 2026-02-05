import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="heading-page-hero mb-2">
          Privacy Policy
        </h1>
        <p className="text-xl text-secondary">
          What we collect, what we use it for, and why we keep it minimal.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="heading-section-accent mb-4">
          Our stance
        </h2>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
          We say &quot;no tracking&quot; in the spirit of &quot;no ads, no paywalls, no invasive or cross-site tracking.&quot;
          We don&apos;t use third-party ad networks, we don&apos;t profile you across the web, and we don&apos;t sell or share your data.
          We do use a small amount of privacy-respecting analytics so we can improve the site. This page explains exactly what that means.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="heading-section-accent mb-4">
          What we use
        </h2>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
          BitcoinDev is hosted on Vercel. We use two of their built-in tools:
        </p>
        <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200 leading-7 space-y-2 mb-4">
          <li>
            <strong>Vercel Web Analytics</strong>: to see which pages are visited and how people find us (e.g. referrer, country). We use this to prioritize content and fix broken links.
          </li>
          <li>
            <strong>Vercel Speed Insights</strong>: to measure real-user performance (Core Web Vitals) so we can keep the site fast.
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="heading-section-accent mb-4">
          What gets collected (and what doesn&apos;t)
        </h2>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
          With Vercel Web Analytics, the data is designed to be privacy-first:
        </p>
        <ul className="list-disc pl-6 text-gray-800 dark:text-gray-200 leading-7 space-y-2 mb-4">
          <li><strong>No cookies</strong>: no persistent identifiers stored in your browser.</li>
          <li><strong>No cross-site tracking</strong>: we can&apos;t follow you to other sites, and the daily identifier can&apos;t be linked across days.</li>
          <li><strong>No personal data</strong>: no names, emails, or IP addresses stored in a way that identifies you.</li>
          <li><strong>What is collected (anonymized)</strong>: page URL, referrer, approximate location (e.g. country/region), device type, and browser. This is aggregated for stats (e.g. &quot;X visits to /docs/bitcoin&quot;) and session data is discarded after 24 hours.</li>
        </ul>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
          Speed Insights uses similar anonymized signals to report performance metrics (e.g. load time, responsiveness) so we can fix slow pages.
        </p>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
          We also use <strong>localStorage</strong> in your browser for local preferences only: theme (light/dark), things like &quot;don&apos;t show this again,&quot; and tool state (e.g. which Stack Lab challenges you&apos;ve completed). This data stays on your device and is never sent to us or used for tracking.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="heading-section-accent mb-4">
          Why we do it
        </h2>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
          We use this data only to improve BitcoinDev: which docs to expand, which tools get used, where traffic comes from, and how fast the site feels. We don&apos;t use it for advertising, retargeting, or anything beyond making the site better for everyone.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="heading-section-accent mb-4">
          More details
        </h2>
        <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
          For Vercel&apos;s own privacy and data practices, see{' '}
          <a
            href="https://vercel.com/docs/analytics/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            Vercel Analytics Privacy and Compliance
          </a>
          .
        </p>
      </section>

      <p className="text-secondary text-sm">
        <Link href="/" className="link-incognito">
          ← Back to Genesis
        </Link>
      </p>
    </div>
  )
}

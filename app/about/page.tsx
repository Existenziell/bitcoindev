import Image from 'next/image'
import Link from 'next/link'
import CopyAddressButton from '@/app/about/CopyAddressButton'

const NPUB_ADDRESS = 'npub1v7vslj3ewmdlqpzh3ta3glut80xg4vendfyvkypulydsqfmgc6kq90w3he'

export default function AboutPage() {
  return (
    <div>
      <div className="text-center mb-12">
        <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-700">
          <Image
            src="/images/people/existenziell.jpg"
            alt="Existenziell"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 128px, 160px"
            priority
          />
        </div>
        <h1 className="heading-page-hero">
          Existenziell
        </h1>
        <p className="text-xl md:text-2xl text-secondary mb-1">
          Developer & Bitcoin Enthusiast
        </p>
        <p className="text-sm md:text-base text-secondary mb-2">Giving back to the Bitcoin community</p>
      </div>

      <section className="mb-12">
        <div className="">
          <h2 className="heading-section-accent">
            About
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
            I&apos;ve been traveling the world for more than 6 years and I often lived in remote, less affluent communities.
            Having been financially vulnerable myself for some time, and seeing how the local population struggles to make ends meet,
            I started thinking about money. I got a good grasp of what it entails to earn a living day by day,
            the uncertainty of your next meal and the realization how inaccessible money can be for many people.
            This was a harsh, but very necessary wake up call for someone like me, coming from a rich western country...
          </p>
          <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
            And then I found Bitcoin. It gave me hope. It motivated me. It challenged me. It made me dream again.
            It gave me a way to build a life on my own terms. I&apos;m now building a life on Bitcoin.
            This site represents my contribution and dedication to the Bitcoin community. Stay humble, stack sats.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <div className="">
          <h2 className="heading-section-accent">
            Why BitcoinDev?
          </h2>
          <p className="text-gray-800 dark:text-gray-200 leading-7 mb-4">
            Bitcoin education is fragmented. Some resources are too technical,
            others too superficial. I created BitcoinDev to bridge that gap, providing accessible documentation that covers
            everything from fundamental concepts to advanced protocol details.
            This site is open source, free, and will always remain so. No ads,
            no paywalls, <Link href="/privacy" className="hover:text-accent transition-colors no-underline hover:underline">no tracking</Link>. Just pure Bitcoin knowledge for anyone
            who wants to learn.
          </p>
          <p className="text-gray-800 dark:text-gray-200 leading-7">
            I would love to <Link href="/feedback" className="text-accent hover:underline">get feedback</Link> from fellow Bitcoiners. I&apos;m still learning every day :)
          </p>
        </div>
      </section>

      <section className="mb-12">
        <div className="">
          <h2 className="heading-section-accent">
            Support
          </h2>
          <p className="text-gray-800 dark:text-gray-200 mb-6">
            Every sat helps keep this resource free and open for everyone!
            <br />
            Thank you for your support! 🧡
          </p>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-200">
              Lightning (Zap me on Nostr ⚡)
            </h3>
            <div className="about-address-box">
              <code className="about-address-code">
                {NPUB_ADDRESS}
              </code>
              <CopyAddressButton
                text={NPUB_ADDRESS}
                label="Nostr address"
                ariaLabel="Copy Nostr address to clipboard"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

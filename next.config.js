const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * Canonical domain
 *
 * The canonical site is https://bitcoindev.info.
 * Legacy domains: bitcoin-dev.info, bitcoindev.fyi, bplusplus.info
 * 308-redirect to https://bitcoindev.info at the edge (Vercel Domains / project settings).
 *
 * The app itself does not implement host-based redirects (no middleware/next redirects),
 * so dev/preview environments are unaffected.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  turbopack: {
    root: __dirname,
  },

  env: {
    // Used to version static JSON fetches so long-lived caching is safe across deploys.
    // Prefer provider-specific IDs when available.
    NEXT_PUBLIC_BUILD_ID:
      process.env.NEXT_PUBLIC_BUILD_ID ||
      process.env.VERCEL_DEPLOYMENT_ID ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      '',
  },

  experimental: {
    optimizePackageImports: ['react-markdown', 'highlight.js'],
    optimizeCss: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  async headers() {
    return [
      {
        source: '/icons/logo/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/data/:path*',
        headers: [
          // Versioned via `?v=${NEXT_PUBLIC_BUILD_ID}` in client fetches.
          // Long-lived caching is OK because each deploy changes the cache key.
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/docs/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/og/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)

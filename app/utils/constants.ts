/**
 * Cross-cutting constants used in multiple places.
 * Prefer putting here: API/config values, limits used by more than one consumer,
 * or values that duplicate across files. Keep single-use or domain-specific
 * constants in their own modules (e.g. searchLogic, metadata, blockUtils).
 */

/** PublicNode Bitcoin RPC endpoint. Used by API route and server-side RPC helper. */
export const BITCOIN_RPC_URL = 'https://bitcoin-rpc.publicnode.com'

/** Default limit when no limit param is provided (e.g. block-history API). */
export const DEFAULT_LIMIT = 20

/** Max allowed limit for block-history API (clamps request limit). */
export const MAX_LIMIT = 50

/** Number of blocks per page in the block visualizer UI. */
export const BLOCKS_PAGE_SIZE = 10

/** Site name. */
export const SITE_NAME = 'BitcoinDev'

/** Canonical site URL (used in metadata, sitemap, OG, canonical links). */
export const SITE_URL = 'https://bitcoindev.info'

/** Site description (≤155 chars for meta description / ~1000px). */
export const SITE_DESCRIPTION =
  'Bitcoin development guide for Bitcoin developers. Open source. CLI terminal, Stack Lab, Block Visualizer. No ads. Always free.'
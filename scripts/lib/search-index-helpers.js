/**
 * Helpers for search index generation: excerpt and ## section parsing.
 * Used by scripts/generate-search-index.js.
 */

const removeMd = require('remove-markdown')
const { generateSlug } = require('./slug')

function stripMarkdown(text) {
  return removeMd(text, { useImgAltText: false }).replace(/\s+/g, ' ').trim()
}

function excerpt(text, maxLen = 500) {
  if (!text || text.length <= maxLen) return text || ''
  const cut = text.slice(0, maxLen)
  const last = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '))
  if (last > maxLen * 0.5) return cut.slice(0, last + 1)
  return cut.trim() + '…'
}

/**
 * Parse ## Name sections from people.md. Returns [{ slug, title, body }] for each person.
 * Drops the intro (before first ##). Filters out slug "you".
 */
function parsePeopleSections(md) {
  if (!md) return []
  const parts = md.split(/\n## /)
  parts.shift()
  return parts
    .map((part) => {
      const idx = part.indexOf('\n\n')
      const title = (idx >= 0 ? part.slice(0, idx) : part).trim()
      const body = idx >= 0 ? part.slice(idx).trim() : ''
      const slug = generateSlug(title)
      if (slug === 'you') return null
      return { slug, title, body: excerpt(stripMarkdown(body), 400) }
    })
    .filter(Boolean)
}

/**
 * Parse ## Title sections from any doc page markdown. Returns [{ slug, title, body }] for each H2.
 * Drops content before first ##. Used to add H2 section entries to the search index.
 */
function parseH2Sections(md) {
  if (!md) return []
  const parts = md.split(/\n## /)
  parts.shift()
  return parts.map((part) => {
    const idx = part.indexOf('\n\n')
    const title = (idx >= 0 ? part.slice(0, idx) : part).trim()
    const body = idx >= 0 ? part.slice(idx).trim() : ''
    const slug = generateSlug(title)
    return { slug, title, body: excerpt(stripMarkdown(body), 200) }
  })
}

module.exports = { excerpt, parseH2Sections, parsePeopleSections, stripMarkdown }

/**
 * Generate URL-safe slug from text.
 * Used by: generate-search-index, MarkdownRenderer, parse-glossary.
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

module.exports = { generateSlug }

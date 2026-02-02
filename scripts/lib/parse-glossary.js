/**
 * Parse glossary markdown (terms.md) into a static JSON structure.
 * Used at build time by generate-md-content.js; output is public/data/glossary.json.
 */

const { generateSlug } = require('./slug')

const RELATED_COMMENT_RE = /^\s*<!--\s*related:\s*(\/[^\s]+)\s*-->\s*$/

function parseDefinitionAndRelated(definitionLines) {
  const relatedMatch = definitionLines.find((l) => RELATED_COMMENT_RE.test(l))
  const lines = relatedMatch
    ? definitionLines.filter((l) => !RELATED_COMMENT_RE.test(l))
    : definitionLines
  const definition = lines.join('\n').trim()
  const relatedArticle = relatedMatch ? RELATED_COMMENT_RE.exec(relatedMatch)?.[1] : undefined
  return { definition, relatedArticle }
}

/**
 * @param {string} content - Raw markdown from terms.md
 * @returns {{ letter: string, slug: string, entries: { term: string, slug: string, definition: string, relatedArticle?: string }[] }[]}
 */
function parseGlossaryContent(content) {
  const sections = []
  const lines = content.split('\n')

  let currentSection = null
  let currentEntry = null
  let currentDefinitionLines = []

  for (const line of lines) {
    const sectionMatch = line.match(/^## (.+)$/)
    if (sectionMatch) {
      if (currentEntry && currentSection) {
        const { definition, relatedArticle } = parseDefinitionAndRelated(currentDefinitionLines)
        currentEntry.definition = definition
        if (relatedArticle !== undefined) currentEntry.relatedArticle = relatedArticle
        currentSection.entries.push(currentEntry)
        currentEntry = null
        currentDefinitionLines = []
      }

      if (currentSection) {
        sections.push(currentSection)
      }

      const letter = sectionMatch[1].trim()
      currentSection = {
        letter,
        slug: generateSlug(letter),
        entries: []
      }
      continue
    }

    const termMatch = line.match(/^### (.+)$/)
    if (termMatch && currentSection) {
      if (currentEntry) {
        const { definition, relatedArticle } = parseDefinitionAndRelated(currentDefinitionLines)
        currentEntry.definition = definition
        if (relatedArticle !== undefined) currentEntry.relatedArticle = relatedArticle
        currentSection.entries.push(currentEntry)
        currentDefinitionLines = []
      }

      const term = termMatch[1].trim()
      currentEntry = {
        term,
        slug: generateSlug(term),
        definition: ''
      }
      continue
    }

    if (currentEntry) {
      currentDefinitionLines.push(line)
    }
  }

  if (currentEntry && currentSection) {
    const { definition, relatedArticle } = parseDefinitionAndRelated(currentDefinitionLines)
    currentEntry.definition = definition
    if (relatedArticle !== undefined) currentEntry.relatedArticle = relatedArticle
    currentSection.entries.push(currentEntry)
  }
  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

module.exports = { parseGlossaryContent }

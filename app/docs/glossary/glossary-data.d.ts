declare module '@/public/data/glossary.json' {
  interface GlossaryEntry {
    term: string
    slug: string
    definition: string
    relatedArticle?: string
  }
  interface GlossarySection {
    letter: string
    slug: string
    entries: GlossaryEntry[]
  }
  const value: GlossarySection[]
  export default value
}

import GlossaryRenderer from '@/app/components/GlossaryRenderer'
import { sections } from '@/app/utils/navigation'
import { generatePageMetadata } from '@/app/utils/metadata'
import glossaryData from '@/public/data/glossary.json'

export const metadata = generatePageMetadata({
  title: 'Glossary',
  description: sections.glossary.description,
  path: '/docs/glossary',
})

export default async function GlossaryPage() {
  return (
    <div>
      <h1 className="heading-page">Glossary</h1>
      <GlossaryRenderer sections={glossaryData} />
    </div>
  )
}

'use client'

import { useDocNavigation } from '@/app/hooks/useDocNavigation'
import { DownloadMarkdownIcon } from '@/app/components/Icons'

export default function DownloadMarkdownButton() {
  const { pathname, isDownloadable, isMainSectionPage } = useDocNavigation()

  // Don't show button if current page doesn't have downloadable content
  if (!isDownloadable) {
    return null
  }

  const handleDownload = () => {
    let downloadUrl = `/api/download-md?path=${encodeURIComponent(pathname)}`
    
    // If this is a top-level section overview page, prepend section name to filename
    if (isMainSectionPage) {
      // Extract section name from pathname (e.g. "history" from "/docs/history" or "/philosophy/history")
      const pathSegments = pathname.split('/').filter(Boolean)
      const sectionName = pathSegments[pathSegments.length - 1] // Get last segment after "docs"
      const filename = `${sectionName}-overview.md`
      downloadUrl += `&filename=${encodeURIComponent(filename)}`
    }
    
    window.location.href = downloadUrl
  }

  return (
    <button
      onClick={handleDownload}
      className="btn-icon btn-icon-sm btn-icon-accent"
      title="Download markdown file"
      aria-label="Download markdown file"
    >
      <DownloadMarkdownIcon aria-hidden />
    </button>
  )
}

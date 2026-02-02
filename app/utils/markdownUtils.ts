/** Remove ```mermaid ... ``` blocks from markdown (e.g. for plain-text download). */
const MERMAID_BLOCK_RE = /```mermaid\n[\s\S]*?```/g
export function stripMermaidBlocks(markdown: string): string {
  return markdown.replace(MERMAID_BLOCK_RE, '\n\n')
}

/** Remove images from markdown (markdown ![alt](url) and HTML <img ... />). */
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g
const HTML_IMG_RE = /<img[^>]*\/?>/g
export function stripImages(markdown: string): string {
  return markdown
    .replace(MARKDOWN_IMAGE_RE, '')
    .replace(HTML_IMG_RE, '')
}

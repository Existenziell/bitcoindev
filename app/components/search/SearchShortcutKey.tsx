'use client'

/**
 * Displays the search keyboard shortcut "⌘ + K" with consistent line-height
 * and symbol sizing (⌘ often renders smaller than letters in browsers).
 */
export function SearchShortcutKey({
  className = '',
  ...props
}: React.ComponentProps<'code'>) {
  return (
    <code
      className={`code-inline inline-flex items-middle py-0 leading-none ${className}`.trim()}
      {...props}
    >
      <span
        className="inline-block align-middle text-[1.25rem] leading-none"
        aria-hidden
      >
        ⌘
      </span>
      <span className="align-middle text-sm">&nbsp;+&nbsp;K</span>
    </code>
  )
}

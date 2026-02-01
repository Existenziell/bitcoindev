import type { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * Merge default className with passed className, ensuring both are applied.
 * Tailwind classes will properly override when needed (e.g., w-6 overrides w-4).
 */
function mergeClassName(defaultClass: string, passedClass?: string): string {
  if (!passedClass) return defaultClass
  return `${defaultClass} ${passedClass}`.trim()
}

/**
 * Reusable icon components to eliminate duplicate SVG code across the codebase.
 * All icons use consistent styling and can be customized via className prop.
 * Default size classes are preserved when additional classes are passed.
 */

// ============================================================================
// Chevrons / Directional Navigation
// ============================================================================

export function ChevronUp({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  )
}

export function ChevronRight({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ChevronDown({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export function ChevronLeft({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  )
}

// ============================================================================
// UI Controls
// ============================================================================

/** Four horizontal lines (list / menu). Use for "expand navigation" when sidebar is collapsed. */
export function PanelExpandIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4 transition-all duration-300 ease-in-out', className)}
      viewBox="3 6 18 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6H21M3 10H21M3 14H21M3 18H21" />
    </svg>
  )
}

/** Four short lines on the left + left-pointing arrow (collapse / indent left). Use for "collapse sidebar". */
export function PanelCollapseIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4 transition-all duration-300 ease-in-out', className)}
      viewBox="3 5 18 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 6h5M4 10h5M4 14h5M4 18h5" />
      <path d="M12 12h8" />
      <path d="M15 9l-3 3 3 3" />
    </svg>
  )
}

export function XIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

// ============================================================================
// Navigation / Location
// ============================================================================

export function HomeIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  )
}

export function SearchIcon({ className, title, ...props }: IconProps & { title?: string }) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  )
}

// ============================================================================
// Actions
// ============================================================================

export function DownloadMarkdownIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-5 h-5', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )
}

export function DownloadPDFIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-5 h-5', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

export function CopyIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}

export function ExternalLinkIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-3 h-3', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  )
}

// ============================================================================
// Content Types (for search results)
// ============================================================================

/** Document / page. Use for search result type: page. */
export function DocumentIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

/** Open book. Used for document search results. */
export function BookOpenIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  )
}

/** Person / user. Use for search result type: people. */
export function UserIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  )
}

/** Wrench / tools. Use for search result type: tool. */
export function ToolsIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="currentColor"
      viewBox="0 0 100 100"
      {...props}
    >
      <path d="M66.958,54.602c-1.821-1.821-4.786-1.821-6.608,0l-0.066,0.066l-1.298-1.298l12.849-12.848c6.649,2.043,13.76,0.297,18.692-4.635c4.337-4.337,6.27-10.528,5.17-16.56c-0.067-0.366-0.331-0.665-0.686-0.775c-0.354-0.111-0.741-0.015-1.005,0.248l-8.954,8.953l-11.038-1.767l-1.767-11.038L81.2,5.994c0.263-0.263,0.358-0.65,0.248-1.005s-0.409-0.619-0.775-0.686c-6.031-1.098-12.223,0.833-16.56,5.17c-4.932,4.932-6.679,12.042-4.635,18.692L46.63,41.015L19.821,14.206c-0.101-0.101-0.223-0.179-0.356-0.229l-6.717-2.516c-0.368-0.137-0.781-0.048-1.058,0.229c-0.277,0.277-0.367,0.691-0.229,1.058l2.516,6.717c0.05,0.134,0.128,0.255,0.229,0.356L41.015,46.63L28.166,59.478c-6.65-2.044-13.761-0.296-18.692,4.635c-4.338,4.337-6.271,10.528-5.171,16.56c0.067,0.366,0.331,0.665,0.686,0.775c0.355,0.112,0.742,0.016,1.005-0.248l8.954-8.953l11.038,1.767l1.767,11.038L18.8,94.006c-0.263,0.263-0.358,0.65-0.248,1.005s0.409,0.619,0.775,0.686C20.442,95.9,21.563,96,22.676,96c4.909,0,9.676-1.938,13.211-5.474c4.932-4.931,6.679-12.042,4.635-18.692L53.37,58.985l1.298,1.298l-0.066,0.066c-1.822,1.822-1.822,4.786,0,6.608L78.84,91.195c0.906,0.906,2.096,1.358,3.288,1.358c1.197,0,2.396-0.457,3.309-1.37l5.748-5.748c1.822-1.822,1.827-4.781,0.011-6.596L66.958,54.602z M63.693,73.221l1.941-1.941l8.877,8.877l-1.941,1.941L63.693,73.221z M71.806,62.28l-2.647,2.647l-4.232,4.232l-2.647,2.647l-2.818-2.818l9.526-9.526L71.806,62.28z M69.866,67.048l8.877,8.877l-2.818,2.818l-8.877-8.877L69.866,67.048z M73.985,83.511l2.647-2.647l4.232-4.232l2.647-2.647l2.818,2.818l-9.526,9.526L73.985,83.511z M80.157,74.511l-8.877-8.877l1.941-1.941l8.877,8.878L80.157,74.511z M61.326,29.147c0.27-0.27,0.363-0.67,0.239-1.032c-2.091-6.091-0.573-12.692,3.962-17.228c3.4-3.399,8.075-5.144,12.808-4.856l-7.863,7.863c-0.227,0.227-0.331,0.548-0.28,0.865l1.962,12.257c0.068,0.426,0.403,0.761,0.829,0.829l12.257,1.962c0.316,0.051,0.638-0.054,0.865-0.28l7.863-7.863c0.289,4.734-1.457,9.409-4.856,12.808c-4.535,4.536-11.136,6.054-17.228,3.962c-0.363-0.126-0.763-0.032-1.032,0.239L57.571,51.956l-2.822-2.822l10.246-10.246c0.519-0.518,0.804-1.208,0.804-1.942s-0.286-1.424-0.803-1.942c-1.036-1.036-2.849-1.036-3.884,0L50.866,45.25l-2.822-2.822L61.326,29.147z M52.28,46.665l10.247-10.246c0.28-0.281,0.774-0.282,1.055,0c0.141,0.14,0.218,0.328,0.218,0.527s-0.077,0.387-0.218,0.527c0,0,0,0,0,0L53.335,47.72L52.28,46.665z M38.674,70.853c-0.27,0.27-0.363,0.67-0.239,1.032c2.091,6.091,0.573,12.692-3.962,17.227c-3.399,3.399-8.069,5.146-12.808,4.857l7.863-7.863c0.227-0.227,0.331-0.548,0.28-0.865l-1.962-12.257c-0.068-0.426-0.403-0.761-0.829-0.829L14.76,70.192c-0.317-0.053-0.639,0.053-0.865,0.28l-7.863,7.863c-0.289-4.734,1.457-9.409,4.857-12.808c4.536-4.535,11.138-6.052,17.227-3.962c0.361,0.123,0.761,0.031,1.032-0.239l13.282-13.282l2.822,2.822L35.004,61.111c-0.518,0.518-0.804,1.208-0.804,1.942s0.286,1.424,0.803,1.942c0.518,0.518,1.208,0.804,1.942,0.804s1.424-0.286,1.942-0.804L49.134,54.75l2.822,2.822L38.674,70.853z M47.72,53.335L37.474,63.582c-0.28,0.281-0.774,0.282-1.055,0c-0.141-0.14-0.218-0.328-0.218-0.527s0.077-0.387,0.218-0.528L46.665,52.28L47.72,53.335z M54.077,56.864l-4.236-4.236l-2.47-2.47l-4.236-4.236L15.773,18.561l-1.669-4.456l4.456,1.669l27.362,27.362l4.236,4.236l2.47,2.47l4.236,4.236l2.005,2.005l-2.787,2.787L54.077,56.864z M56.016,61.764l0.773-0.773l4.201-4.201l0.773-0.773c0.521-0.521,1.206-0.781,1.89-0.781c0.685,0,1.369,0.26,1.89,0.781l2.031,2.031l-9.528,9.528l-2.031-2.031C54.974,64.502,54.974,62.806,56.016,61.764z M89.77,84.022l-5.748,5.748c-0.505,0.505-1.175,0.784-1.887,0.786c-0.708,0.007-1.379-0.273-1.881-0.775l-2.037-2.037l9.527-9.527l2.037,2.037c0.502,0.502,0.777,1.17,0.775,1.881C90.554,82.847,90.275,83.517,89.77,84.022z" />
    </svg>
  )
}

// ============================================================================
// Application-specific
// ============================================================================

export function TerminalIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-5 h-5', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

export function StackLabIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 32 32"
      {...props}
    >
      <path
        d="M31.276,18.553L30,16h0.382c0.743,0,1.227-0.782,0.894-1.447l-7-14
	C24.107,0.214,23.761,0,23.382,0H8.618C8.239,0,7.893,0.214,7.724,0.553l-7,14C0.391,15.218,0.875,16,1.618,16H2l-1.276,2.553
	C0.391,19.218,0.875,20,1.618,20H2l-1.276,2.553C0.391,23.218,0.875,24,1.618,24H2l-1.276,2.553C0.391,27.218,0.875,28,1.618,28H2
	l-1.276,2.553C0.391,31.218,0.875,32,1.618,32h28.764c0.743,0,1.227-0.782,0.894-1.447L30,28h0.382c0.743,0,1.227-0.782,0.894-1.447
	L30,24h0.382c0.743,0,1.227-0.782,0.894-1.447L30,20h0.382C31.125,20,31.609,19.218,31.276,18.553z M3.236,30l1.5-3h22.528l1.5,3
	H3.236z M3.236,26l1.5-3h22.528l1.5,3H3.236z M3.236,22l1.5-3h22.528l1.5,3H3.236z M3.236,18l1.5-3h22.528l1.5,3H3.236z M3.236,14
	l6-12h13.528l6,12H3.236z M19.868,6H12l0.5-1h6.868L19.868,6z M20.868,8H11l0.5-1h8.868L20.868,8z M21.368,9l0.5,1H10l0.5-1H21.368z"
        fill="currentColor"
      />
    </svg>
  )
}

// ============================================================================
// Tools (Block Visualizer, Hash, Denominations Calculator)
// ============================================================================

/** Block Visualizer tool icon (3D blocks). */
export function BlockVisualizerIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="currentColor"
      viewBox="0 0 385.419 385.419"
      {...props}
    >
      <path d="M188.998,331.298l-0.231-107.449l-92.494-53.907L3.946,223.654l0.225,108.29l92.102,53.475L188.998,331.298z M105.656,358.292l0.165-75.232l64.289-37.558l0.165,75.067L105.656,358.292z M96.26,191.586l64.603,37.658l-64.384,37.606L31.874,229.05L96.26,191.586z M22.703,245.356l64.411,37.691l-0.164,75.335l-64.092-37.217L22.703,245.356z" />
      <path d="M288.748,169.948l-92.324,53.706l0.231,108.29l92.104,53.475l92.714-54.121l-0.231-107.449L288.748,169.948z M288.735,191.586l64.605,37.658l-64.386,37.606l-64.606-37.801L288.735,191.586z M215.179,245.356l64.404,37.691l-0.164,75.335l-64.076-37.217L215.179,245.356z M298.137,358.292l0.159-75.232l64.289-37.558l0.164,75.067L298.137,358.292z" />
      <path d="M285.216,53.892L192.719,0l-92.324,53.697l0.222,108.295l92.102,53.479l92.717-54.121L285.216,53.892z M192.707,21.635l64.609,37.649l-64.384,37.619l-64.609-37.811L192.707,21.635z M119.149,75.401l64.411,37.698l-0.161,75.335l-64.095-37.211L119.149,75.401z M202.099,188.343l0.162-75.234l64.292-37.564l0.164,75.073L202.099,188.343z" />
    </svg>
  )
}

/** Hash tool icon (#). */
export function HashIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M8 4v16M16 4v16M4 9h16M4 15h16" />
    </svg>
  )
}

/** Denominations / Calculator tool icon. */
export function CalculatorIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="currentColor"
      viewBox="0 0 535.5 535.5"
      {...props}
    >
      <path d="M435.094,0H100.406C89.84,0,81.281,8.559,81.281,19.125v162.562h372.938V19.125C454.219,8.559,445.66,0,435.094,0z M415.969,133.875H119.531V38.25h296.438V133.875z" />
      <path d="M81.281,516.375c0,10.566,8.559,19.125,19.125,19.125h334.688c10.566,0,19.125-8.559,19.125-19.125V191.25H81.281V516.375z M368.156,239.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V239.062z M368.156,315.562c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V315.562z M368.156,392.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v86.062c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V392.062z M282.094,239.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V239.062z M282.094,315.562c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V315.562z M282.094,392.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V392.062z M282.094,468.562c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V468.562z M196.031,239.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V239.062z M196.031,315.562c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V315.562z M196.031,392.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V392.062z M196.031,468.562c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V468.562z M109.969,239.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V239.062z M109.969,315.562c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V315.562z M109.969,392.062c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V392.062z M109.969,468.562c0-10.566,8.559-19.125,19.125-19.125h28.688c10.566,0,19.125,8.559,19.125,19.125v9.562c0,10.566-8.559,19.125-19.125,19.125h-28.688c-10.566,0-19.125-8.559-19.125-19.125V468.562z" />
      <polygon points="396.844,258.188 406.406,258.188 406.406,248.625 415.969,248.625 415.969,239.062 406.406,239.062 406.406,229.5 396.844,229.5 396.844,239.062 387.281,239.062 387.281,248.625 396.844,248.625" />
      <rect x="387.281" y="420.75" width="28.688" height="9.562" />
      <rect x="387.281" y="315.562" width="28.688" height="9.562" />
      <rect x="387.281" y="439.875" width="28.688" height="9.562" />
    </svg>
  )
}

// ============================================================================
// Status / Info
// ============================================================================

export function InfoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={mergeClassName('w-4 h-4', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}

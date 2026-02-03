'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSearch } from '@/app/hooks/useSearch'
import { SearchInput } from '@/app/components/SearchInput'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { query, setQuery, results, loading } = useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const previousPathnameRef = useRef<string>(pathname)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      inputRef.current?.focus()
    } else {
      // Clear query when modal closes to ensure fresh state on next open
      setQuery('')
    }
  }, [isOpen, setQuery])

  // Close modal and clear query when pathname changes (navigation occurred)
  useEffect(() => {
    if (isOpen && pathname !== previousPathnameRef.current) {
      previousPathnameRef.current = pathname
      setQuery('')
      onClose()
    } else if (!isOpen) {
      // Update ref when modal closes to track the current pathname
      previousPathnameRef.current = pathname
    }
  }, [pathname, isOpen, onClose, setQuery])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay flex items-start justify-center pt-[20vh] px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      <SearchInput
        variant="dropdown"
        query={query}
        setQuery={setQuery}
        results={results}
        loading={loading}
        inputRef={inputRef}
        onEscape={onClose}
        onNavigate={(item) => {
          onClose()
          router.push(item.path)
        }}
        enabled={isOpen}
        autoFocus={isOpen}
      />
    </div>
  )
}

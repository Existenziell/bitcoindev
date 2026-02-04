/**
 * Shared formatters for Stack Lab: stack items, bytes-to-hex, and execution log.
 */

import type { StackItem } from '@/app/utils/stackLabInterpreter'
import { isKnownOpCode } from '@/app/utils/stackLabInterpreter'

/**
 * Convert bytes to hex string (without "0x" prefix).
 * If maxBytes is given, only the first maxBytes are converted.
 */
export function bytesToHex(bytes: Uint8Array, maxBytes?: number): string {
  const slice = maxBytes != null && bytes.length > maxBytes ? bytes.slice(0, maxBytes) : bytes
  return Array.from(slice)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface FormatStackItemOpts {
  /** When a hex string exceeds this length, truncate. Default 20. */
  maxHexLength?: number
  /** If true, show head...tail when truncating hex. Default false. */
  hexShowTail?: boolean
  /** Max bytes to show for Uint8Array. Default 8. */
  uint8MaxBytes?: number
}

/**
 * Format a single stack item for display in script builders, stack viz, etc.
 */
export function formatStackItem(
  item: StackItem,
  opts: FormatStackItemOpts = {}
): string {
  const { maxHexLength = 20, hexShowTail = false, uint8MaxBytes = 8 } = opts

  if (typeof item === 'number') return item.toString()
  if (typeof item === 'boolean') return item ? 'true' : 'false'
  if (typeof item === 'string') {
    if (item.startsWith('0x') && item.length > maxHexLength) {
      return hexShowTail
        ? `${item.slice(0, 10)}...${item.slice(-8)}`
        : `${item.slice(0, 10)}...`
    }
    return item
  }
  if (item instanceof Uint8Array) {
    const hex = bytesToHex(item, uint8MaxBytes)
    return `0x${hex}${item.length > uint8MaxBytes ? '...' : ''}`
  }
  return String(item)
}

/**
 * Format a script item for display in the script builder: opcodes as-is,
 * push data wrapped as Pushdata(...).
 */
export function formatScriptItemForBuilder(item: string | StackItem, opts: FormatStackItemOpts = {}): string {
  if (typeof item === 'string' && isKnownOpCode(item)) {
    return item
  }
  const inner = formatStackItem(item as StackItem, opts)
  // Quote non-hex string data so it's unambiguous
  if (typeof item === 'string' && !item.startsWith('0x')) {
    const escaped = inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return `Pushdata("${escaped}")`
  }
  return `Pushdata(${inner})`
}

/**
 * Format a stack array for the execution log: [ "a", 1, "0xab..." ].
 * Strings are quoted; other items use formatStackItem with higher limits.
 */
export function formatStackForLog(stack: StackItem[]): string {
  if (stack.length === 0) return '[]'
  return `[${stack
    .map((item) =>
      typeof item === 'string' ? `"${item}"` : formatStackItem(item, { maxHexLength: 80, uint8MaxBytes: 16 })
    )
    .join(', ')}]`
}

/**
 * Human-readable type label for a stack item (e.g. "number", "hex", "bytes").
 */
export function getItemType(item: StackItem): string {
  if (typeof item === 'number') return 'number'
  if (typeof item === 'boolean') return 'boolean'
  if (typeof item === 'string') return item.startsWith('0x') ? 'hex' : 'string'
  if (item instanceof Uint8Array) return 'bytes'
  return 'unknown'
}

/**
 * "X item" / "X items" for script/stack footers.
 */
export function itemCount(count: number): string {
  return `${count} item${count !== 1 ? 's' : ''}`
}

/**
 * Parse user input (e.g. from Push Data modal or script item edit) into a StackItem.
 * - Empty or whitespace-only: returns null (caller should treat as cancel/invalid).
 * - Numeric: returns number.
 * - Otherwise: returns string.
 */
export function parseStackItem(input: string): number | string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null
  const numValue = Number(trimmed)
  return !isNaN(numValue) ? numValue : trimmed
}

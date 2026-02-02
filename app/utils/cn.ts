import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge and deduplicate class names. Use for base + conditional + prop classes.
 * tailwind-merge resolves conflicting Tailwind utilities (later wins).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

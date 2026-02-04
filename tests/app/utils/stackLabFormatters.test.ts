import { describe, it, expect } from 'vitest'
import {
  bytesToHex,
  formatStackItem,
  formatScriptItemForBuilder,
  formatStackForLog,
  getItemType,
  itemCount,
  parseStackItem,
} from '@/app/utils/stackLabFormatters'
import type { StackItem } from '@/app/utils/stackLabInterpreter'

describe('bytesToHex', () => {
  it('Uint8Array([0xab, 0xcd]) → "abcd"', () => {
    expect(bytesToHex(new Uint8Array([0xab, 0xcd]))).toBe('abcd')
  })

  it('with maxBytes: 1 returns only first byte', () => {
    expect(bytesToHex(new Uint8Array([0xab, 0xcd]), 1)).toBe('ab')
  })
})

describe('formatStackItem', () => {
  it('formats number', () => {
    expect(formatStackItem(42)).toBe('42')
  })

  it('formats boolean', () => {
    expect(formatStackItem(true)).toBe('true')
    expect(formatStackItem(false)).toBe('false')
  })

  it('formats short string as-is', () => {
    expect(formatStackItem('hello')).toBe('hello')
  })

  it('truncates long 0x string', () => {
    const long = '0x123456789012345678901234567890'
    expect(formatStackItem(long)).toMatch(/^0x[\da-f]+\.\.\.$/)
    expect(formatStackItem(long).length).toBeLessThan(long.length)
  })

  it('formats Uint8Array', () => {
    const arr = new Uint8Array([0xab, 0xcd, 0xef])
    expect(formatStackItem(arr)).toMatch(/^0x[\da-f]+$/)
    expect(formatStackItem(arr)).toBe('0xabcdef')
  })
})

describe('formatScriptItemForBuilder', () => {
  it('shows opcodes as-is', () => {
    expect(formatScriptItemForBuilder('OP_DUP')).toBe('OP_DUP')
    expect(formatScriptItemForBuilder('OP_ADD')).toBe('OP_ADD')
  })

  it('wraps number push data as Pushdata(n)', () => {
    expect(formatScriptItemForBuilder(42)).toBe('Pushdata(42)')
  })

  it('wraps boolean push data as Pushdata(...)', () => {
    expect(formatScriptItemForBuilder(true)).toBe('Pushdata(true)')
    expect(formatScriptItemForBuilder(false)).toBe('Pushdata(false)')
  })

  it('wraps hex string push data as Pushdata(0x...)', () => {
    expect(formatScriptItemForBuilder('0xdeadbeef')).toBe('Pushdata(0xdeadbeef)')
  })

  it('wraps non-hex string push data as Pushdata("...")', () => {
    expect(formatScriptItemForBuilder('hello')).toBe('Pushdata("hello")')
  })

  it('escapes quotes in quoted push data', () => {
    expect(formatScriptItemForBuilder('say "hi"')).toBe('Pushdata("say \\"hi\\"")')
  })

  it('wraps Uint8Array as Pushdata(0x...)', () => {
    const arr = new Uint8Array([0xab, 0xcd])
    expect(formatScriptItemForBuilder(arr)).toBe('Pushdata(0xabcd)')
  })
})

describe('formatStackForLog', () => {
  it('[] → "[]"', () => {
    expect(formatStackForLog([])).toBe('[]')
  })

  it('[1, "a"] → "[1, \\"a\\"]"', () => {
    expect(formatStackForLog([1, 'a'])).toBe('[1, "a"]')
  })

  it('formats Uint8Array in stack', () => {
    const stack: StackItem[] = [new Uint8Array([0xab, 0xcd])]
    expect(formatStackForLog(stack)).toMatch(/^\[0x[\da-f]+\]$/)
  })
})

describe('getItemType', () => {
  it('number → "number"', () => {
    expect(getItemType(42)).toBe('number')
  })

  it('boolean → "boolean"', () => {
    expect(getItemType(true)).toBe('boolean')
  })

  it('plain string → "string"', () => {
    expect(getItemType('hello')).toBe('string')
  })

  it('0x string → "hex"', () => {
    expect(getItemType('0xab')).toBe('hex')
  })

  it('Uint8Array → "bytes"', () => {
    expect(getItemType(new Uint8Array([1]))).toBe('bytes')
  })

  it('other → "unknown"', () => {
    expect(getItemType({} as StackItem)).toBe('unknown')
  })
})

describe('itemCount', () => {
  it('0 → "0 items"', () => {
    expect(itemCount(0)).toBe('0 items')
  })

  it('1 → "1 item"', () => {
    expect(itemCount(1)).toBe('1 item')
  })

  it('2 → "2 items"', () => {
    expect(itemCount(2)).toBe('2 items')
  })
})

describe('parseStackItem', () => {
  it('" 42 " → 42', () => {
    expect(parseStackItem(' 42 ')).toBe(42)
  })

  it('"hello" → "hello"', () => {
    expect(parseStackItem('hello')).toBe('hello')
  })

  it('"" → null', () => {
    expect(parseStackItem('')).toBe(null)
  })

  it('"   " → null', () => {
    expect(parseStackItem('   ')).toBe(null)
  })

  it('"0x1234" → 4660 (hex parsed as number)', () => {
    expect(parseStackItem('0x1234')).toBe(4660)
  })

  it('"0xab" → 171', () => {
    expect(parseStackItem('0xab')).toBe(171)
  })

  it('"abc" (non-numeric) → "abc"', () => {
    expect(parseStackItem('abc')).toBe('abc')
  })
})

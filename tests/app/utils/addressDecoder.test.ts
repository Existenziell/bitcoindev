import { describe, it, expect } from 'vitest'
import { decodeAddress, decodeBase58Check, decodeBech32 } from '@/app/utils/addressDecoder'

describe('decodeBase58Check', () => {
  it('empty input → valid: false, error', () => {
    const r = decodeBase58Check('')
    expect(r.valid).toBe(false)
    expect(r.error).toBeDefined()
  })

  it('valid P2PKH (1...) → valid: true, version 0', () => {
    const r = decodeBase58Check('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    expect(r.valid).toBe(true)
    expect(r.versionByte).toBe(0x00)
    expect(r.payloadLength).toBe(20)
  })

  it('invalid Base58 character → valid: false, error', () => {
    const r = decodeBase58Check('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN0O') // O invalid
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/Invalid Base58/)
  })

  it('checksum mismatch → valid: false', () => {
    const r = decodeBase58Check('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN3') // last char changed
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/Checksum/)
  })
})

describe('decodeBech32', () => {
  it('empty input → valid: false', () => {
    const r = decodeBech32('')
    expect(r.valid).toBe(false)
    expect(r.error).toBeDefined()
  })

  it('valid P2WPKH (bc1q...) → valid: true, hrp bc, witness version 0, 20 bytes', () => {
    const r = decodeBech32('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')
    expect(r.valid).toBe(true)
    expect(r.hrp).toBe('bc')
    expect(r.witnessVersion).toBe(0)
    expect(r.dataLength).toBe(20)
    expect(r.encoding).toBe('bech32')
  })

  it('invalid character → valid: false', () => {
    const r = decodeBech32('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5md!')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/Invalid character/)
  })

  it('invalid checksum → valid: false', () => {
    const r = decodeBech32('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdr')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/Checksum/)
  })
})

describe('decodeAddress', () => {
  it('empty input → type unknown, valid: false', () => {
    const r = decodeAddress('')
    expect(r.type).toBe('unknown')
    expect(r.valid).toBe(false)
    expect(r.error).toBeDefined()
  })

  it('P2PKH 1BvB... → type p2pkh, network mainnet, valid: true', () => {
    const r = decodeAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')
    expect(r.type).toBe('p2pkh')
    expect(r.network).toBe('mainnet')
    expect(r.valid).toBe(true)
    expect(r.scriptTemplate).toMatch(/OP_DUP/)
  })

  it('P2WPKH bc1q... → type p2wpkh, network mainnet, valid: true', () => {
    const r = decodeAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')
    expect(r.type).toBe('p2wpkh')
    expect(r.network).toBe('mainnet')
    expect(r.valid).toBe(true)
    expect(r.scriptTemplate).toMatch(/OP_0/)
  })

  it('P2TR bc1p... → type p2tr, valid: true', () => {
    const r = decodeAddress('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297')
    expect(r.type).toBe('p2tr')
    expect(r.network).toBe('mainnet')
    expect(r.valid).toBe(true)
  })
})

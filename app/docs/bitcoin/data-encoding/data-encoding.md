# Data Encoding

Bitcoin serializes transactions and blocks as byte sequences. When you read or write raw data (e.g. parsing a transaction, building a block header), you need to know how numbers and variable-length fields are encoded.

## Bytes and hexadecimal

Raw transaction and block data are sequences of **bytes** (8-bit values, 0–255). They are often shown in **hexadecimal** (base-16): each byte is two hex digits (0–9, A–F). For example, the 32-byte TXID is 64 hex characters.

## Little-endian

Multi-byte integers in Bitcoin (version, locktime, nonce, value, etc.) are stored in **little-endian** order: the least significant byte first. For example, the 4-byte value `0x00000001` is stored as bytes `01 00 00 00`.

## Compact size (VarInt)

Variable-length fields (script length, number of inputs/outputs, witness stack size) use **compact size** encoding (also called VarInt). The first byte determines how many bytes follow:

- **0–252:** The value is that single byte.
- **253:** Next 2 bytes (little-endian) are a 16-bit value.
- **254:** Next 4 bytes (little-endian) are a 32-bit value.
- **255:** Next 8 bytes (little-endian) are a 64-bit value.

This keeps small values (e.g. 1 input, 2 outputs) to one byte and allows larger values when needed.

## Block and transaction layout

- **Block header:** 80 bytes, all fixed: version (4), previous block hash (32), merkle root (32), timestamp (4), difficulty target (nBits, 4), nonce (4). All multi-byte integers little-endian.
- **Transaction:** version (4), then (for SegWit) marker + flag (2), then inputs (compact size + per-input outpoint, scriptSig length, scriptSig, sequence), then outputs (compact size + per-output value, scriptPubKey length, scriptPubKey), then locktime (4), then witness data (per-input). See [Transaction Structure](/docs/bitcoin/transaction-structure) for field meanings.

## Related

- [Transaction Decoder](/interactive-tools/transaction-decoder) — decode raw transaction hex in the browser
- [Transaction Structure](/docs/bitcoin/transaction-structure) for input and output fields
- [Script](/docs/bitcoin/script) for script format
- [Blocks](/docs/bitcoin/blocks) for block format

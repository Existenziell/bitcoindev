# Sighash Types

When you sign a Bitcoin [transaction](/docs/bitcoin/transaction-lifecycle), the signature does not cover the raw transaction bytes. Instead, the signer first builds a **signature hash** (sighash): a structured digest of *parts* of the transaction. The **sighash type** (a byte appended to the signature or encoded in it) selects *which* parts are included. This controls what the signer commits to and what can be changed without invalidating the signature.

Understanding sighash types is important for transaction construction, [smart contracts](/docs/wallets/smart-contracts), [RBF](/docs/bitcoin/transaction-fees#replace-by-fee-rbf-and-bip-125), and proposed upgrades such as [SIGHASH_ANYPREVOUT](/docs/advanced/covenants).

## The Sighash (Signature Hash)

For each input, the signer:

1. Builds a **sighash** from the transaction according to the sighash type.
2. Signs the sighash with the private key.
3. The signature (plus the sighash type byte) is placed in the witness or scriptSig.

Verifiers recompute the sighash the same way and check the signature against it. If the transaction is modified in a part that was included in the sighash, the signature fails.

```text
[Transaction] ----\
                   --> [Sighash bytes] --> [Sign]
[Sighash type] ----/
```

---

## Sighash Type Byte

The sighash type is one byte. Its bits mean:

- **Low 3 bits** (mask `0x1f`): base type
- **Bit 0x80** (`SIGHASH_ANYONECANPAY`): if set, only the *current* input is included in the sighash; other inputs are not committed to.

So `SIGHASH_ALL | SIGHASH_ANYONECANPAY` means “commit to all outputs and to this input only; other inputs can change.”

---

## Standard Sighash Types

### SIGHASH_ALL (0x01)

**Default and most common.** The sighash includes:

- Version, locktime
- All inputs (or only the current one if `ANYONECANPAY` is set): outpoint, [script](/docs/bitcoin/script) (or scriptCode for [SegWit](/docs/bitcoin/segwit)), sequence
- All outputs: value and scriptPubKey

The signer commits to the whole transaction (or to all outputs and only this input with `ANYONECANPAY`). Changing any committed part invalidates the signature. For SegWit and [Taproot](/docs/bitcoin/taproot), the default used in most wallets is `SIGHASH_DEFAULT`, which is treated like `SIGHASH_ALL` (see below).

### SIGHASH_NONE (0x02)

The sighash includes all inputs (or only the current one with `ANYONECANPAY`) but **no outputs**. The signer does not commit to where the BTC goes. Someone else can add or change outputs. Rarely used; required for some [contract](/docs/wallets/smart-contracts) patterns.

### SIGHASH_SINGLE (0x03)

The sighash includes all inputs (or only the current one with `ANYONECANPAY`) and **only the output at the same index as the signed input**. Other outputs are not committed. If there is no output at that index, the sighash is defined as `0x01` repeated 32 times (invalid to sign). Useful when the signer only cares about “my input goes to the output at my index.”

### SIGHASH_ANYONECANPAY (0x80)

This is a **flag** OR’d with `ALL`, `NONE`, or `SINGLE`:

- **SIGHASH_ALL | ANYONECANPAY (0x81)**: Commit to all outputs and only *this* input. Other inputs can be added or changed. Used for CoinJoin and similar: each signer signs only their input and agrees to the output set.
- **SIGHASH_NONE | ANYONECANPAY (0x82)**: Commit only to this input; no outputs. Rare.
- **SIGHASH_SINGLE | ANYONECANPAY (0x83)**: Commit only to this input and the output at the same index. Rare.

---

## SIGHASH_DEFAULT (0x00) and Taproot

For Taproot (and commonly for SegWit v0), the value **0x00** is used to mean **default** behavior: it is interpreted as **SIGHASH_ALL** (commit to all inputs and outputs). The extra byte is omitted in the signature encoding when the type is default, so the signature is 64 bytes for [Schnorr](/docs/bitcoin/cryptography#schnorr-signatures) rather than 65.

---

## Summary Table

| Type | Name | Inputs in sighash | Outputs in sighash |
|------|------|-------------------|--------------------|
| 0x01 | SIGHASH_ALL | All (or current with 0x80) | All |
| 0x02 | SIGHASH_NONE | All (or current with 0x80) | None |
| 0x03 | SIGHASH_SINGLE | All (or current with 0x80) | Output at same index |
| 0x80 | ANYONECANPAY | Bit flag: only current input | (depends on base) |
| 0x00 | SIGHASH_DEFAULT | Treated as ALL | Treated as ALL |

---

## Use Cases

- **Normal payments**: SIGHASH_ALL or SIGHASH_DEFAULT. Full commitment to the transaction.
- **RBF**: Same; the replacement is a new transaction with new signatures. Sighash types do not change.
- **[CoinJoin](/docs/wallets/privacy)**: SIGHASH_ALL | SIGHASH_ANYONECANPAY so each participant signs only their input and agrees to the common outputs.
- **Contract / [Covenant](/docs/advanced/covenants) designs**: SIGHASH_NONE, SIGHASH_SINGLE, or ANYONECANPAY can be used so that the signer does not commit to all outputs or all inputs. Proposed **SIGHASH_ANYPREVOUT** would allow reusing a signature across [transactions](/docs/bitcoin/transaction-lifecycle) with different outpoints, enabling more flexible [covenants](/docs/advanced/covenants) and [Lightning](/docs/lightning)-style protocols.

---

## Related Topics

- [Cryptography](/docs/bitcoin/cryptography) - Signing and the structure of the signed message
- [Transaction Lifecycle](/docs/bitcoin/transaction-lifecycle) - States of a transaction
- [Transaction Fees](/docs/bitcoin/transaction-fees) - RBF and fee bumping
- [Covenants](/docs/advanced/covenants) - SIGHASH_ANYPREVOUT and covenant designs
- Taproot - SIGHASH_DEFAULT and Schnorr

---

## Resources

- [BIP 143: Transaction Signature Verification for Version 0 Witness Program](https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki) - SegWit sighash
- [BIP 341: Taproot](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) - Taproot and Tapscript sighash
- [Bitcoin Core: Sighash](https://github.com/bitcoin/bitcoin/blob/master/src/script/sign.cpp) - Implementation

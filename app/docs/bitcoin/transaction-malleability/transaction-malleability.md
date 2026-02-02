# Transaction Malleability

Transaction malleability was a vulnerability in Bitcoin that allowed anyone to modify a transaction's signature without invalidating it, changing the transaction ID. SegWit fixed this issue in 2017.

## What Was Transaction Malleability?

**Transaction malleability** allowed modifying transaction signatures in ways that changed the transaction ID but didn't invalidate the transaction:

```text
Original Transaction:
TXID: abc123...
Signature: [valid signature]

Malleated Transaction:
TXID: def456... (different!)
Signature: [modified but still valid]
```

Both transactions were valid, but had different IDs.

---

## How It Worked

### The Problem

Before SegWit, signatures were part of the transaction data used to calculate the TXID:

```text
TXID = SHA256D(serialized transaction)
     = SHA256D(version + inputs + outputs + signatures + locktime)
```

Since signatures could be modified (DER encoding variations, S-value normalization), the TXID could change.

### Attack Vector

```text
1. Alice broadcasts transaction: TXID = abc123...
2. Attacker sees transaction in mempool
3. Attacker modifies signature (malleates)
4. Attacker broadcasts malleated version: TXID = def456...
5. One version gets confirmed (def456...)
6. Alice's original transaction (abc123...) never confirms
7. Alice thinks transaction failed, but it actually succeeded
```

---

## Impact

### Problems Created

1. **Payment Channels Impossible**: Couldn't build transactions depending on unconfirmed transactions
2. **Lightning Network Blocked**: Required fixed transaction IDs
3. **Transaction Tracking Issues**: TXIDs could change unexpectedly
4. **Double-Spend Confusion**: Appeared like double-spend, but wasn't

### Example: Payment Channel

```text
Payment Channel Setup:
1. Create funding transaction: TXID = fund123...
2. Create commitment transaction: depends on fund123...
3. Attacker malleates funding tx: TXID = fund456...
4. Commitment transaction becomes invalid!
5. Payment channel fails to open
```

---

## The Fix: SegWit

SegWit separated witness (signature) data from transaction data:

```mermaid
flowchart LR
  Before[Before: Signature in tx body]
  After[After: Signature in witness]
  TXID1[TXID includes sig - malleable]
  TXID2[TXID excludes sig - fixed]
  Before --> TXID1
  After --> TXID2
```

```text
Before SegWit:
TXID = SHA256D(transaction with signatures)

After SegWit:
TXID = SHA256D(transaction WITHOUT witness)
wtxid = SHA256D(transaction WITH witness)
```

**Key insight**: TXID no longer includes signatures, so it can't be changed by signature modifications.

---

## wTXID

The **witness transaction ID (wTXID)** is the hash of the full transaction including witness data. Unlike the TXID, which hashes only the base transaction (and thus excludes witness), the wTXID changes if witness data changes. SegWit and Taproot transactions have both a TXID (used for outpoint references and chain indexing) and a wTXID. The wTXID is used where the full committed transaction identity matters (e.g. compact block relay). Because the TXID excludes witness, it is stable and malleability is fixed.

---

## Historical Context

### When It Was Discovered

- **2011**: First discussions of malleability
- **2013**: Mt. Gox blamed malleability for issues (later revealed as cover-up)
- **2014**: More serious attention to the problem
- **2017**: SegWit activated, fixing the issue

### Mt. Gox Incident

Mt. Gox claimed transaction malleability caused their problems:

```text
Claimed:
- Malleated transactions confused their system
- Led to accounting errors
- Caused exchange issues

Reality:
- Malleability was real, but not the main issue
- Poor security and management were the real problems
- Used as excuse for larger failures
```

---

## Technical Details

### Signature Encoding Variations

ECDSA signatures have multiple valid encodings:

```text
DER Encoding:
- S-value can be normalized (low or high)
- Extra bytes can be added/removed
- All produce valid signatures
- All change the transaction hash
```

### S-Value Normalization

```text
ECDSA Signature:
- r value: 32 bytes
- s value: 32 bytes (can be s or n-s)

Both are valid:
- s = 0x1234...
- s = n - 0x1234... (also valid)

Different s values → Different signature → Different TXID
```

---

## Current Status

### SegWit Adoption

As of 2024:
- **~80% of transactions** use SegWit
- SegWit transactions are not malleable
- Legacy transactions still technically malleable (rarely exploited)

### Best Practices

1. **Use SegWit addresses**: Automatically protected
2. **Use Taproot addresses**: Also protected, better privacy
3. **Avoid legacy addresses**: Still vulnerable (though rarely exploited)

---

## Related Topics

- [SegWit](/docs/bitcoin/segwit) - The fix for malleability
- [Transaction Lifecycle](/docs/bitcoin/transaction-lifecycle) - Transaction states
- [Lightning Network](/docs/lightning) - Requires malleability fix

---

## Resources

- [BIP 141: Segregated Witness](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki)
- [Transaction Malleability](https://en.bitcoin.it/wiki/Transaction_Malleability)

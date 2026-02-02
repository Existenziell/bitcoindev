# Bitcoin Script

Bitcoin Script is a programming language that defines **how bitcoin can be spent**. Every transaction output contains a **locking script** that sets the spending conditions. To spend that output, you must provide an **unlocking script** that satisfies those conditions.

| Term | Also Called | Purpose |
|------|-------------|---------|
| **Locking Script** | scriptPubKey, output script | Defines *who* can spend and *under what conditions* |
| **Unlocking Script** | scriptSig, input script, witness | Provides proof that spending conditions are met |

---

## How Does It Work?

When you spend bitcoin, the network executes both scripts together:

1. **Unlocking script runs first** (pushes signatures, keys, or other data onto the stack)
2. **Locking script runs second** (verifies the data satisfies the conditions)
3. **If the stack ends with `1` (true)**, the spend is valid

```text
[Unlocking script runs] --> [Locking script runs] --> [Stack ends with 1 = valid]
```

Scripts execute on a stack (LIFO). They are intentionally not Turing-complete: no loops means every script terminates, preventing denial-of-service attacks. Fewer features also means fewer vulnerabilities. Build and run scripts in [Stack Lab](/stack-lab).

---

## When Do Scripts Execute?

Scripts execute **when spending**, not when receiving. The locking script is stored with the output when bitcoin is sent. It only runs when someone later tries to spend that output.

---

## Script Types

Bitcoin Script has evolved over time, introducing new output types (address formats) that improve security, privacy, and efficiency. Each script type represents a different way to lock and unlock bitcoin.

| Script Type | Full Name | Introduced | Block | BIP | Encoding | Prefix | Key Feature |
|-------------|-----------|------------|-------|-----|----------|--------|-------------|
| **P2PK** | Pay&#8209;to&#8209;Pubkey | Jan 2009 | 0 | - | - | - | Earliest type. Locks directly to public key. No address format (raw pubkey in script). Rarely used today. |
| **P2PKH** | Pay&#8209;to&#8209;Pubkey&#8209;Hash | Jan 2009 | 0 | - | Base58 | `1` | Original address type. Locks to hash of public key. More private than P2PK. |
| **P2MS** | Pay&#8209;to&#8209;Multisig | Jan 2009 | 0 | - | - | - | Bare multisig (m-of-n). No address format. Limited to 3 keys for standardness. Superseded by P2SH. |
| **P2SH** | Pay&#8209;to&#8209;Script&#8209;Hash | Apr 2012 | 173,805 | [16](https://github.com/bitcoin/bips/blob/master/bip-0016.mediawiki) | Base58 | `3` | Complex scripts (multisig, timelocks) as hash. Script revealed only when spending. |
| **P2SH&#8209;P2WPKH** | Nested&#8209;SegWit | Aug 2017 | 481,824 | [141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki) | Base58 | `3` | P2WPKH wrapped in P2SH for backwards compatibility. Works with older wallets. |
| **P2SH&#8209;P2WSH** | Nested&#8209;SegWit&#8209;Script | Aug 2017 | 481,824 | [141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki) | Base58 | `3` | P2WSH wrapped in P2SH. Complex scripts with SegWit benefits, backwards compatible. |
| **P2WPKH** | Pay&#8209;to&#8209;Witness&#8209;Pubkey&#8209;Hash | Aug 2017 | 481,824 | [141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki) | Bech32 | `bc1q` | Native SegWit. Lower fees, fixes malleability. |
| **P2WSH** | Pay&#8209;to&#8209;Witness&#8209;Script&#8209;Hash | Aug 2017 | 481,824 | [141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki) | Bech32 | `bc1q` | Native SegWit for complex scripts. Used for multisig, timelocks with witness benefits. |
| **P2TR** | Pay&#8209;to&#8209;Taproot | Nov 2021 | 709,632 | [341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki) | Bech32m | `bc1p` | Taproot with Schnorr signatures and MAST. Best privacy and efficiency. |

**Example addresses:**
- P2PKH: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` (Satoshi's address)
- P2SH / P2SH-P2WPKH: `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy`
- P2WPKH: `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`
- P2TR: `bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297`

**Note:** P2PK and P2MS have no address format; they use raw scripts. OP_RETURN outputs are unspendable and used for data embedding (max [~80 bytes](/docs/controversies/op-return)).

---

## Script Execution Examples

Each script type has its own execution flow. The unlocking script runs first, then the locking script.

### P2PK (Pay-to-Pubkey)

The simplest script: locks directly to a public key.

| Component | Script |
|-----------|--------|
| **Locking** | `<pubkey> OP_CHECKSIG` |
| **Unlocking** | `<signature>` |

| Step | Operation | Stack |
|------|-----------|-------|
| 1 | Push `<signature>` | `[sig]` |
| 2 | Push `<pubkey>` | `[sig, pubkey]` |
| 3 | `OP_CHECKSIG` | `[1]` ✅ |

<div class="divider-subtle"></div>

### P2PKH (Pay-to-Pubkey-Hash)

Most common legacy type. Hides the public key until spending.

| Component | Script |
|-----------|--------|
| **Locking** | `OP_DUP OP_HASH160 <pubkeyhash> OP_EQUALVERIFY OP_CHECKSIG` |
| **Unlocking** | `<signature> <publickey>` |

| Step | Operation | Stack |
|------|-----------|-------|
| 1 | Push `<signature>` | `[sig]` |
| 2 | Push `<publickey>` | `[sig, pubkey]` |
| 3 | `OP_DUP` | `[sig, pubkey, pubkey]` |
| 4 | `OP_HASH160` | `[sig, pubkey, hash160(pubkey)]` |
| 5 | Push `<pubkeyhash>` | `[sig, pubkey, hash160(pubkey), pubkeyhash]` |
| 6 | `OP_EQUALVERIFY` | `[sig, pubkey]` *(fails if hashes ≠)* |
| 7 | `OP_CHECKSIG` | `[1]` ✅ |

You can compute HASH160 and HASH256 in the [Hash tool](/tools/hash).

<div class="divider-subtle"></div>

### P2MS (Bare Multisig)

Requires m-of-n signatures. Example: 2-of-3.

| Component | Script |
|-----------|--------|
| **Locking** | `OP_2 <pubkey1> <pubkey2> <pubkey3> OP_3 OP_CHECKMULTISIG` |
| **Unlocking** | `OP_0 <sig1> <sig2>` |

| Step | Operation | Stack |
|------|-----------|-------|
| 1 | Push `OP_0` (dummy) | `[0]` |
| 2 | Push `<sig1>` | `[0, sig1]` |
| 3 | Push `<sig2>` | `[0, sig1, sig2]` |
| 4 | Push `OP_2` | `[0, sig1, sig2, 2]` |
| 5 | Push pubkeys | `[0, sig1, sig2, 2, pk1, pk2, pk3]` |
| 6 | Push `OP_3` | `[0, sig1, sig2, 2, pk1, pk2, pk3, 3]` |
| 7 | `OP_CHECKMULTISIG` | `[1]` ✅ *(verifies 2 valid sigs from 3 keys)* |

**Note:** `OP_0` is required due to an off-by-one bug in the original implementation.

<div class="divider-subtle"></div>

### P2SH (Pay-to-Script-Hash)

Hides complex scripts behind a hash. Example wrapping a 2-of-3 multisig:

| Component | Script |
|-----------|--------|
| **Locking** | `OP_HASH160 <scripthash> OP_EQUAL` |
| **Unlocking** | `OP_0 <sig1> <sig2> <redeemScript>` |

| Step | Operation | Stack |
|------|-----------|-------|
| 1 | Push sigs + redeemScript | `[0, sig1, sig2, redeemScript]` |
| 2 | `OP_HASH160` | `[0, sig1, sig2, hash160(redeemScript)]` |
| 3 | Push `<scripthash>` | `[0, sig1, sig2, hash160(redeemScript), scripthash]` |
| 4 | `OP_EQUAL` | `[0, sig1, sig2, 1]` *(if hashes match)* |
| 5 | *Execute redeemScript* | `[1]` ✅ *(multisig verification)* |

<div class="divider-subtle"></div>

### P2WPKH (Native SegWit)

Like P2PKH but witness data is separate. Smaller, cheaper.

| Component | Script |
|-----------|--------|
| **Locking** | `OP_0 <20-byte-pubkeyhash>` |
| **Witness** | `<signature> <publickey>` |

Execution is similar to P2PKH, but signature/pubkey are in the witness (not scriptSig), so they don't count toward the base transaction size.

<div class="divider-subtle"></div>

### P2WSH (Native SegWit Script)

Like P2SH but with witness. Example: 2-of-3 multisig.

| Component | Script |
|-----------|--------|
| **Locking** | `OP_0 <32-byte-scripthash>` |
| **Witness** | `OP_0 <sig1> <sig2> <witnessScript>` |

The witness script is hashed with SHA256 (not HASH160) and verified, then executed.

<div class="divider-subtle"></div>

### P2TR (Taproot)

Two spending paths: key path (single sig) or script path (MAST).

| Component | Script |
|-----------|--------|
| **Locking** | `OP_1 <32-byte-tweaked-pubkey>` |
| **Witness (key path)** | `<schnorr-signature>` |

**Key path:** Just provide a Schnorr signature. Looks identical to single-sig regardless of hidden scripts.

**Script path:** Reveal the script and Merkle proof. Complex conditions stay hidden unless used.

---

## Locking Mechanisms

Bitcoin Script supports various ways to lock funds with different spending conditions.

| Lock Type | Opcode | Use Cases | Script Pattern |
|-----------|--------|-----------|----------------|
| **Time Lock (Absolute)** | `OP_CHECKLOCKTIMEVERIFY` | Escrow, inheritance, vesting | `<time> OP_CLTV OP_DROP <pubkey> OP_CHECKSIG` |
| **Time Lock (Relative)** | `OP_CHECKSEQUENCEVERIFY` | Payment channels, delayed spending | `<blocks> OP_CSV OP_DROP <pubkey> OP_CHECKSIG` |
| **Multi-Signature** | `OP_CHECKMULTISIG` | Shared custody, corporate wallets | `OP_2 <pk1> <pk2> <pk3> OP_3 OP_CHECKMULTISIG` |
| **Hash Lock** | `OP_HASH256` | Atomic swaps, HTLCs | `OP_HASH256 <hash> OP_EQUALVERIFY <pubkey> OP_CHECKSIG` |
| **Conditional** | `OP_IF/OP_ELSE` | Multiple spending paths, refunds | `OP_IF <path1> OP_ELSE <path2> OP_ENDIF` |
| **Data Embed** | `OP_RETURN` | Data storage, coin burning | `OP_RETURN <data>` |

### Combined Locks

Locks can be combined for complex conditions. Example: time-locked multisig with escape clause:

```
OP_IF
  <locktime> OP_CHECKLOCKTIMEVERIFY OP_DROP
  OP_2 <pubkey1> <pubkey2> <pubkey3> OP_3 OP_CHECKMULTISIG
OP_ELSE
  <pubkey4> OP_CHECKSIG
OP_ENDIF
```


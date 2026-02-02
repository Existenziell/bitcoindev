# Covenants

**Covenants** are a *proposed* type of [Bitcoin Script](/docs/bitcoin/script) constraint that would restrict how [outputs](/docs/glossary#output) from a [transaction](/docs/bitcoin/transaction-lifecycle) can be spent in **future** transactions. Unlike today’s scripts, which only define “who can spend and under what conditions,” covenants would allow “this [UTXO](/docs/glossary#utxo) may only be spent in a transaction that looks like X” (e.g., only to certain [address](/docs/glossary#address) types, or only after passing through a timelocked recovery path).

No covenant opcodes are in [consensus](/docs/glossary#consensus) today. This page describes the design space and main proposals. A **covenant** restricts the *shape* or *destination* of the transaction that spends an [output](/docs/glossary#output):

- **Shape**: e.g., “the spending transaction must have exactly N outputs” or “the first output must be to this script.”
- **Destination**: e.g., “outputs may only go to [addresses](/docs/wallets/address-types) of type P2WPKH” or “only to this prespecified [script](/docs/bitcoin/script).”
- **Recursion**: Some designs allow outputs that are *again* covenant-constrained, creating multi-step flows (vaults, [Lightning](/docs/lightning)-like channels, etc.).

Covenants enable:

- **Vaults**: Funds can only move to a “cooling-off” or recovery [script](/docs/bitcoin/script) first; direct spending is disallowed.
- **Layered security**: e.g., “can only be sent to a 2-of-3 [multisig](/docs/wallets/multisig) or to a timelocked recovery path.”
- **L2 and protocols**: Channel factories, [Lightning](/docs/lightning)-style constructs, and other protocols could use covenants to enforce on-chain structure.

---

## Main Proposals

### OP_CAT (and similar)

**OP_CAT** (concatenate two values on the stack) was disabled in early Bitcoin. Re-enabling it (or adding a constrained variant) could, in combination with [hashing](/docs/bitcoin/cryptography) and equality checks, allow [scripts](/docs/bitcoin/script) to inspect and constrain parts of the *spending* transaction (e.g., by [sighash](/docs/glossary#sighash) or by committing to a hash of allowed shapes). OP_CAT is very general; the main concern is that it might enable scripts that are complex, hard to analyze, or that risk [consensus](/docs/glossary#consensus) or performance issues. Proposals often restrict what can be concatenated or how the result is used.

### OP_CTV (CheckTemplateVerify)

**OP_CTV** (or **OP_CHECKTEMPLATEVERIFY**) commits to a **hash of a specific spending transaction template**. The [script](/docs/bitcoin/script) would specify the exact [inputs](/docs/glossary#input) (by [outpoint](/docs/glossary#outpoint)) and [outputs](/docs/glossary#output) (scriptPubKey + amount) of the *only* transaction that can spend the [UTXO](/docs/glossary#utxo). This is a **one-step** covenant: the *next* spend is fully fixed; you cannot recursively chain OP_CTV in arbitrarily complex ways without further opcodes.

Use cases: vaults with a single recovery path, [Lightning](/docs/lightning) [anchor](/docs/lightning/anchor-outputs) or channel-like structures where the on-chain spend must match a known template, and congestion-control or batch-spend patterns.

- **BIP**: [BIP 119](https://github.com/bitcoin/bips/blob/master/bip-0119.mediawiki) (OP_CTV / CheckTemplateVerify)

### SIGHASH_ANYPREVOUT (APO)

**SIGHASH_ANYPREVOUT** (APO) is a [sighash](/docs/glossary#sighash) flag that would allow a [signature](/docs/bitcoin/cryptography) to be valid when the signed [input](/docs/glossary#input) comes from *any* [outpoint](/docs/glossary#outpoint) (or from a set of allowed ones), rather than a single outpoint. That makes signatures **reusable** across different [transactions](/docs/bitcoin/transaction-lifecycle) that share the same structure (e.g., same [outputs](/docs/glossary#output)), which can be used to build covenant-like behavior: the signer effectively agrees to “this spend is only valid if the rest of the tx looks like X,” and the [script](/docs/bitcoin/script) can enforce that the signer only signs such shapes.

APO is particularly relevant for [Lightning](/docs/lightning) and [channel](/docs/lightning/channels) designs: [commitment](/docs/glossary#commitment-transaction) and [HTLC](/docs/lightning/routing/htlc) transactions could use a more flexible signing model. It is also a building block for [vaults](/docs/wallets/smart-contracts) and other covenant patterns.

- **BIP / spec**: See [Bitcoin Optech](https://bitcoinops.org/) and the [bitcoin-dev](https://lists.linuxfoundation.org/mailman/listinfo/bitcoin-dev) mailing list for current APO and “APO as covenant” proposals.

### Other and Combined

Other ideas (e.g., **OP_TXHASH**, **OP_TX**, or limited forms of **OP_CAT**) aim to expose part of the spending [transaction](/docs/bitcoin/transaction-lifecycle) to [script](/docs/bitcoin/script) so it can be constrained. Some designs combine:

- **OP_CTV** for “exactly this next spend,” and
- **APO** or similar for “this signature is valid for any prevout with this structure,”

to get both one-off templates and more flexible, multi-step covenant flows.

---

## Risks and Trade-offs

- **Recursion and complexity**: Covenants that can chain arbitrarily may make [scripts](/docs/bitcoin/script) harder to reason about, audit, and fee-estimate. Proposals often limit recursion or the power of the opcode.
- **Fungibility and censorship**: Very strict covenants could create [outputs](/docs/glossary#output) that are distinguishable and easier to blacklist or to treat differently in [mempool](/docs/mining/mempool) or [mining](/docs/mining) policy.
- **Consensus and consensus risk**: New opcodes require [soft fork](/docs/glossary#soft-fork) and careful [consensus](/docs/glossary#consensus) review. The community weighs benefits (vaults, L2, etc.) against added complexity and risk.

---

## Status

| Covenant | In consensus? | Proposal |
|----------|----------------|----------|
| **OP_CTV** | No | BIP 119; discussion on [bitcoin-dev](https://lists.linuxfoundation.org/mailman/listinfo/bitcoin-dev) |
| **SIGHASH_ANYPREVOUT (APO)** | No | Active design; would enable reusable signatures and covenant-like behavior |
| **OP_CAT** | No (disabled) | Re-enable or constrained variants discussed |

As of this writing:

- **OP_CTV**: BIP 119 exists; no [soft fork](/docs/glossary#soft-fork) has been adopted. Discussion continues on [bitcoin-dev](https://lists.linuxfoundation.org/mailman/listinfo/bitcoin-dev).
- **SIGHASH_ANYPREVOUT / APO**: Active design and discussion; not yet in [consensus](/docs/glossary#consensus).
- **OP_CAT**: Re-enable or constrained variants are discussed; not in [consensus](/docs/glossary#consensus).

Implementations (e.g., [Miniscript](/docs/bitcoin-development/miniscript)) and higher-level tools may add *draft* support for CTV or APO so that, if one of these is adopted, wallets and [smart contracts](/docs/wallets/smart-contracts) can use them quickly.

---

## Related Topics

- [Smart Contracts](/docs/wallets/smart-contracts) - Covenant-like patterns and Miniscript
- [Miniscript](/docs/bitcoin-development/miniscript) - Policy and script; future covenant targets
- [Sighash Types](/docs/bitcoin/sighash-types) - How signing commits to transaction parts; APO extends this
- [Lightning](/docs/lightning) - Potential use of covenants / APO
- [Governance](/docs/advanced/governance) - How opcodes and soft forks are proposed and adopted

---

## Resources

- [BIP 119: CheckTemplateVerify (OP_CTV)](https://github.com/bitcoin/bips/blob/master/bip-0119.mediawiki)
- [Bitcoin Optech: Covenants](https://bitcoinops.org/en/topics/covenants/)
- [bitcoin-dev mailing list](https://lists.linuxfoundation.org/mailman/listinfo/bitcoin-dev) - Covenant and APO discussion

# Trust Model

Bitcoin's trust model differs fundamentally from traditional finance. Instead of trusting intermediaries (banks, payment processors, governments), Bitcoin uses cryptographic proof and economic incentives to create a **trustless** system: minimal trust, not zero trust.

## Traditional vs Bitcoin Trust

| Aspect | Traditional System | Bitcoin |
|--------|-------------------|---------|
| **Who to trust** | Banks, payment processors, governments | The protocol and cryptography |
| **Single points of failure** | Bank/processor/government failure | None (distributed network) |
| **Censorship** | Accounts can be frozen, transactions blocked | Resistant (no central authority) |
| **Reversibility** | Chargebacks, reversals possible | Final after confirmation |
| **Privacy** | Intermediaries see all transactions | Pseudonymous, no identity required |

---

## What "Trustless" Really Means

You trust **mathematics and code** rather than **people and institutions**. This principle comes directly from [cypherpunk philosophy](/docs/fundamentals/cypherpunk-philosophy), which advocates for "trust code, not people":

- **Cryptographic proof:** Digital signatures prove ownership; hash functions secure the blockchain
- **Economic incentives:** Miners profit from honest behavior; attacks are prohibitively expensive
- **Open verification:** Anyone can run a node and independently verify every transaction

---

## Trust Assumptions

### What You Must Trust

- **Protocol correctness:** Bitcoin works as designed
- **Cryptography:** SHA-256, ECDSA remain secure
- **Network honesty:** Majority of hash rate follows the rules
- **Your own security:** You protect your private keys

### What You Don't Need to Trust

Banks, payment processors, governments, other users, miners (economically incentivized), or developers (code is open-source and auditable).

#### The Immaculate Conception: Why Satoshi's Anonymity Matters

Bitcoin's creator, [Satoshi Nakamoto](/docs/history/people#satoshi-nakamoto), remains anonymous and disappeared from the project in 2010. This is not a bug; it's a feature. The "immaculate conception" refers to the idea that **not knowing who created Bitcoin is actually beneficial** for the network's trust model.

**Why anonymity strengthens Bitcoin:**

- **No founder worship:** There's no charismatic leader to follow blindly or whose opinions carry undue weight. Decisions are made through consensus and code, not authority.
- **No single point of attack:** Governments or adversaries can't target, coerce, or influence the creator to change Bitcoin's rules or shut it down.
- **No special privileges:** Satoshi cannot return to claim special rights, reverse transactions, or modify the protocol. The code speaks for itself.
- **True decentralization:** With no known founder, Bitcoin truly belongs to no one and everyone. The protocol stands on its own merits, not the reputation of its creator.
- **Focus on the code:** Attention stays on Bitcoin's technical properties and economic incentives, not on the personality or intentions of its creator.

Satoshi's disappearance was the ultimate act of decentralization: they created the system, proved it worked, and then removed themselves from the equation entirely. Bitcoin doesn't need its creator; it only needs the protocol, the network, and the mathematics that make it work.

---

## Trust Minimization Techniques

**Run a full node:** Verify all transactions yourself instead of trusting others.

**Use open-source software:** Code is publicly auditable with no hidden functionality.

**Self-custody:** Control your own private keys; no third-party can freeze or seize your funds. "Not your keys, not your coins" means that when an exchange or custodian holds your keys, they control your bitcoin. Self-custody shifts responsibility (and risk) to you. See wallets for more.

---

## Trust vs Convenience Spectrum

| Approach | Trust Level | Trade-off |
|----------|-------------|-----------|
| **Full node + self-custody** | Minimal | Maximum security; requires technical knowledge and resources |
| **Light wallet** | Medium | Mobile-friendly, fast setup; trusts full nodes for verification |
| **Custodial wallet/exchange** | High | Easy to use, password recovery; you trust the custodian completely |

Bitcoin's philosophy: prefer trust minimization, accept inconvenience for security, verify rather than trust.

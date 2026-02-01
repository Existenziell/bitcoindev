# Beginner Questions

The questions we all had at the start... A portal down the Bitcoin rabbit hole. We've all been there.
If you already know the basics, feel free to proceed directly to:
- [Problems Bitcoin Solved](/docs/fundamentals/problems)
- [Bitcoin Protocol](/docs/bitcoin)
- [Bitcoin Development](/docs/bitcoin-development)

---

## What is Bitcoin?

Bitcoin is a decentralized digital currency and payment system that operates without a central authority. For a fuller introduction, see [Bitcoin Fundamentals](/docs/fundamentals).

---

## Who created Bitcoin and why?

Bitcoin was created by a person or group using the pseudonym [Satoshi Nakamoto](/docs/history/people#satoshi-nakamoto), who published the [whitepaper](/whitepaper) in 2008 and launched the network in 2009. The "why" is rooted in [cypherpunk philosophy](/docs/fundamentals/cypherpunk-philosophy) and the problems Bitcoin was designed to solve: [Problems Bitcoin Solved](/docs/fundamentals/problems).

---

## Are there physical Bitcoins?

No. Bitcoin is purely digital. There is no official coin or bill; "physical" Bitcoin collectibles are just novelty items that may represent a claim to bitcoin stored elsewhere. The actual units exist only as entries on the [blockchain](/docs/fundamentals/blockchain). See [Denominations](/docs/fundamentals/denominations) for how bitcoin is measured (satoshis, BTC, etc.).

---

## What does "digital gold" mean?

"Digital gold" is a shorthand for Bitcoin's role as a scarce, durable store of value (similar to gold) but digital and easy to move. Bitcoin shares key [monetary properties](/docs/fundamentals/monetary-properties) with gold: scarcity, durability, divisibility, and verifiability, without needing a central issuer.

---

## Where do bitcoins come from? How are new ones created?

New bitcoin is created by [mining](/docs/mining): miners run hardware that secures the network and, in return, receive newly created bitcoin in each block (the [block subsidy](/docs/bitcoin/subsidy)) plus transaction fees. That new bitcoin is paid out via the [coinbase transaction](/docs/bitcoin/coinbase-transaction) in every block. There is no central printer or issuer, issuance is fixed by the protocol.

---

## Why is there a limit of 21 million Bitcoins?

The 21 million cap is built into Bitcoin's [monetary design](/docs/fundamentals/monetary-properties): it creates predictable scarcity. The exact schedule comes from the [block subsidy](/docs/bitcoin/subsidy), which [halves](/docs/history/halvings) every 210,000 blocks until no new bitcoin is created (around 2140).

---

## What gives Bitcoin its value?

Bitcoin derives value from the same kinds of factors as other money: scarcity, acceptability, and usefulness as a medium of exchange and store of value. Its [monetary properties](/docs/fundamentals/monetary-properties) (fixed supply, verifiability, censorship resistance) and the [trust model](/docs/fundamentals/trust-model) (you can verify the rules yourself) support that. Value is set by the market, not by a central authority.

---

## What is the blockchain?

The blockchain is Bitcoin's core data structure: a chain of [blocks](/docs/fundamentals/blockchain) linked by hashes, forming an immutable, verifiable record of transactions. Bitcoin is also often described as a [timechain](/docs/fundamentals/timechain), a decentralized way to order events in time.

---

## What is mining?

[Mining](/docs/mining) is the process of securing the Bitcoin network and adding new blocks. Miners compete to solve a [proof-of-work](/docs/mining/proof-of-work) puzzle; the winner adds the next block and earns the block subsidy plus fees.

---

## Why is it called proof of work?

Because miners must demonstrate real computational work (solving a hard puzzle) to propose a valid block. That [proof-of-work](/docs/mining/proof-of-work) makes attacking the chain costly and keeps the network secure without a central authority.

---

## What does "HODL" mean?

"HODL" is slang for holding bitcoin through volatility instead of selling. It comes from a famous 2013 typo ("I AM HODLING"). See the [glossary entry](/docs/glossary#hodl).

---

## What is a wallet?

A [wallet](/docs/wallets) is software or hardware that lets you receive, store, and spend bitcoin. It manages your [keys](/docs/bitcoin-development/keys) and constructs transactions; it doesn't "hold" bitcoin itself—the bitcoin lives on the blockchain, and the keys prove ownership.

---

## Does my wallet hold Bitcoin?

Not really. Your wallet holds your [keys](/docs/bitcoin-development/keys)—the secrets that prove you can spend the bitcoin sent to your addresses. The actual bitcoin (the unspent outputs) lives on the [blockchain](/docs/fundamentals/blockchain); your wallet just lets you sign transactions to move it. See [Wallet Development](/docs/wallets) and [Key Management](/docs/bitcoin-development/keys) for how it works.

---

## Is Bitcoin anonymous?

Bitcoin is **pseudonymous**: addresses don't have to be tied to real-world identity, but all transactions are public on the blockchain. So it's not fully anonymous by default. See the [trust model](/docs/fundamentals/trust-model) and [privacy techniques](/docs/wallets/privacy) for how privacy works in practice.

---

## Can Bitcoin be hacked?

The Bitcoin **protocol** has never been hacked: the rules are enforced by [decentralization](/docs/fundamentals/decentralization) and [proof-of-work](/docs/mining/proof-of-work). What can be compromised are services (exchanges, custodians) or your own keys. See [Network Attacks](/docs/mining/network-attacks) for how the network is secured.

---

## Why does Bitcoin use so much energy?

Mining uses energy to run the [proof-of-work](/docs/mining/proof-of-work) that secures the network. How much, and whether that's justified, is debated. For the technical and ethical discussion, see [Energy Consumption](/docs/controversies/energy-consumption) and [Mining](/docs/mining).

---

## What's the difference between Bitcoin (BTC) and Bitcoin Cash (BCH)?

Bitcoin Cash (BCH) is a **separate network and asset** that split from Bitcoin in a [hard fork](/docs/history/forks) in 2017. It changed consensus rules (e.g., larger block size). BTC is the original chain; BCH is not "the real Bitcoin" or a layer on top of it. It's a different chain with its own rules and token.

---

## How is Bitcoin different than "crypto"?

"Crypto" usually means thousands of different projects, many with central teams, different goals, and different security models. Bitcoin is a single protocol focused on decentralized, sound money, with no central issuer and strong [decentralization](/docs/fundamentals/decentralization). It was designed to solve specific [problems](/docs/fundamentals/problems); many other "crypto" projects target different use cases or trade-offs.

---

## I hear about "Web3" and "DeFi", is that the same as Bitcoin?

No. Bitcoin is a protocol for peer-to-peer digital money with a fixed supply and decentralized consensus. "Web3" and "DeFi" typically refer to applications and ecosystems built on other chains (e.g., smart-contract platforms) with different rules and risks. Bitcoin can be used as an asset within some of those systems, but the Bitcoin network itself is separate. For more on Bitcoin's scope, see [Bitcoin Fundamentals](/docs/fundamentals).

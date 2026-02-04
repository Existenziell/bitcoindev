# Bitcoin Core Internals

Bitcoin Core is the reference implementation of Bitcoin. Understanding its internal architecture helps developers contribute to Bitcoin Core, build compatible software, and debug issues.

## Architecture Overview

### Core Components

```text
Bitcoin Core:
├── Consensus Engine
│   ├── Validation
│   ├── Block processing
│   └── Chain state
├── Network Layer
│   ├── P2P protocol
│   ├── Peer management
│   └── Message handling
├── Wallet System
│   ├── Key management
│   ├── Transaction creation
│   └── UTXO tracking
└── RPC Interface
    ├── JSON-RPC API
    ├── REST API
    ├── Command handling
    └── Response formatting
```

### Main Runtime Components

At runtime, the node coordinates several major components (names may differ across versions):

| Component | Role |
|-----------|------|
| **ChainstateManager** | Manages one or two chainstates (e.g. normal IBD and optional [AssumeUTXO](/docs/development/node-types#assumeutxo-faster-initial-sync) snapshot). Interface for activating and validating the best chain. |
| **BlockManager** | Keeps the tree of blocks on disk (via LevelDB index), resolves the most-work tip, and manages `blk*.dat` and `rev*.dat` files. |
| **CTxMemPool** | Validates and stores unconfirmed [transactions](/docs/bitcoin/transaction-lifecycle) that may be included in the next [block](/docs/bitcoin/blocks). Applies fee-based prioritization and eviction. |
| **PeerManager** | Handles [P2P](/docs/bitcoin/p2p-protocol) message processing, block and transaction fetch, and peer behavior (disconnect, misbehaviour). |
| **CConnman** | Manages network connections: opening sockets, sending/receiving bytes, and coordinating net threads. |
| **AddrMan** | Stores and serves peers’ network addresses (from DNS seeds, peers, and config). |
| **Interfaces::Chain** | Abstraction used by wallet and other clients to read chain state, submit transactions, get fee estimates, and receive notifications. Enables [multiprocess](https://github.com/bitcoin/bitcoin/blob/master/doc/design/multiprocess.md) (node, wallet, GUI in separate processes). |

---

## Key Subsystems

### 1. Consensus Engine

Validates transactions and blocks:

```text
Responsibilities:
- Verify transaction validity
- Check block validity
- Maintain chain state
- Enforce consensus rules
```

### 2. UTXO Set

Tracks unspent transaction outputs:

```text
Structure:
- Database: LevelDB
- Index: Transaction outputs
- Updates: On each block
- Size: ~5-10GB
```

### 3. Mempool

Manages unconfirmed transactions:

```text
Features:
- Transaction storage
- Fee-based prioritization
- Eviction policies
- Size limits
```

### 4. Block Storage

Stores blockchain data:

```text
Formats:
- blk*.dat: Raw block data
- rev*.dat: Undo data
- Chainstate: UTXO set
```

---

## Threading Model

Bitcoin Core is multi-threaded. The main `bitcoind` thread starts and shuts down the process and spawns worker threads. Key groups:

**Main and init**

- **Main (`bitcoind`)**: Startup, shutdown, and spawning other threads.
- **Init/load (`b-initload`)**: Block import, reindex, loading mempool, and starting optional indexers (without blocking node startup).

**Validation and RPC**

- **Script check (`b-scriptch.x`)**: Parallel threads that verify [Script](/docs/bitcoin/script) in block transactions.
- **HTTP (`b-http`, `b-httpworker.x`)**: Listens for and serves [JSON-RPC](/docs/bitcoin/rpc) and [REST](https://github.com/bitcoin/bitcoin/blob/master/doc/REST-interface.md) requests.
- **Indexers (`b-txindex`, etc.)**: One thread per optional index (txindex, blockfilterindex, coinstatsindex) for background syncing.
- **Scheduler (`b-scheduler`)**: Background tasks (e.g. dumping wallet, addrman, validation callbacks).

**Network**

- **Message handler (`b-msghand`)**: Most P2P and validation logic (sending/receiving messages, block/tx handling).
- **Socket handler (`b-net`)**: Sends and receives raw bytes on the P2P port (default 8333).
- **Connections (`b-opencon`, `b-addcon`)**: Opens new outbound connections and connections to added nodes.
- **DNS seed (`b-dnsseed`)**: Fetches peer addresses from DNS seeds.
- **I2P (`b-i2paccept`)**: Accepts incoming I2P connections when I2P is enabled.

Understanding these threads helps when debugging, profiling, or contributing to [Bitcoin Core](https://github.com/bitcoin/bitcoin). The [developer notes](https://github.com/bitcoin/bitcoin/blob/master/doc/developer-notes.md#threads) and [Bitcoin Core Academy](https://bitcoincore.academy/threads.html) describe them in more detail.

---

## Database Systems

### LevelDB

Used for:

- **Chainstate** (`chainstate/`): UTXO set and related metadata.
- **Block index** (`blocks/index/`): Block metadata and header tree (most-work chain, orphans). Not affected by `-blocksdir`.
- **Wallets** (`wallets/`): Each wallet is a SQLite DB; the chainstate is in LevelDB, wallet logic uses both.
- **Optional indexes** (in `indexes/`, created only if enabled):
  - **txindex** (`-txindex=1`): Look up transactions by txid.
  - **blockfilterindex=basic**: [BIP 158](https://github.com/bitcoin/bips/blob/master/bip-0158.mediawiki) compact block filters for [light clients](/docs/development/node-types#spv-simplified-payment-verification-nodes).
  - **coinstatsindex** (`-coinstatsindex=1`): Aggregated coin statistics used by `gettxoutsetinfo` and similar.

### Flat Files

Used for:

- **Blocks** (`blocks/blk*.dat`): Raw block data in network format (128 MiB per file).
- **Undo** (`blocks/rev*.dat`): Block undo data for reorganisations.

### Data Directory Layout

The data directory (default: `~/.bitcoin` on Linux, `~/Library/Application Support/Bitcoin` on macOS, `%LOCALAPPDATA%\Bitcoin` on Windows) is chain-specific. For [testnet](/docs/development/testnets), [signet](/docs/development/testnets#signet), or [regtest](/docs/development/testnets#regtest), subdirs `testnet3/`, `signet/`, or `regtest/` are used.

Besides `blocks/`, `chainstate/`, and `indexes/`, important files include:

- `peers.dat`: Peer address database.
- `mempool.dat`: Mempool dump (optional, on shutdown).
- `banlist.json`: Banned peers.
- `debug.log`: Log output (configurable).
- `bitcoin.conf`: User configuration (must be created manually).

See the [Bitcoin Core files documentation](https://github.com/bitcoin/bitcoin/blob/master/doc/files.md) for the full layout, wallet structure, and installed binaries.

---

## Binaries and Libraries

Bitcoin Core builds several executables:

| Binary | Purpose |
|--------|---------|
| **bitcoind** | Headless node and built-in wallet. |
| **bitcoin-qt** | Node and wallet with GUI. |
| **bitcoin-cli** | [RPC](/docs/bitcoin/rpc) client (calls `bitcoind` or `bitcoin-qt`). |
| **bitcoin-wallet** | Standalone wallet tool (create, upgrade, migrate descriptors). |
| **bitcoin-tx** | Create and modify raw transactions. |
| **bitcoin-util** | Utilities (e.g. chainstate, hashing). |

The consensus and validation logic can be built as **libbitcoinkernel** (shared library), so other software can link against it without running a full node process. The [multiprocess design](https://github.com/bitcoin/bitcoin/blob/master/doc/design/multiprocess.md) allows `bitcoin-node`, `bitcoin-wallet`, and `bitcoin-gui` to run in separate processes communicating over IPC, improving isolation and enabling use cases like running the GUI without a local node.

---

## Code Structure

### Key Directories

```text
src/
├── consensus/     - Consensus rules and params
├── kernel/        - Libbitcoinkernel (consensus + validation core)
├── node/          - Node logic (chain, mempool, init)
├── net_processing/- P2P message handling and peer logic
├── net/           - Network connections and transport
├── wallet/        - Wallet logic
├── rpc/           - JSON-RPC and REST
├── script/        - Script execution
├── validation/    - Block and transaction validation
└── interfaces/    - Abstract interfaces (Chain, Node, Wallet) for multiprocess and testing
```

The layout evolves; see the [repository](https://github.com/bitcoin/bitcoin) and [Bitcoin Core Academy – Source organization](https://bitcoincore.academy/source-organization.html) for up-to-date structure.

---

## Related Topics

- [Node Types](/docs/development/node-types) - Different node configurations
- [RPC Commands](/docs/bitcoin/rpc) - JSON-RPC API
- [P2P Network Protocol](/docs/bitcoin/p2p-protocol) - Network communication
- [Installing Bitcoin](/docs/development/install-bitcoin) - Build and run Bitcoin Core

---

## Resources

- [Bitcoin Core GitHub](https://github.com/bitcoin/bitcoin)
- [Bitcoin Core doc/](https://github.com/bitcoin/bitcoin/tree/master/doc) – Developer notes, [files.md](https://github.com/bitcoin/bitcoin/blob/master/doc/files.md) (data directory), [REST](https://github.com/bitcoin/bitcoin/blob/master/doc/REST-interface.md), [multiprocess](https://github.com/bitcoin/bitcoin/blob/master/doc/design/multiprocess.md), [assumeutxo](https://github.com/bitcoin/bitcoin/blob/master/doc/design/assumeutxo.md)
- [Bitcoin Core Academy](https://bitcoincore.academy/) – Architecture, components, threads, source organization
- [Doxygen (doxygen.bitcoincore.org)](https://doxygen.bitcoincore.org/) – Code reference

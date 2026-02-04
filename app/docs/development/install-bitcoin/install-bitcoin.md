# Installing Bitcoin

Bitcoin Core is the reference implementation of the Bitcoin protocol. Understanding how to install and run it is fundamental for development, running a full node, or participating in the network.

## Historical Context: The Original Bitcoin Client

The original Bitcoin software released by Satoshi Nakamoto in January 2009 was a single monolithic application that bundled three distinct functions:

1. **Full Node** - Validating and relaying transactions and blocks
2. **Wallet** - Managing keys, addresses, and creating transactions
3. **Miner** - Using CPU to find valid blocks

This made sense for the early network when anyone could profitably mine with a regular computer, and the software needed to be accessible to newcomers. Running the client automatically made you a miner, a node operator, and gave you a wallet to receive block rewards.

### The Separation of Concerns

As Bitcoin matured, these functions became increasingly specialized:

**Mining** evolved from CPU → GPU → FPGA → ASIC, making the built-in miner obsolete for anything other than testnet or regtest. Dedicated mining software like cgminer and modern pool protocols emerged to handle specialized hardware.

**Wallets** diversified into hardware wallets, mobile wallets, and specialized desktop applications with better UX than the built-in wallet. Many users prefer lightweight wallets that don't require running a full node.

**Full nodes** became the focus of Bitcoin Core development, emphasizing security, validation, and network participation over end-user features.

> Bitcoin Core still includes wallet functionality (optional since v0.21.0) but removed the graphical miner long ago. The `generatetoaddress` RPC command remains for regtest mining.

---

## Installation Methods

### Method 1: Download Pre-built Binaries (Recommended)

Download the latest release from [bitcoincore.org](https://bitcoincore.org/en/download/):

```bash
# Example for Linux x86_64 (check for latest version)
wget https://bitcoincore.org/bin/bitcoin-core-27.0/bitcoin-27.0-x86_64-linux-gnu.tar.gz
tar -xzf bitcoin-27.0-x86_64-linux-gnu.tar.gz
sudo install -m 0755 -o root -g root -t /usr/local/bin bitcoin-27.0/bin/*
```

**Verify the download** (important for security):

```bash
# Download signatures and verify
wget https://bitcoincore.org/bin/bitcoin-core-27.0/SHA256SUMS
wget https://bitcoincore.org/bin/bitcoin-core-27.0/SHA256SUMS.asc
sha256sum --ignore-missing --check SHA256SUMS
gpg --verify SHA256SUMS.asc SHA256SUMS
```

### Method 2: Package Managers

**macOS (Homebrew):**

```bash
brew install bitcoin
```

**Ubuntu/Debian (PPA):**

```bash
sudo add-apt-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get install bitcoind bitcoin-qt
```

**Arch Linux:**

```bash
sudo pacman -S bitcoin-qt
```

### Method 3: Build from Source

For development or when you need the latest features:

```bash
# Install dependencies (Ubuntu/Debian)
sudo apt-get install build-essential libtool autotools-dev automake pkg-config bsdmainutils python3
sudo apt-get install libevent-dev libboost-dev libsqlite3-dev

# Clone and build
git clone https://github.com/bitcoin/bitcoin.git
cd bitcoin
./autogen.sh
./configure
make -j$(nproc)
sudo make install
```

---

## Components

After installation, you have access to several executables:

| Binary | Purpose |
|--------|---------|
| `bitcoind` | Headless daemon (server mode) |
| `bitcoin-qt` | GUI application with wallet |
| `bitcoin-cli` | Command-line RPC client |
| `bitcoin-tx` | Transaction utility |
| `bitcoin-util` | Utility commands |
| `bitcoin-wallet` | Wallet utility (offline operations) |

---

## Basic Configuration

Create a configuration file at `~/.bitcoin/bitcoin.conf` (Linux/macOS) or `%APPDATA%\Bitcoin\bitcoin.conf` (Windows):

```ini
# Network (mainnet, testnet, signet, or regtest)
# testnet=1
# signet=1
# regtest=1

# Enable RPC server
server=1
rpcuser=yourusername
rpcpassword=yoursecurepassword

# Prune blockchain to save disk space (in MB)
# prune=1000

# Transaction index (required for some applications)
# txindex=1
```

---

## Running Bitcoin Core

### Start the Daemon

```bash
# Start in background
bitcoind -daemon

# Check status
bitcoin-cli getblockchaininfo
```

### Initial Block Download (IBD)

The first sync downloads and validates the entire blockchain history:

- **Size:** ~600+ GB (as of 2024)
- **Time:** Hours to days depending on hardware
- **Bandwidth:** Significant download required

**Pruned mode** reduces storage requirements:

```bash
bitcoind -prune=1000 -daemon  # Keep only 1GB of blocks
```

### Useful Commands

```bash
# Network info
bitcoin-cli getnetworkinfo

# Blockchain status
bitcoin-cli getblockchaininfo

# Mempool status
bitcoin-cli getmempoolinfo

# Stop the node
bitcoin-cli stop
```

---

## Development Setup

For Bitcoin development, use regtest mode for instant block generation:

```bash
# Start regtest node
bitcoind -regtest -daemon

# Create a wallet
bitcoin-cli -regtest createwallet "dev"

# Generate blocks (mine to your own address)
bitcoin-cli -regtest -generate 101

# Check balance
bitcoin-cli -regtest getbalance
```

See [Test Networks](/docs/development/testnets) for more on regtest, testnet, and signet.

---

## Alternative Implementations

While Bitcoin Core is the reference implementation, alternatives exist:

| Implementation | Language | Notes |
|---------------|----------|-------|
| [Bitcoin Core](https://bitcoincore.org/) | C++ | Reference implementation |
| [btcd](https://github.com/btcsuite/btcd) | Go | Full node (no wallet) |
| [Bitcoin Knots](https://bitcoinknots.org/) | C++ | Bitcoin Core fork with extra features |
| [libbitcoin](https://libbitcoin.info/) | C++ | Modular implementation |

> Running alternative implementations helps decentralize development, but ensure they maintain consensus compatibility.

---

## System Requirements

**Minimum (pruned):**
- 2 GB RAM
- 10 GB disk space
- Broadband connection

**Recommended (full node):**
- 4+ GB RAM
- 1 TB SSD
- Unmetered broadband

**For development:**
- Any modern computer works with regtest
- SSD recommended for faster sync

---

## Related Topics

- Test Networks - Development environments
- [RPC Commands](/docs/bitcoin/rpc) - Interacting with Bitcoin Core
- [Libraries & SDKs](/docs/development/libraries) - Development tools
- [Hardware Evolution](/docs/mining/hardware) - How mining separated from nodes

---

## Resources

- [Bitcoin Core Documentation](https://bitcoin.org/en/full-node)
- [Bitcoin Core GitHub](https://github.com/bitcoin/bitcoin)
- [Learning Bitcoin from the Command Line](https://github.com/BlockchainCommons/Learning-Bitcoin-from-the-Command-Line)

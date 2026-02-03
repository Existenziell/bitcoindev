# Signet & Testnet Deep Dive

Test networks are essential for Bitcoin development. Each test network serves a purpose:

- **Regtest**: Local development and unit testing
- **Signet**: Predictable integration testing
- **Testnet**: Real-world simulation before mainnet

Start with regtest for fast iteration (complete control, automated testing), move to signet for integration testing (predictable timing), and use testnet for final validation (real network conditions, edge case discovery) before deploying to mainnet.

## Network Comparison

| Feature | Mainnet | Testnet | Signet | Regtest |
|---------|---------|---------|--------|---------|
| Real Value | Yes | No | No | No |
| Block Time | ~10 min | Variable | ~10 min | Instant |
| Difficulty | Dynamic | Dynamic | Fixed | Minimal |
| Public | Yes | Yes | Yes | Local |
| Controlled | No | No | Yes | Yes |
| Best For | Production | Integration | Testing | Unit tests |

---

## Testnet (Testnet3)

### Overview

Testnet is the original Bitcoin test network. It mirrors mainnet but with worthless coins.

### Configuration

```ini
# bitcoin.conf
testnet=1
[test]
rpcuser=user
rpcpassword=password
rpcport=18332
```

### Starting Testnet

```bash
# Start testnet node
bitcoind -testnet -daemon

# Use bitcoin-cli with testnet
bitcoin-cli -testnet getblockchaininfo

# Check sync status
bitcoin-cli -testnet getblockcount
```

### Testnet Faucets

Get free testnet coins:

- [coinfaucet.eu](https://coinfaucet.eu/en/btc-testnet/)
- [testnet-faucet.com](https://testnet-faucet.com/btc-testnet/)
- [bitcoinfaucet.uo1.net](https://bitcoinfaucet.uo1.net/)

### Testnet Explorers

- [mempool.space/testnet](https://mempool.space/testnet)
- [blockstream.info/testnet](https://blockstream.info/testnet)

### Testnet Challenges

```
Issues with Testnet:
- Block times can be erratic (difficulty resets)
- Occasional "block storms" (many blocks quickly)
- May have long periods with no blocks
- Reorgs more common than mainnet
```

---

## Signet

### Overview

Signet (BIP-325) provides a more controlled test environment. Blocks are signed by specific keys, ensuring predictable block production.

### Benefits Over Testnet

- **Predictable Blocks**: Consistent ~10 minute block times
- **No Difficulty Resets**: Stable mining simulation
- **Controlled Environment**: No surprise reorgs
- **Better for Testing**: More mainnet-like behavior

### Default Signet Configuration

```ini
# bitcoin.conf
signet=1
[signet]
rpcuser=user
rpcpassword=password
rpcport=38332
```

### Starting Signet

```bash
# Start signet node
bitcoind -signet -daemon

# Check status
bitcoin-cli -signet getblockchaininfo

# Get network info
bitcoin-cli -signet getnetworkinfo
```

### Signet Faucets

- [signet.bc-2.jp](https://signet.bc-2.jp/)
- [alt.signetfaucet.com](https://alt.signetfaucet.com/)
- [signetfaucet.bublina.eu.org](https://signetfaucet.bublina.eu.org/)

### Signet Explorer

- [mempool.space/signet](https://mempool.space/signet)

### Custom Signet

You can create your own signet for private testing:

```bash
# Generate signing key
bitcoin-cli -regtest createwallet "signet_signer"
SIGNET_ADDR=$(bitcoin-cli -regtest getnewaddress)
SIGNET_PUBKEY=$(bitcoin-cli -regtest getaddressinfo $SIGNET_ADDR | jq -r '.pubkey')

# Create signet challenge script
# OP_1 <pubkey> OP_1 OP_CHECKMULTISIG
CHALLENGE="5121${SIGNET_PUBKEY}51ae"
```

```ini
# Custom signet bitcoin.conf
signet=1
signetchallenge=5121...your_challenge...51ae
[signet]
rpcport=38332
```

---

## Regtest (Regression Test)

### Overview

Regtest is a local, private blockchain perfect for development and automated testing.

### Configuration

```ini
# bitcoin.conf
regtest=1
[regtest]
rpcuser=user
rpcpassword=password
rpcport=18443
```

### Starting Regtest

```bash
# Start regtest node
bitcoind -regtest -daemon

# Create wallet
bitcoin-cli -regtest createwallet "dev"

# Generate initial coins (need 100+ blocks for maturity)
bitcoin-cli -regtest -generate 101

# Check balance
bitcoin-cli -regtest getbalance
```

### Instant Block Generation

```bash
# Generate blocks on demand
bitcoin-cli -regtest -generate 1

# Generate to specific address
bitcoin-cli -regtest generatetoaddress 1 "bcrt1q..."

# Generate multiple blocks
bitcoin-cli -regtest -generate 10
```

### Regtest for Testing

```python
import subprocess
import json
import time

class RegtestNode:
    def __init__(self, datadir=None):
        self.datadir = datadir or '/tmp/regtest'
        
    def start(self):
        subprocess.run([
            'bitcoind', '-regtest', '-daemon',
            f'-datadir={self.datadir}',
            '-rpcuser=test', '-rpcpassword=test'
        ])
        time.sleep(2)
        
    def stop(self):
        self.cli('stop')
        
    def cli(self, *args):
        result = subprocess.run(
            ['bitcoin-cli', '-regtest', 
             f'-datadir={self.datadir}',
             '-rpcuser=test', '-rpcpassword=test'] + list(args),
            capture_output=True, text=True
        )
        if result.stdout:
            try:
                return json.loads(result.stdout)
            except:
                return result.stdout.strip()
        return None
    
    def generate(self, blocks=1):
        return self.cli('-generate', str(blocks))
    
    def get_new_address(self):
        return self.cli('getnewaddress')
    
    def send(self, address, amount):
        return self.cli('sendtoaddress', address, str(amount))

# Usage
node = RegtestNode()
node.start()
node.cli('createwallet', 'test')
node.generate(101)  # Mine initial coins
addr = node.get_new_address()
txid = node.send(addr, 1.0)
node.generate(1)  # Confirm transaction
node.stop()
```

---

## Lightning Network Testing

### Polar (Recommended)

Polar provides a GUI for managing Lightning test networks.

```bash
# Download from https://lightningpolar.com/
# Create network with:
# - Bitcoin Core (regtest)
# - LND / Core Lightning / Eclair nodes
# - Automatic channel opening
```

### Manual LND Setup on Regtest

```bash
# Start Bitcoin Core regtest
bitcoind -regtest -daemon -zmqpubrawblock=tcp://127.0.0.1:28332 -zmqpubrawtx=tcp://127.0.0.1:28333

# Generate initial blocks
bitcoin-cli -regtest -generate 101

# Start LND
lnd --bitcoin.active --bitcoin.regtest \
    --bitcoin.node=bitcoind \
    --bitcoind.rpcuser=user --bitcoind.rpcpass=password \
    --bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332 \
    --bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333

# Create wallet and get address
lncli --network=regtest create
lncli --network=regtest newaddress p2wkh

# Fund the wallet (from Bitcoin Core)
bitcoin-cli -regtest sendtoaddress <lnd_address> 1
bitcoin-cli -regtest -generate 6
```

### Core Lightning on Regtest

```bash
# Start lightningd
lightningd --network=regtest \
    --bitcoin-rpcuser=user \
    --bitcoin-rpcpassword=password \
    --bitcoin-rpcport=18443

# Get new address
lightning-cli --network=regtest newaddr

# Fund and open channel
lightning-cli --network=regtest connect <node_id>@localhost:9735
lightning-cli --network=regtest fundchannel <node_id> 100000
```

---

## Automated Testing Setup

### Docker Compose Example

```yaml
# docker-compose.yml
version: '3.8'

services:
  bitcoind:
    image: ruimarinho/bitcoin-core:latest
    command:
      - -regtest
      - -rpcuser=test
      - -rpcpassword=test
      - -rpcallowip=0.0.0.0/0
      - -rpcbind=0.0.0.0
      - -zmqpubrawblock=tcp://0.0.0.0:28332
      - -zmqpubrawtx=tcp://0.0.0.0:28333
    ports:
      - "18443:18443"
      - "28332:28332"
      - "28333:28333"
    volumes:
      - bitcoin_data:/home/bitcoin/.bitcoin

  lnd:
    image: lightninglabs/lnd:latest
    depends_on:
      - bitcoind
    command:
      - --bitcoin.active
      - --bitcoin.regtest
      - --bitcoin.node=bitcoind
      - --bitcoind.rpchost=bitcoind
      - --bitcoind.rpcuser=test
      - --bitcoind.rpcpass=test
      - --bitcoind.zmqpubrawblock=tcp://bitcoind:28332
      - --bitcoind.zmqpubrawtx=tcp://bitcoind:28333
    ports:
      - "10009:10009"
    volumes:
      - lnd_data:/root/.lnd

volumes:
  bitcoin_data:
  lnd_data:
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Bitcoin Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      bitcoind:
        image: ruimarinho/bitcoin-core:latest
        options: >-
          -regtest
          -rpcuser=test
          -rpcpassword=test
          -rpcallowip=0.0.0.0/0
        ports:
          - 18443:18443
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Wait for Bitcoin Core
        run: |
          for i in {1..30}; do
            if bitcoin-cli -regtest -rpcuser=test -rpcpassword=test getblockchaininfo; then
              break
            fi
            sleep 1
          done
      
      - name: Setup test environment
        run: |
          bitcoin-cli -regtest -rpcuser=test -rpcpassword=test createwallet test
          bitcoin-cli -regtest -rpcuser=test -rpcpassword=test -generate 101
      
      - name: Run tests
        run: npm test
```

---

## Network-Specific Code

### Selecting Network

:::code-group
```rust
use bitcoin::Network;

fn get_network(network_type: &str) -> Network {
    match network_type {
        "mainnet" => Network::Bitcoin,
        "testnet" | "signet" => Network::Testnet,
        "regtest" => Network::Regtest,
        _ => panic!("Unknown network"),
    }
}
```

```python
from bitcoin import SelectParams

def select_network(network_type):
    networks = {'mainnet': 'mainnet', 'testnet': 'testnet', 'regtest': 'regtest'}
    SelectParams(networks.get(network_type, 'testnet'))
```

```cpp
#include <bitcoin/bitcoin.hpp>

bc::config::network get_network(const std::string& type) {
    if (type == "mainnet") return bc::config::network::mainnet;
    if (type == "testnet") return bc::config::network::testnet;
    return bc::config::network::regtest;
}
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/chaincfg"
)

func getNetwork(networkType string) *chaincfg.Params {
	switch networkType {
	case "mainnet":
		return &chaincfg.MainNetParams
	case "testnet":
		return &chaincfg.TestNet3Params
	case "regtest":
		return &chaincfg.RegressionNetParams
	case "signet":
		return &chaincfg.SigNetParams
	default:
		panic("Unknown network")
	}
}

func main() {
	network := getNetwork("testnet")
	fmt.Printf("Network: %s\n", network.Name)
}
```

```javascript
import * as bitcoin from 'bitcoinjs-lib';

function getNetwork(type) {
  const networks = {
    mainnet: bitcoin.networks.bitcoin,
    testnet: bitcoin.networks.testnet,
    regtest: bitcoin.networks.regtest,
  };
  return networks[type];
}
```
:::

### RPC Port Configuration

| Network | RPC Port |
|---------|----------|
| Mainnet | 8332 |
| Testnet | 18332 |
| Signet | 38332 |
| Regtest | 18443 |

---

## Testing Scenarios

### Testing RBF (Replace-By-Fee)

```bash
# On regtest
# 1. Create transaction with RBF enabled
bitcoin-cli -regtest sendtoaddress <addr> 0.1 "" "" false true  # replaceable=true

# 2. Get the txid
TXID=$(bitcoin-cli -regtest listtransactions | jq -r '.[0].txid')

# 3. Bump the fee
bitcoin-cli -regtest bumpfee $TXID

# 4. Mine block to confirm
bitcoin-cli -regtest -generate 1
```

### Testing Time Locks

```bash
# Test CLTV (absolute timelock)
# Create transaction locked until block 150
bitcoin-cli -regtest createrawtransaction \
  '[{"txid":"...", "vout":0}]' \
  '[{"<addr>": 0.1}]' \
  150  # locktime

# Won't be valid until block 150
bitcoin-cli -regtest -generate 50  # Advance to block 150+
```

### Testing Mempool Behavior

```python
def test_mempool_eviction(node):
    # Fill mempool with low-fee transactions
    low_fee_txs = []
    for i in range(100):
        addr = node.cli('getnewaddress')
        txid = node.cli('sendtoaddress', addr, '0.001', '', '', False, False, 1)  # 1 sat/vB
        low_fee_txs.append(txid)
    
    # Create high-fee transaction
    addr = node.cli('getnewaddress')
    high_fee_tx = node.cli('sendtoaddress', addr, '0.001', '', '', False, False, 100)  # 100 sat/vB
    
    # Verify high-fee tx is in mempool
    mempool = node.cli('getrawmempool')
    assert high_fee_tx in mempool
    
    # Some low-fee txs may be evicted if mempool is full
```

---

## Related Topics

- [Testing & Debugging](/docs/development/testing) - Testing strategies and techniques
- [Getting Started](/docs/development) - Development setup guide
- [RPC Commands](/docs/bitcoin/rpc) - Bitcoin Core RPC interface

# Blockchain Monitoring

The [blockchain](/philosophy/fundamentals/blockchain) is an ordered chain of blocks; the [timechain](/philosophy/fundamentals/timechain) view emphasizes that ordering as a source of time and finality. Monitoring it lets your application react to new blocks, track confirmations, and handle reorgs. Whether you're waiting for payment confirmations, updating balances, or logging chain tip and mempool activity, you need a reliable way to subscribe to block and transaction events. Real-time monitoring allows you to detect new blocks instantly, track mining pools, analyze transactions, and monitor network activity.

> **Explore the blockchain live!** Try RPC commands like `getblockchaininfo` and `getmempoolinfo` in the [Bitcoin CLI Terminal](/interactive-tools/terminal).

## ZMQ Notifications

**ZeroMQ (ZMQ)** provides real-time notifications for blockchain events without polling. It's much more efficient than repeatedly calling RPC commands.

### Benefits

- **Instant notifications**: No polling delays
- **Lower resource usage**: No constant RPC calls
- **Better reliability**: Catches blocks even after node restarts
- **Real-time monitoring**: Perfect for applications

### Configuration

Add to your `bitcoin.conf`:

```ini
# ZMQ Notifications
zmqpubhashblock=tcp://127.0.0.1:28332
zmqpubhashtx=tcp://127.0.0.1:28333
zmqpubrawblock=tcp://127.0.0.1:28334
zmqpubrawtx=tcp://127.0.0.1:28335
```

**Important**: Bitcoin Core must be built **with ZMQ enabled**.

### Verification

```bash
# Check if ZMQ is enabled in Bitcoin logs
grep -i zmq ~/.bitcoin/debug.log

# Check Bitcoin help for ZMQ options
bitcoind -h | grep zmq
```

---

## Block Detection

### Real-Time Block Monitoring with ZMQ

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;
use zmq;

fn monitor_blocks() -> Result<(), Box<dyn std::error::Error>> {
    let context = zmq::Context::new();
    let socket = context.socket(zmq::SUB)?;
    socket.connect("tcp://127.0.0.1:28332")?;
    socket.set_subscribe(b"hashblock")?;

    loop {
        let msg = socket.recv_bytes(0)?;
        let block_hash = hex::encode(&msg[1..]);
        println!("New block: {}", block_hash);
    }
}
```

```python
import zmq

context = zmq.Context()
socket = context.socket(zmq.SUB)
socket.connect("tcp://127.0.0.1:28332")
socket.setsockopt_string(zmq.SUBSCRIBE, "hashblock")

while True:
    message = socket.recv()
    block_hash = message[1:].hex()
    print(f"New block: {block_hash}")
```

```cpp
#include <zmq.hpp>
#include <iostream>
#include <iomanip>

void monitor_blocks() {
    zmq::context_t context(1);
    zmq::socket_t socket(context, ZMQ_SUB);
    socket.connect("tcp://127.0.0.1:28332");
    socket.setsockopt(ZMQ_SUBSCRIBE, "hashblock", 9);
    
    while (true) {
        zmq::message_t message;
        socket.recv(&message);
        // Skip topic prefix, convert to hex
        auto* data = static_cast<unsigned char*>(message.data());
        std::cout << "New block: ";
        for (size_t i = 9; i < message.size(); ++i)
            std::cout << std::hex << std::setfill('0') << std::setw(2) << (int)data[i];
        std::cout << std::endl;
    }
}
```

```go
package main

import (
	"fmt"
	"log"

	"github.com/pebbe/zmq4"
)

func monitorBlocks() error {
	socket, err := zmq4.NewSocket(zmq4.SUB)
	if err != nil {
		return err
	}
	defer socket.Close()

	err = socket.Connect("tcp://127.0.0.1:28332")
	if err != nil {
		return err
	}

	err = socket.SetSubscribe("hashblock")
	if err != nil {
		return err
	}

	for {
		parts, err := socket.RecvMessageBytes(0)
		if err != nil {
			return err
		}

		if len(parts) < 2 {
			continue
		}

		// parts[0] is topic, parts[1] is block hash
		blockHash := parts[1]
		hashHex := ""
		for i := len(blockHash) - 1; i >= 0; i-- {
			hashHex += fmt.Sprintf("%02x", blockHash[i])
		}
		fmt.Printf("New block: %s\n", hashHex)
	}
}

func main() {
	if err := monitorBlocks(); err != nil {
		log.Fatal(err)
	}
}
```

```javascript
const zmq = require('zeromq');

async function monitorBlocks() {
  const socket = new zmq.Subscriber();
  socket.connect('tcp://127.0.0.1:28332');
  socket.subscribe('hashblock');

  for await (const [topic, msg] of socket) {
    const blockHash = msg.toString('hex');
    console.log(`New block: ${blockHash}`);
  }
}
monitorBlocks();
```
:::

### Using Polling (Fallback)

:::code-group
```rust
use std::{thread, time::Duration};

fn poll_blocks(rpc: &bitcoincore_rpc::Client) {
    let mut last_block = rpc.get_block_count().unwrap();
    loop {
        let current = rpc.get_block_count().unwrap();
        if current > last_block {
            println!("New block: {}", current);
            last_block = current;
        }
        thread::sleep(Duration::from_secs(10));
    }
}
```

```python
import time
from bitcoinrpc import BitcoinRPC

rpc = BitcoinRPC(...)
last_block = rpc.getblockcount()

while True:
    current_block = rpc.getblockcount()
    if current_block > last_block:
        print(f"New block: {current_block}")
        last_block = current_block
    time.sleep(10)
```

```cpp
#include <thread>
#include <chrono>

void poll_blocks(BitcoinRPC& rpc) {
    int last_block = rpc.getblockcount();
    while (true) {
        int current = rpc.getblockcount();
        if (current > last_block) {
            std::cout << "New block: " << current << std::endl;
            last_block = current;
        }
        std::this_thread::sleep_for(std::chrono::seconds(10));
    }
}
```

```go
package main

import (
	"fmt"
	"time"

	"github.com/btcsuite/btcd/rpcclient"
)

func pollBlocks(client *rpcclient.Client) error {
	lastBlock, err := client.GetBlockCount()
	if err != nil {
		return err
	}

	for {
		current, err := client.GetBlockCount()
		if err != nil {
			return err
		}

		if current > lastBlock {
			fmt.Printf("New block: %d\n", current)
			lastBlock = current
		}

		time.Sleep(10 * time.Second)
	}
}

func main() {
	// Connect to Bitcoin Core RPC
	connCfg := &rpcclient.ConnConfig{
		Host:         "127.0.0.1:8332",
		User:         "rpcuser",
		Pass:         "rpcpassword",
		HTTPPostMode: true,
		DisableTLS:   true,
	}

	client, err := rpcclient.New(connCfg, nil)
	if err != nil {
		panic(err)
	}
	defer client.Shutdown()

	if err := pollBlocks(client); err != nil {
		panic(err)
	}
}
```

```javascript
async function pollBlocks(rpc) {
  let lastBlock = await rpc.getBlockCount();
  while (true) {
    const current = await rpc.getBlockCount();
    if (current > lastBlock) {
      console.log(`New block: ${current}`);
      lastBlock = current;
    }
    await new Promise(r => setTimeout(r, 10000));
  }
}
```
:::

### Block Information

**Get Block Details:**

```python
# Get block by hash
block = rpc.getblock(block_hash)

# Get block by height
block_hash = rpc.getblockhash(height)
block = rpc.getblock(block_hash)
```

**Key Information:**
- Block height
- Block hash
- Previous block hash
- Merkle root
- Timestamp
- Transaction count
- Block size

---

## Mining Pool Identification

### Coinbase Transaction Analysis

Mining pools often embed their name or identifier in the coinbase transaction.

**Extract Pool Information:**

```python
def identify_pool(block):
    coinbase_tx = block['tx'][0]
    coinbase_hex = rpc.getrawtransaction(coinbase_tx)
    
    # Parse coinbase script
    # Look for pool identifiers
    # Common patterns:
    # - Pool names in ASCII
    # - Pool URLs
    # - Pool signatures
    
    return pool_name
```

---

## OP_RETURN Analysis

### Extracting OP_RETURN Data

:::code-group
```rust
fn extract_op_return(tx: &bitcoin::Transaction) -> Vec<Vec<u8>> {
    tx.output.iter()
        .filter_map(|out| {
            if out.script_pubkey.is_op_return() {
                out.script_pubkey.instructions()
                    .skip(1)  // Skip OP_RETURN
                    .filter_map(|inst| inst.ok()?.push_bytes().map(|b| b.as_bytes().to_vec()))
                    .next()
            } else { None }
        })
        .collect()
}
```

```python
def extract_op_return(tx):
    op_returns = []
    for output in tx['vout']:
        asm = output['scriptPubKey']['asm']
        if asm.startswith('OP_RETURN'):
            data = asm.split(' ')[1] if len(asm.split(' ')) > 1 else ''
            op_returns.append(bytes.fromhex(data))
    return op_returns
```

```cpp
std::vector<std::string> extract_op_return(const json& tx) {
    std::vector<std::string> op_returns;
    for (const auto& output : tx["vout"]) {
        std::string asm_str = output["scriptPubKey"]["asm"];
        if (asm_str.find("OP_RETURN") == 0) {
            size_t pos = asm_str.find(' ');
            if (pos != std::string::npos)
                op_returns.push_back(asm_str.substr(pos + 1));
        }
    }
    return op_returns;
}
```

```javascript
function extractOpReturn(tx) {
  return tx.vout
    .filter(out => out.scriptPubKey.asm.startsWith('OP_RETURN'))
    .map(out => {
      const parts = out.scriptPubKey.asm.split(' ');
      return parts.length > 1 ? Buffer.from(parts[1], 'hex') : Buffer.alloc(0);
    });
}
```
:::

### Use Cases

- **Timestamping**: Document timestamps
- **Asset Protocols**: Counterparty, Omni Layer
- **Messages**: Encoded messages
- **Metadata**: Transaction metadata

---

## Transaction Monitoring

### Mempool Monitoring with ZMQ

:::code-group
```rust
// In Cargo.toml: hex = "0.4"
use hex;

fn monitor_mempool() -> Result<(), Box<dyn std::error::Error>> {
    let context = zmq::Context::new();
    let socket = context.socket(zmq::SUB)?;
    socket.connect("tcp://127.0.0.1:28333")?;
    socket.set_subscribe(b"hashtx")?;

    loop {
        let msg = socket.recv_bytes(0)?;
        let tx_hash = hex::encode(&msg[1..]);
        println!("New transaction: {}", tx_hash);
    }
}
```

```python
context = zmq.Context()
socket = context.socket(zmq.SUB)
socket.connect("tcp://127.0.0.1:28333")
socket.setsockopt_string(zmq.SUBSCRIBE, "hashtx")

while True:
    message = socket.recv()
    tx_hash = message[1:].hex()
    print(f"New transaction: {tx_hash}")
```

```cpp
void monitor_mempool() {
    zmq::context_t context(1);
    zmq::socket_t socket(context, ZMQ_SUB);
    socket.connect("tcp://127.0.0.1:28333");
    socket.setsockopt(ZMQ_SUBSCRIBE, "hashtx", 6);
    
    while (true) {
        zmq::message_t message;
        socket.recv(&message);
        // Convert to hex and print
        std::cout << "New transaction received" << std::endl;
    }
}
```

```go
package main

import (
	"encoding/hex"
	"fmt"
	"log"

	"github.com/pebbe/zmq4"
)

func monitorMempool() error {
	socket, err := zmq4.NewSocket(zmq4.SUB)
	if err != nil {
		return err
	}
	defer socket.Close()

	err = socket.Connect("tcp://127.0.0.1:28333")
	if err != nil {
		return err
	}

	err = socket.SetSubscribe("hashtx")
	if err != nil {
		return err
	}

	for {
		parts, err := socket.RecvMessageBytes(0)
		if err != nil {
			return err
		}

		if len(parts) < 2 {
			continue
		}

		// parts[0] is topic, parts[1] is transaction hash
		txHash := parts[1]
		hashHex := hex.EncodeToString(txHash)
		fmt.Printf("New transaction: %s\n", hashHex)
	}
}

func main() {
	if err := monitorMempool(); err != nil {
		log.Fatal(err)
	}
}
```

```javascript
const zmq = require('zeromq');

async function monitorMempool() {
  const socket = new zmq.Subscriber();
  socket.connect('tcp://127.0.0.1:28333');
  socket.subscribe('hashtx');

  for await (const [topic, msg] of socket) {
    console.log(`New transaction: ${msg.toString('hex')}`);
  }
}
```
:::

### Transaction Analysis

:::code-group
```rust
let tx = rpc.get_raw_transaction_info(&txid, None)?;
// Access: tx.vin, tx.vout, tx.size, tx.vsize
```

```python
tx = rpc.getrawtransaction(tx_hash, True)
# Access: tx['vin'], tx['vout'], tx['size'], tx['vsize']
```

```cpp
json tx = rpc.getrawtransaction(tx_hash, true);
// Access: tx["vin"], tx["vout"], tx["size"], tx["vsize"]
```

```go
package main

import (
	"fmt"

	"github.com/btcsuite/btcd/rpcclient"
)

func getTransactionInfo(client *rpcclient.Client, txHash string) error {
	tx, err := client.GetRawTransactionVerbose(txHash)
	if err != nil {
		return err
	}

	fmt.Printf("Transaction ID: %s\n", tx.Txid)
	fmt.Printf("Size: %d bytes\n", tx.Size)
	fmt.Printf("Virtual Size: %d vbytes\n", tx.Vsize)
	fmt.Printf("Inputs: %d\n", len(tx.Vin))
	fmt.Printf("Outputs: %d\n", len(tx.Vout))

	return nil
}

func main() {
	connCfg := &rpcclient.ConnConfig{
		Host:         "127.0.0.1:8332",
		User:         "rpcuser",
		Pass:         "rpcpassword",
		HTTPPostMode: true,
		DisableTLS:   true,
	}

	client, err := rpcclient.New(connCfg, nil)
	if err != nil {
		panic(err)
	}
	defer client.Shutdown()

	// Example usage
	_ = getTransactionInfo(client, "example_tx_hash")
}
```

```javascript
const tx = await rpc.getRawTransaction(txHash, true);
// Access: tx.vin, tx.vout, tx.size, tx.vsize
```
:::

---

## Statistics and Logging

### Block Statistics

**Track Block Metrics:**

```python
def log_block_stats(block):
    stats = {
        'height': block['height'],
        'hash': block['hash'],
        'tx_count': len(block['tx']),
        'size': block['size'],
        'pool': identify_pool(block),
        'timestamp': block['time']
    }
    
    # Log to CSV or database
    log_to_csv(stats)
```

### CSV Logging

**Log to CSV:**

```python
import csv

def log_to_csv(stats):
    with open('blocks.csv', 'a') as f:
        writer = csv.DictWriter(f, fieldnames=stats.keys())
        writer.writerow(stats)
```

---

## Error Handling

### ZMQ Connection Failures

**Handle ZMQ Errors:**

```python
try:
    socket = context.socket(zmq.SUB)
    socket.connect("tcp://127.0.0.1:28332")
except zmq.ZMQError as e:
    print(f"ZMQ connection failed: {e}")
    # Fall back to polling
    use_polling_fallback()
```

### RPC Failures

**Handle RPC Errors:**

```python
try:
    block = rpc.getblock(block_hash)
except Exception as e:
    print(f"RPC error: {e}")
    # Retry or log error
```

---

## Best Practices

### For Monitoring Applications

1. **Use ZMQ First**: Try ZMQ, fall back to polling
2. **Error Handling**: Handle all error cases
3. **Logging**: Log important events
4. **Rate Limiting**: Don't overwhelm RPC
5. **Caching**: Cache frequently accessed data

### For Performance

1. **Async Operations**: Use async/await for I/O
2. **Batch Operations**: Batch RPC calls when possible
3. **Connection Pooling**: Reuse connections
4. **Efficient Parsing**: Parse only needed data

---

## Related Topics

- [Payment Requests](/docs/bitcoin-development/payment-requests) - Watching for incoming payments
- [RPC Commands](/docs/bitcoin/rpc) - Bitcoin Core RPC interface
- [Mempool](/docs/mining/mempool) - Transaction mempool details
- [Block Construction](/docs/mining/block-construction) - How miners build blocks
- [Getting Started](/docs/development) - Development setup guide

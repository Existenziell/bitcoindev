# The Mempool

The **mempool** (memory pool) is Bitcoin's waiting room for unconfirmed transactions. When you broadcast a transaction, it doesn't immediately go into a block. It first enters the mempool, where it waits for a miner to include it in the next block.

Every full node maintains its own mempool. There is no single, global mempool; each node has its own view of pending transactions, though they generally converge through transaction propagation across the network.

## How the Mempool Works

### Transaction Lifecycle

1. **Broadcast**: User signs and broadcasts a transaction
2. **Validation**: Nodes verify the transaction is valid (correct signatures, sufficient funds, proper format)
3. **Mempool Entry**: Valid transactions enter the node's mempool
4. **Propagation**: Nodes relay transactions to their peers
5. **Selection**: Miners select transactions from their mempool to include in blocks
6. **Confirmation**: Once included in a block, the transaction leaves the mempool

```text
[Broadcast] --> [Validation] --> [Mempool] --> [Propagation] --> [Miner selection] --> [Block]
```

### Mempool Policies

Each node can set its own mempool policies:

- **Size Limit**: Maximum memory allocated to the mempool (default: 300 MB in Bitcoin Core)
- **Minimum Fee Rate**: Transactions below this rate are rejected
- **Transaction Expiration**: Transactions may be dropped after a period (default: 2 weeks)
- **Replace-by-Fee**: Whether to accept transaction replacements

---

## Querying the Mempool

You can query mempool information using Bitcoin Core's RPC interface:

:::code-group
```rust
use bitcoincore_rpc::{Auth, Client, RpcApi};
use serde_json::Value;

/// Query mempool information using Bitcoin Core RPC.
fn query_mempool() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to Bitcoin Core
    let client = Client::new(
        "http://127.0.0.1:8332",
        Auth::UserPass("rpcuser".to_string(), "rpcpassword".to_string()),
    )?;
    
    // Get mempool info (size, bytes, usage, fees)
    let mempool_info: Value = client.call("getmempoolinfo", &[])?;
    println!("Mempool Info:");
    println!("  Size: {} transactions", mempool_info["size"]);
    println!("  Bytes: {} bytes", mempool_info["bytes"]);
    println!("  Memory Usage: {} bytes", mempool_info["usage"]);
    println!("  Min Fee Rate: {} BTC/kB", mempool_info["mempoolminfee"]);
    
    // Get all transaction IDs in mempool
    let txids: Vec<String> = client.call("getrawmempool", &[false.into()])?;
    println!("\nTotal transactions: {}", txids.len());
    
    // Get detailed mempool with fee information
    let mempool_verbose: Value = client.call("getrawmempool", &[true.into()])?;
    
    // Find highest fee transactions
    if let Some(obj) = mempool_verbose.as_object() {
        let mut fees: Vec<(&str, f64)> = obj.iter()
            .filter_map(|(txid, info)| {
                info["fees"]["base"].as_f64().map(|fee| (txid.as_str(), fee))
            })
            .collect();
        fees.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        println!("\nTop 5 highest fee transactions:");
        for (txid, fee) in fees.iter().take(5) {
            println!("  {}: {:.8} BTC", &txid[..16], fee);
        }
    }
    
    Ok(())
}

fn main() {
    if let Err(e) = query_mempool() {
        eprintln!("Error: {}", e);
    }
}
```

```python
from bitcoinrpc.authproxy import AuthServiceProxy
import json

def query_mempool():
    """Query mempool information using Bitcoin Core RPC."""
    
    # Connect to Bitcoin Core
    rpc = AuthServiceProxy("http://rpcuser:rpcpassword@127.0.0.1:8332")
    
    # Get mempool info (size, bytes, usage, fees)
    mempool_info = rpc.getmempoolinfo()
    print("Mempool Info:")
    print(f"  Size: {mempool_info['size']} transactions")
    print(f"  Bytes: {mempool_info['bytes']} bytes")
    print(f"  Memory Usage: {mempool_info['usage']} bytes")
    print(f"  Min Fee Rate: {mempool_info['mempoolminfee']} BTC/kB")
    
    # Get all transaction IDs in mempool
    txids = rpc.getrawmempool(False)
    print(f"\nTotal transactions: {len(txids)}")
    
    # Get detailed mempool with fee information
    mempool_verbose = rpc.getrawmempool(True)
    
    # Find highest fee transactions
    fees = [
        (txid, info['fees']['base'])
        for txid, info in mempool_verbose.items()
    ]
    fees.sort(key=lambda x: x[1], reverse=True)
    
    print("\nTop 5 highest fee transactions:")
    for txid, fee in fees[:5]:
        print(f"  {txid[:16]}: {fee:.8f} BTC")
    
    # Estimate fee for different confirmation targets
    print("\nFee Estimates (sat/vB):")
    for target in [1, 3, 6, 12, 24]:
        try:
            estimate = rpc.estimatesmartfee(target)
            if 'feerate' in estimate:
                # Convert BTC/kB to sat/vB
                sat_per_vb = estimate['feerate'] * 100_000
                print(f"  {target} blocks: {sat_per_vb:.1f} sat/vB")
        except Exception:
            pass

if __name__ == "__main__":
    query_mempool()
```

```cpp
#include <iostream>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// Callback for CURL response
size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    userp->append((char*)contents, size * nmemb);
    return size * nmemb;
}

/**
 * Make a JSON-RPC call to Bitcoin Core.
 */
json rpc_call(const std::string& method, const json& params = json::array()) {
    CURL* curl = curl_easy_init();
    std::string response;
    
    json request = {
        {"jsonrpc", "1.0"},
        {"id", "cpp"},
        {"method", method},
        {"params", params}
    };
    
    std::string request_str = request.dump();
    
    curl_easy_setopt(curl, CURLOPT_URL, "http://127.0.0.1:8332");
    curl_easy_setopt(curl, CURLOPT_USERPWD, "rpcuser:rpcpassword");
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, request_str.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    
    curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    
    return json::parse(response)["result"];
}

/**
 * Query mempool information using Bitcoin Core RPC.
 */
void query_mempool() {
    // Get mempool info
    json mempool_info = rpc_call("getmempoolinfo");
    std::cout << "Mempool Info:" << std::endl;
    std::cout << "  Size: " << mempool_info["size"] << " transactions" << std::endl;
    std::cout << "  Bytes: " << mempool_info["bytes"] << " bytes" << std::endl;
    std::cout << "  Memory Usage: " << mempool_info["usage"] << " bytes" << std::endl;
    std::cout << "  Min Fee Rate: " << mempool_info["mempoolminfee"] << " BTC/kB" << std::endl;
    
    // Get transaction count
    json txids = rpc_call("getrawmempool", {false});
    std::cout << "\nTotal transactions: " << txids.size() << std::endl;
    
    // Get detailed mempool
    json mempool_verbose = rpc_call("getrawmempool", {true});
    
    // Collect and sort by fee
    std::vector<std::pair<std::string, double>> fees;
    for (auto& [txid, info] : mempool_verbose.items()) {
        fees.emplace_back(txid, info["fees"]["base"].get<double>());
    }
    std::sort(fees.begin(), fees.end(),
              [](auto& a, auto& b) { return a.second > b.second; });
    
    std::cout << "\nTop 5 highest fee transactions:" << std::endl;
    for (int i = 0; i < std::min(5, (int)fees.size()); ++i) {
        std::cout << "  " << fees[i].first.substr(0, 16) 
                  << ": " << fees[i].second << " BTC" << std::endl;
    }
}

int main() {
    curl_global_init(CURL_GLOBAL_DEFAULT);
    query_mempool();
    curl_global_cleanup();
    return 0;
}
```

```go
package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// RPCCall makes a JSON-RPC call to Bitcoin Core
func RPCCall(method string, params []interface{}) (interface{}, error) {
	request := map[string]interface{}{
		"jsonrpc": "1.0",
		"id":      "go",
		"method":  method,
		"params":  params,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "http://127.0.0.1:8332", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	auth := base64.StdEncoding.EncodeToString([]byte("rpcuser:rpcpassword"))
	req.Header.Set("Authorization", "Basic "+auth)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		Result interface{} `json:"result"`
		Error  interface{} `json:"error"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Error != nil {
		return nil, fmt.Errorf("RPC error: %v", result.Error)
	}

	return result.Result, nil
}

// QueryMempool queries mempool information using Bitcoin Core RPC
func QueryMempool() error {
	// Get mempool info
	mempoolInfo, err := RPCCall("getmempoolinfo", []interface{}{})
	if err != nil {
		return err
	}

	info := mempoolInfo.(map[string]interface{})
	fmt.Println("Mempool Info:")
	fmt.Printf("  Size: %.0f transactions\n", info["size"])
	fmt.Printf("  Bytes: %.0f bytes\n", info["bytes"])
	fmt.Printf("  Memory Usage: %.0f bytes\n", info["usage"])
	fmt.Printf("  Min Fee Rate: %v BTC/kB\n", info["mempoolminfee"])

	// Get all transaction IDs
	txids, err := RPCCall("getrawmempool", []interface{}{false})
	if err != nil {
		return err
	}

	txidList := txids.([]interface{})
	fmt.Printf("\nTotal transactions: %d\n", len(txidList))

	// Get detailed mempool
	mempoolVerbose, err := RPCCall("getrawmempool", []interface{}{true})
	if err != nil {
		return err
	}

	verboseMap := mempoolVerbose.(map[string]interface{})
	type feeEntry struct {
		txid string
		fee  float64
	}

	var fees []feeEntry
	for txid, info := range verboseMap {
		infoMap := info.(map[string]interface{})
		feesMap := infoMap["fees"].(map[string]interface{})
		fee := feesMap["base"].(float64)
		fees = append(fees, feeEntry{txid: txid, fee: fee})
	}

	// Sort by fee (simplified - would use sort.Slice in real code)
	fmt.Println("\nTop 5 highest fee transactions:")
	for i := 0; i < 5 && i < len(fees); i++ {
		fmt.Printf("  %s: %.8f BTC\n", fees[i].txid[:16], fees[i].fee)
	}

	return nil
}

func main() {
	if err := QueryMempool(); err != nil {
		fmt.Printf("Error: %v\n", err)
	}
}
```

```javascript
const http = require('http');

/**
 * Make a JSON-RPC call to Bitcoin Core.
 * @param {string} method - RPC method name
 * @param {Array} params - Method parameters
 * @returns {Promise<any>} - RPC result
 */
function rpcCall(method, params = []) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            jsonrpc: '1.0',
            id: 'js',
            method,
            params
        });
        
        const options = {
            hostname: '127.0.0.1',
            port: 8332,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('rpcuser:rpcpassword').toString('base64')
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const response = JSON.parse(body);
                if (response.error) reject(response.error);
                else resolve(response.result);
            });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
 * Query mempool information using Bitcoin Core RPC.
 */
async function queryMempool() {
    // Get mempool info
    const mempoolInfo = await rpcCall('getmempoolinfo');
    console.log('Mempool Info:');
    console.log(`  Size: ${mempoolInfo.size} transactions`);
    console.log(`  Bytes: ${mempoolInfo.bytes} bytes`);
    console.log(`  Memory Usage: ${mempoolInfo.usage} bytes`);
    console.log(`  Min Fee Rate: ${mempoolInfo.mempoolminfee} BTC/kB`);
    
    // Get all transaction IDs
    const txids = await rpcCall('getrawmempool', [false]);
    console.log(`\nTotal transactions: ${txids.length}`);
    
    // Get detailed mempool
    const mempoolVerbose = await rpcCall('getrawmempool', [true]);
    
    // Sort by fee
    const fees = Object.entries(mempoolVerbose)
        .map(([txid, info]) => ({ txid, fee: info.fees.base }))
        .sort((a, b) => b.fee - a.fee);
    
    console.log('\nTop 5 highest fee transactions:');
    fees.slice(0, 5).forEach(({ txid, fee }) => {
        console.log(`  ${txid.slice(0, 16)}: ${fee.toFixed(8)} BTC`);
    });
    
    // Fee estimates
    console.log('\nFee Estimates (sat/vB):');
    for (const target of [1, 3, 6, 12, 24]) {
        try {
            const estimate = await rpcCall('estimatesmartfee', [target]);
            if (estimate.feerate) {
                // Convert BTC/kB to sat/vB
                const satPerVb = estimate.feerate * 100_000;
                console.log(`  ${target} blocks: ${satPerVb.toFixed(1)} sat/vB`);
            }
        } catch (e) {}
    }
}

queryMempool().catch(console.error);
```
:::

---

## Fee Market Dynamics

The mempool creates a **fee market** where users bid for block space.

### How Fees Work

- Transactions pay fees measured in **satoshis per virtual byte (sat/vB)**
- Miners prioritize higher-fee transactions (more profit per block)
- When blocks are full, low-fee transactions wait longer
- Fee rates fluctuate based on demand for block space

### Fee Estimation

Wallets estimate fees by analyzing the mempool:

```
Current mempool state:
├── 1-2 blocks: 50+ sat/vB (high priority)
├── 3-6 blocks: 20-50 sat/vB (medium priority)
├── 7+ blocks: 10-20 sat/vB (low priority)
└── Eventually: 1-10 sat/vB (no rush)
```

During congestion, fees spike. During quiet periods, even 1 sat/vB transactions confirm quickly.

### Mempool Congestion

When transaction volume exceeds block capacity:

1. **Mempool grows**: Unconfirmed transactions accumulate
2. **Fees rise**: Users bid higher to get confirmed faster
3. **Low-fee eviction**: Nodes drop lowest-fee transactions when mempool is full
4. **Backlog clears**: Eventually, transaction volume decreases and the mempool empties

---

## Replace-by-Fee (RBF)

**RBF** allows replacing an unconfirmed transaction with a new version paying a higher fee.

### How RBF Works

1. Original transaction signals RBF capability (sequence number < 0xfffffffe)
2. User broadcasts replacement with higher fee
3. Nodes replace the original with the new transaction
4. Miners see only the higher-fee version

### RBF Use Cases

- **Fee bumping**: Speed up a stuck transaction
- **Payment updates**: Change the amount or destination before confirmation
- **Consolidation**: Combine outputs more efficiently

### Full RBF vs Opt-in RBF

- **Opt-in RBF**: Only transactions that signal RBF can be replaced (current default)
- **Full RBF**: Any unconfirmed transaction can be replaced (controversial, increasingly adopted)

---

## Child Pays for Parent (CPFP)

An alternative to RBF for fee bumping.

### How CPFP Works

1. Parent transaction is stuck with low fee
2. Create a child transaction spending the parent's output
3. Child pays a high enough fee to cover both transactions
4. Miners include both (they want the child's high fee)

### CPFP vs RBF

| Aspect | RBF | CPFP |
|--------|-----|------|
| Who can bump | Sender only | Sender or recipient |
| Requires | RBF signaling | Spendable output |
| Efficiency | More efficient | Uses extra block space |

---

## Mempool Visualization

The mempool can be visualized as a queue sorted by fee rate:

```
Block Space Available: ~1 MB (4 MWU)

Fee Rate (sat/vB)
    │
100+│ ████ ← Confirmed in next block
    │ ████
 50 │ ████████ ← Confirmed in 1-3 blocks
    │ ████████
 20 │ ████████████ ← Confirmed in 3-6 blocks
    │ ████████████
 10 │ ████████████████ ← May wait hours/days
    │ ████████████████
  1 │ ████████████████████ ← May never confirm
    └─────────────────────────────────────
      Transaction Volume (by size)
```

---

## Mempool Sniping and Games

### Transaction Pinning

An attack where someone prevents a transaction from being replaced:

1. Attacker creates a low-fee child transaction
2. Child is large, making CPFP expensive
3. Original transaction is "pinned" and hard to bump

This is a concern for [Lightning Network](/docs/lightning) and other Layer 2 protocols.

### Front-Running

Watching the mempool to exploit pending transactions:

1. See a profitable pending transaction
2. Create your own transaction with higher fee
3. Your transaction confirms first

Common in DeFi on other chains, less relevant for Bitcoin's simpler transactions.

---

## Mempool Tools and Resources

> **Query the mempool yourself!** Try `getmempoolinfo` and `getrawmempool` in the [Bitcoin CLI Terminal](/interactive-tools/terminal).

> **Explore visually!** See transactions flowing into blocks with our interactive [Block Visualizer](/interactive-tools/block-visualizer).

### Mempool Explorers

- **[mempool.space](https://mempool.space)**: Beautiful visualization of mempool and fee estimates
- **[jochen-hoenicke.de/queue](https://jochen-hoenicke.de/queue/)**: Historical mempool data
- **[blockstream.info](https://blockstream.info/)**: Mempool and block explorer

### What You Can Learn

- Current fee rates for different confirmation targets
- Mempool size and growth trends
- Transaction propagation status
- Historical congestion patterns

---

## Implications for Users

### Sending Transactions

1. **Check mempool first**: See current fee rates before sending
2. **Use appropriate fees**: Overpaying wastes money; underpaying causes delays
3. **Enable RBF**: Always signal RBF for flexibility
4. **Batch transactions**: Combine multiple payments to save fees

### Receiving Transactions

1. **Wait for confirmations**: Unconfirmed transactions can be replaced or dropped
2. **Check RBF status**: RBF transactions are more easily double-spent before confirmation
3. **Monitor mempool**: Track your incoming transaction's position

---

## Technical Details

### Mempool Data Structures

Bitcoin Core maintains several structures:

- **mapTx**: Main transaction storage, indexed multiple ways
- **Ancestor/Descendant tracking**: For CPFP calculations
- **Fee rate buckets**: For efficient transaction selection

### Transaction Relay Policies

Not all valid transactions are relayed:

- **Dust limit**: Outputs below ~546 sats are non-standard
- **OP_RETURN size**: Limited to 80 bytes by default (policy, not consensus)
- **Non-standard scripts**: Some valid scripts aren't relayed

### Mempool Accept Rules

Transactions must pass:

1. **Consensus rules**: Valid signatures, scripts, amounts
2. **Standardness rules**: Follow common patterns
3. **Policy rules**: Meet node's minimum fee, size limits
4. **Package rules**: Ancestor/descendant limits (25 transactions, 101 KB)

---

## Summary

The mempool is the heartbeat of Bitcoin's transaction processing:

- **Waiting room**: Where transactions queue for confirmation
- **Fee market**: Creates price discovery for block space
- **Strategic space**: RBF and CPFP allow fee management
- **Per-node**: Each node has its own mempool view

Understanding the mempool helps you:
- Set appropriate fees
- Troubleshoot stuck transactions
- Understand network congestion
- Make informed timing decisions

---

## Related Topics

- [Mining Economics](/docs/mining/economics) - How miners profit from fees
- [Block Construction](/docs/mining/block-construction) - How miners select transactions
- [Proof-of-Work](/docs/mining/proof-of-work) - The mining process

---

## Resources

- [mempool.space](https://mempool.space) - Real-time mempool visualization
- [Bitcoin Core mempool documentation](https://github.com/bitcoin/bitcoin/tree/master/doc/policy) - Policy and mempool docs

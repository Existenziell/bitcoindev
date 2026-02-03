# Node Types

Bitcoin nodes come in different types, each with different capabilities, resource requirements, and trust models. Understanding node types helps you choose the right setup for your needs.

## Full Nodes

**Full nodes** download and validate the entire blockchain:

```text
Characteristics:
- Downloads ~600GB+ blockchain data
- Validates all transactions and blocks
- Maintains complete UTXO set
- Maximum security and privacy
- Requires significant resources
```

- Maximum security
- Privacy-sensitive applications
- Contributing to network
- Development and testing

## Pruned Nodes

**Pruned nodes** validate everything but don't store full history:

```text
Characteristics:
- Validates all blocks
- Stores only recent blocks (~2GB)
- Maintains UTXO set
- Good security, lower storage
- Can't serve historical data
```

- Limited storage space
- Still want full validation
- Don't need historical data

## Archival Nodes

**Archival nodes** store complete blockchain history:

```text
Characteristics:
- Full blockchain storage
- Can serve historical data
- Maximum storage requirements
- Useful for research/analysis
```

- Blockchain analysis
- Historical data access
- Research purposes
- Public services

## SPV (Simplified Payment Verification) Nodes

**SPV nodes** download only block headers:

```text
Characteristics:
- Downloads ~80 bytes per block
- Minimal storage (~50MB)
- Relies on full nodes
- Less privacy
- Faster sync
```

- Mobile wallets
- Lightweight clients
- Limited resources
- Quick setup

## Comparison

| Feature | Full Node | Pruned Node | SPV Node |
|---------|-----------|-------------|----------|
| **Storage** | ~600GB+ | ~2GB | ~50MB |
| **Validation** | Complete | Complete | Partial |
| **Privacy** | Maximum | Maximum | Reduced |
| **Sync Time** | Days | Days | Minutes |
| **Bandwidth** | High | High | Low |
| **Security** | Maximum | Maximum | Reduced |

## AssumeUTXO (Faster Initial Sync)

**AssumeUTXO** (in [Bitcoin Core](https://github.com/bitcoin/bitcoin) 26+) allows a new node to **start from a snapshot** of the UTXO set at a recent block height instead of verifying every [block](/docs/bitcoin/blocks) from the genesis. The node downloads a signed snapshot (from a built-in or external source), loads the UTXO set, and then syncs only the **remaining** blocks to the chain tip. This can reduce **initial sync time** from days to hours. The node still performs full consensus validation for all blocks it downloads; the trust is only that the snapshot is correct at that height, and the [BIP](/docs/history/bips) process and built-in defaults are designed to minimize risk. Useful for [pruned](/docs/development/node-types#pruned-nodes) and [full](/docs/development/node-types#full-nodes) nodes that want to reach tip quickly, then optionally verify history in the background.

## Block-Relay-Only Connections

**Block-relay-only** is a connection mode where the node does **not** exchange [transaction](/docs/bitcoin/transaction-lifecycle) ([inv](/docs/bitcoin/p2p-protocol), [mempool](/docs/mining/mempool)) data with that peer, only blocks and [compact blocks](/docs/bitcoin/blocks#compact-block-relay-bip-152). This reduces [privacy](/docs/wallets/privacy) leakage (peers cannot directly tie your [transactions](/docs/bitcoin/transaction-lifecycle) to your IP) and bandwidth. Bitcoin Core uses some block-relay-only [outbound](/docs/bitcoin/p2p-protocol) connections by default.

---

## Code Examples

### Checking Node Type

:::code-group
```rust
use serde_json::json;
use reqwest;

async fn get_node_info() -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:8332")
        .json(&json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getblockchaininfo"
        }))
        .send()
        .await?;
    
    let info: serde_json::Value = response.json().await?;
    Ok(info["result"].clone())
}
```

```python
import requests
import json

def get_node_info():
    """Get node information via RPC."""
    response = requests.post(
        "http://localhost:8332",
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getblockchaininfo"
        }
    )
    return response.json()["result"]
```

```cpp
#include <curl/curl.h>
#include <json/json.h>
#include <string>

Json::Value get_node_info() {
    CURL* curl = curl_easy_init();
    std::string response_data;
    
    std::string json_data = R"({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getblockchaininfo"
    })";
    
    curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:8332");
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_data.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response_data);
    curl_easy_perform(curl);
    
    Json::Value root;
    Json::Reader reader;
    reader.parse(response_data, root);
    
    return root["result"];
}
```

```go
package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
)

type RPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params,omitempty"`
}

func getNodeInfo() (map[string]interface{}, error) {
	req := RPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "getblockchaininfo",
	}
	
	jsonData, _ := json.Marshal(req)
	resp, err := http.Post(
		"http://localhost:8332",
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)
	
	return result["result"].(map[string]interface{}), nil
}
```

```javascript
async function getNodeInfo() {
    const response = await fetch('http://localhost:8332', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getblockchaininfo',
        }),
    });
    const data = await response.json();
    return data.result;
}
```
:::

---

## Related Topics

- [Bitcoin Core Internals](/docs/development/bitcoin-core-internals) - Node implementation
- [P2P Network Protocol](/docs/bitcoin/p2p-protocol) - Network communication
- [Installing Bitcoin](/docs/development/install-bitcoin) - Setup guide

---

## Resources

- [Bitcoin Core Documentation](https://bitcoincore.org/en/doc/)
- [Running a Full Node](https://bitcoin.org/en/full-node)

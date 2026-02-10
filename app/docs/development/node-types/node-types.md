# Node Types

Bitcoin nodes come in different types, each with different capabilities, resource requirements, and trust models. Understanding node types helps you choose the right setup for your needs.

## Full Nodes

**Full nodes** download and validate the entire blockchain:

- Downloads ~600GB+ blockchain data
- Validates all transactions and blocks
- Maintains complete UTXO set
- Maximum security and privacy; requires significant resources
- Best for: security-critical and privacy-sensitive applications, contributing to the network, development and testing

## Pruned Nodes

**Pruned nodes** validate everything but don't store full history:

- Validates all blocks
- Stores only recent blocks (~2GB)
- Maintains UTXO set
- Good security, lower storage; can't serve historical data
- Best for: limited storage, full validation without needing historical data

## Archival Nodes

**Archival nodes** store complete blockchain history:

- Full blockchain storage
- Can serve historical data
- Maximum storage requirements
- Best for: blockchain analysis, historical data access, research, public services

## SPV (Simplified Payment Verification) Nodes

**SPV nodes** download only block headers:


- Downloads ~80 bytes per block
- Minimal storage (~50MB)
- Relies on full nodes; less privacy; faster sync
- Best for: mobile wallets, lightweight clients, limited resources, quick setup

## Comparison

| Feature | Full Node | Pruned Node | SPV Node |
|---------|-----------|-------------|----------|
| **Storage** | ~600GB+ | ~2GB | ~50MB |
| **Validation** | Complete | Complete | Partial |
| **Privacy** | Maximum | Maximum | Reduced |
| **Sync Time** | Days | Days | Minutes |
| **Bandwidth** | High | High | Low |
| **Security** | Maximum | Maximum | Reduced |

Full and pruned nodes can be run over [Tor](/docs/bitcoin/p2p-protocol#tor-and-bitcoin) for IP privacy and eclipse mitigation.

## AssumeUTXO (Faster Initial Sync)

**AssumeUTXO** (in [Bitcoin Core](https://github.com/bitcoin/bitcoin) 26+) allows a new node to **start from a snapshot** of the UTXO set at a recent block height instead of verifying every [block](/docs/bitcoin/blocks) from the genesis. The node downloads a signed snapshot (from a built-in or external source), loads the UTXO set, and then syncs only the **remaining** blocks to the chain tip. This can reduce **initial sync time** from days to hours. The node still performs full consensus validation for all blocks it downloads; the trust is only that the snapshot is correct at that height, and the [BIP](/philosophy/history/bips) process and built-in defaults are designed to minimize risk. Useful for [pruned](#pruned-nodes) and [full](#full-nodes) nodes that want to reach tip quickly, then optionally verify history in the background.

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

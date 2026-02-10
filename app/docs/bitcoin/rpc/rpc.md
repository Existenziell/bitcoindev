# RPC Commands Reference

This document provides a guide for interacting with your Bitcoin node using both curl and bitcoin-cli commands via RPC.

> **Try it live!** Test these commands directly in the [Bitcoin CLI Terminal](/interactive-tools/terminal). Connected to mainnet, no setup required.

| Command | Purpose |
|---------|---------|
| `getblockchaininfo` | Chain tip, verification progress, network name |
| `getblock` | Block data by hash or verbosity |
| `getblockhash` | Block hash by height |
| `getrawtransaction` | Transaction hex or JSON (requires `txindex=1` for non-wallet txs). Decode raw hex in the [Transaction Decoder](/interactive-tools/transaction-decoder). |
| `sendrawtransaction` | Broadcast a signed transaction |
| `estimatesmartfee` | Fee rate estimate for a target confirmation block count |
| `getmempoolinfo` | Mempool size and fee stats |
| `gettxout` | Check whether an output is spent; get scriptPubKey and value |

```mermaid
sequenceDiagram
  participant Client
  participant Core as Bitcoin Core RPC
  Client->>Core: HTTP/JSON request
  Core->>Client: JSON response
```

---

## RPC Configuration

### bitcoin.conf Setup

Add these settings to your `bitcoin.conf` file:

```ini
# RPC Server Settings
server=1
rpcuser=your_username
rpcpassword=your_secure_password
rpcport=8332

# Restrict RPC to localhost (recommended)
rpcbind=127.0.0.1
rpcallowip=127.0.0.1

# Optional: Enable transaction index for full tx lookups
txindex=1
```

### Environment Variables

```bash
# Set environment variables (replace with your actual credentials)
export BITCOIN_RPC_USER="your_username"
export BITCOIN_RPC_PASSWORD="your_password"
export BITCOIN_RPC_PORT="8332"
```

---

## Basic RPC Structure

```bash
# Set up alias for easier use
alias btc='bitcoin-cli -rpcuser=$BITCOIN_RPC_USER -rpcpassword=$BITCOIN_RPC_PASSWORD -rpcport=$BITCOIN_RPC_PORT'

# Then use simple commands
btc <method_name> [parameters]
```

---

## Programmatic RPC Access

For building applications, you can interact with Bitcoin Core RPC programmatically:

:::code-group
```rust
use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Serialize)]
struct RpcRequest {
    jsonrpc: &'static str,
    id: &'static str,
    method: String,
    params: Vec<Value>,
}

#[derive(Deserialize)]
struct RpcResponse {
    result: Option<Value>,
    error: Option<RpcError>,
}

#[derive(Deserialize)]
struct RpcError {
    code: i32,
    message: String,
}

/// Bitcoin RPC client with error handling
struct BitcoinRpc {
    url: String,
    user: String,
    password: String,
    client: Client,
}

impl BitcoinRpc {
    fn new(url: &str, user: &str, password: &str) -> Self {
        Self {
            url: url.to_string(),
            user: user.to_string(),
            password: password.to_string(),
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .expect("Failed to create HTTP client"),
        }
    }

    fn call(&self, method: &str, params: Vec<Value>) -> Result<Value, String> {
        let request = RpcRequest {
            jsonrpc: "1.0",
            id: "rust-client",
            method: method.to_string(),
            params,
        };

        let response = self.client
            .post(&self.url)
            .basic_auth(&self.user, Some(&self.password))
            .json(&request)
            .send()
            .map_err(|e| format!("Connection error: {}", e))?;

        let rpc_response: RpcResponse = response
            .json()
            .map_err(|e| format!("Parse error: {}", e))?;

        if let Some(error) = rpc_response.error {
            return Err(format!("RPC error {}: {}", error.code, error.message));
        }

        Ok(rpc_response.result.unwrap_or(Value::Null))
    }

    fn get_blockchain_info(&self) -> Result<Value, String> {
        self.call("getblockchaininfo", vec![])
    }

    fn get_block(&self, hash: &str, verbosity: i32) -> Result<Value, String> {
        self.call("getblock", vec![json!(hash), json!(verbosity)])
    }

    fn get_mempool_info(&self) -> Result<Value, String> {
        self.call("getmempoolinfo", vec![])
    }
}

fn main() {
    let rpc = BitcoinRpc::new("http://127.0.0.1:8332", "user", "password");
    
    match rpc.get_blockchain_info() {
        Ok(info) => println!("Block height: {}", info["blocks"]),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

```python
import requests
from typing import Any, Optional

class BitcoinRpc:
    """Bitcoin RPC client with error handling."""

    def __init__(self, url: str, user: str, password: str, timeout: int = 30):
        self.url = url
        self.auth = (user, password)
        self.timeout = timeout

    def call(self, method: str, params: list = None) -> Any:
        """Make an RPC call with error handling."""
        payload = {
            "jsonrpc": "1.0",
            "id": "python-client",
            "method": method,
            "params": params or []
        }

        try:
            response = requests.post(
                self.url,
                json=payload,
                auth=self.auth,
                timeout=self.timeout
            )
            response.raise_for_status()
        except requests.exceptions.ConnectionError:
            raise ConnectionError(f"Cannot connect to {self.url}")
        except requests.exceptions.Timeout:
            raise TimeoutError(f"Request timed out after {self.timeout}s")

        data = response.json()
        
        if data.get("error"):
            error = data["error"]
            raise Exception(f"RPC error {error['code']}: {error['message']}")
        
        return data.get("result")

    def get_blockchain_info(self) -> dict:
        return self.call("getblockchaininfo")

    def get_block(self, block_hash: str, verbosity: int = 1) -> dict:
        return self.call("getblock", [block_hash, verbosity])

    def get_mempool_info(self) -> dict:
        return self.call("getmempoolinfo")

# Usage
rpc = BitcoinRpc("http://127.0.0.1:8332", "user", "password")

try:
    info = rpc.get_blockchain_info()
    print(f"Block height: {info['blocks']}")
except Exception as e:
    print(f"Error: {e}")
```

```cpp
#include <iostream>
#include <string>
#include <stdexcept>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class BitcoinRpc {
private:
    std::string url;
    std::string user;
    std::string password;
    
    static size_t write_callback(void* contents, size_t size, size_t nmemb, std::string* out) {
        out->append(static_cast<char*>(contents), size * nmemb);
        return size * nmemb;
    }

public:
    BitcoinRpc(const std::string& url, const std::string& user, const std::string& password)
        : url(url), user(user), password(password) {}

    json call(const std::string& method, const json& params = json::array()) {
        CURL* curl = curl_easy_init();
        if (!curl) {
            throw std::runtime_error("Failed to initialize CURL");
        }

        std::string response;
        json payload = {
            {"jsonrpc", "1.0"},
            {"id", "cpp-client"},
            {"method", method},
            {"params", params}
        };
        
        std::string post_data = payload.dump();
        std::string auth = user + ":" + password;
        
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, post_data.c_str());
        curl_easy_setopt(curl, CURLOPT_USERPWD, auth.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);
        
        struct curl_slist* headers = curl_slist_append(nullptr, "Content-Type: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        
        CURLcode res = curl_easy_perform(curl);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        
        if (res != CURLE_OK) {
            throw std::runtime_error(std::string("Connection error: ") + curl_easy_strerror(res));
        }
        
        json data = json::parse(response);
        
        if (!data["error"].is_null()) {
            throw std::runtime_error("RPC error " + 
                std::to_string(data["error"]["code"].get<int>()) + ": " +
                data["error"]["message"].get<std::string>());
        }
        
        return data["result"];
    }

    json get_blockchain_info() { return call("getblockchaininfo"); }
    json get_block(const std::string& hash, int verbosity = 1) {
        return call("getblock", {hash, verbosity});
    }
    json get_mempool_info() { return call("getmempoolinfo"); }
};

int main() {
    try {
        BitcoinRpc rpc("http://127.0.0.1:8332", "user", "password");
        auto info = rpc.get_blockchain_info();
        std::cout << "Block height: " << info["blocks"] << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
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
	"time"
)

type RPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      string        `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

type RPCResponse struct {
	Result interface{} `json:"result"`
	Error  *RPCError   `json:"error"`
}

type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type BitcoinRPC struct {
	url      string
	user     string
	password string
	client   *http.Client
}

func NewBitcoinRPC(url, user, password string) *BitcoinRPC {
	return &BitcoinRPC{
		url:      url,
		user:     user,
		password: password,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (rpc *BitcoinRPC) Call(method string, params []interface{}) (interface{}, error) {
	request := RPCRequest{
		JSONRPC: "1.0",
		ID:      "go-client",
		Method:  method,
		Params:  params,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", rpc.url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	auth := base64.StdEncoding.EncodeToString([]byte(rpc.user + ":" + rpc.password))
	req.Header.Set("Authorization", "Basic "+auth)

	resp, err := rpc.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var response RPCResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	if response.Error != nil {
		return nil, fmt.Errorf("RPC error %d: %s", response.Error.Code, response.Error.Message)
	}

	return response.Result, nil
}

func (rpc *BitcoinRPC) GetBlockchainInfo() (interface{}, error) {
	return rpc.Call("getblockchaininfo", []interface{}{})
}

func main() {
	rpc := NewBitcoinRPC("http://127.0.0.1:8332", "user", "password")

	info, err := rpc.GetBlockchainInfo()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	infoMap := info.(map[string]interface{})
	fmt.Printf("Block height: %.0f\n", infoMap["blocks"])
}
```

```javascript
const axios = require('axios');

class BitcoinRpc {
  constructor(url, user, password, timeout = 30000) {
    this.url = url;
    this.auth = { username: user, password: password };
    this.timeout = timeout;
  }

  async call(method, params = []) {
    const payload = {
      jsonrpc: '1.0',
      id: 'js-client',
      method: method,
      params: params
    };

    try {
      const response = await axios.post(this.url, payload, {
        auth: this.auth,
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.error) {
        const { code, message } = response.data.error;
        throw new Error(`RPC error ${code}: ${message}`);
      }

      return response.data.result;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to ${this.url}`);
      }
      if (error.code === 'ETIMEDOUT') {
        throw new Error(`Request timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  async getBlockchainInfo() {
    return this.call('getblockchaininfo');
  }

  async getBlock(blockHash, verbosity = 1) {
    return this.call('getblock', [blockHash, verbosity]);
  }

  async getMempoolInfo() {
    return this.call('getmempoolinfo');
  }
}

// Usage
async function main() {
  const rpc = new BitcoinRpc('http://127.0.0.1:8332', 'user', 'password');

  try {
    const info = await rpc.getBlockchainInfo();
    console.log(`Block height: ${info.blocks}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();
```
:::

---

## Essential Node Information Commands

### 1. Blockchain Information

```bash
btc getblockchaininfo
```

**Key fields to monitor:**
- `blocks`: Current block height
- `headers`: Number of headers downloaded
- `verificationprogress`: Sync progress (0.0 to 1.0)
- `initialblockdownload`: Whether still in IBD
- `pruned`: Whether node is pruned

### 2. Network Information

```bash
btc getnetworkinfo
```

**Key fields:**
- `connections`: Total peer connections
- `connections_in`: Incoming connections
- `connections_out`: Outgoing connections
- `version`: Bitcoin Core version
- `subversion`: Detailed version info

### 3. Mempool Information

```bash
btc getmempoolinfo
```

**Key fields:**
- `size`: Number of transactions in mempool
- `bytes`: Total mempool size in bytes
- `total_fee`: Total fees in mempool

### 4. Block Information

```bash
# Get latest block hash
btc getbestblockhash

# Get block by hash
btc getblock <block_hash>

# Get block by height
btc getblockhash <height>
```

### 5. Transaction Information

```bash
# Get transaction by ID
btc getrawtransaction <txid> true

# Get transaction from mempool
btc getmempoolentry <txid>
```

---

## Wallet Commands

### 6. Wallet Information

```bash
# List wallets
btc listwallets

# Get wallet info
btc getwalletinfo

# Get balance
btc getbalance
```

### 7. Wallet Management

```bash
# List all loaded wallets
btc listwallets

# Get info about specific wallet
btc -rpcwallet=<walletname> getwalletinfo

# Unload a wallet (removes from memory)
btc unloadwallet <walletname>

# Load a wallet
btc loadwallet <walletname>

# Get transactions from specific wallet
btc -rpcwallet=<walletname> listtransactions "*" 100

# Get balance from specific wallet
btc -rpcwallet=<walletname> getbalance
```

---

## Advanced Diagnostic Commands

### 8. Index Information

```bash
# Check if transaction index is available
btc getindexinfo

# Calculate indexing progress percentage
btc getindexinfo | jq '.txindex.best_block_height / 880000 * 100'

# Check if indexing is complete
btc getindexinfo | jq '.txindex.synced'

# Monitor indexing in real-time (updates every 30 seconds)
watch -n 30 'btc getindexinfo | jq ".txindex.best_block_height"'
```

### 9. UTXO Set Information

The [UTXO Set](/philosophy/fundamentals/utxos#the-utxo-set) is the complete database of all unspent transaction outputs. These commands allow you to query information about it.

```bash
# Get UTXO set statistics (can be slow)
btc gettxoutsetinfo

# Get specific fields
btc gettxoutsetinfo | jq '{total_amount, transactions, height}'
```

### 10. Peer Information

```bash
# Get peer information
btc getpeerinfo

# Get connection summary
btc getnetworkinfo | jq '{connections, connections_in, connections_out}'
```

---

## 11. ZMQ Notifications

ZeroMQ provides real-time notifications for blockchain events, enabling instant detection of new blocks and transactions without polling.

### Configuration

Add to your `bitcoin.conf`:
```ini
# ZMQ Notifications
zmqpubhashblock=tcp://127.0.0.1:28332
zmqpubhashtx=tcp://127.0.0.1:28333
zmqpubrawblock=tcp://127.0.0.1:28334
zmqpubrawtx=tcp://127.0.0.1:28335
```

### Benefits
- **Instant notifications**: No polling delays
- **Lower resource usage**: No constant RPC calls
- **Better reliability**: Catches blocks even after node restarts
- **Real-time monitoring**: Perfect for blockchain monitoring applications

### Verification
```bash
# Check if ZMQ is enabled in Bitcoin logs
grep -i zmq ~/.bitcoin/debug.log

# Check Bitcoin help for ZMQ options
bitcoind -h | grep zmq
```

---

## Troubleshooting

### Connection Issues

```bash
# Test RPC connection
btc getblockchaininfo | jq '.chain'

# Check network status
btc getnetworkinfo | jq '{connections, connections_in, connections_out}'

# Verify wallet is accessible
btc getwalletinfo | jq '{walletname, txcount, balance}'

# Check if node is still syncing
btc getblockchaininfo | jq '{verificationprogress, initialblockdownload}'
```

### Common RPC Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| -1 | General error | Check logs for details |
| -5 | Invalid address or key | Verify input format |
| -8 | Invalid parameter | Check parameter types |
| -25 | Transaction verification failed | Check inputs/outputs |
| -26 | Transaction already in mempool | Already broadcast |
| -27 | Transaction already in chain | Already confirmed |
| -28 | Node initializing | Wait for startup |

### Log Monitoring
```bash
# Check recent activity in logs
tail -20 ~/.bitcoin/debug.log

# Monitor logs in real-time
tail -f ~/.bitcoin/debug.log

# Check for errors in logs
grep -i error ~/.bitcoin/debug.log | tail -10
```

---

## JSON Output Formatting

To make the output more readable, pipe through `jq`:

```bash
# Install jq if not available
# macOS: brew install jq
# Ubuntu: apt install jq

btc getblockchaininfo | jq '{blocks, verificationprogress}'
```

---

## Resources

- **[mempool.space](https://mempool.space)**: Real-time Bitcoin mempool and block explorer
- **[Clark Moody's Bitcoin Dashboard](https://dashboard.clarkmoody.com)**: Bitcoin metrics and analytics
- **[Bitcoin Core GitHub](https://github.com/bitcoin/bitcoin)**: Bitcoin Core source code repository
- **[Bitcoin Core RPC Docs](https://developer.bitcoin.org/reference/rpc/)**: Official RPC documentation

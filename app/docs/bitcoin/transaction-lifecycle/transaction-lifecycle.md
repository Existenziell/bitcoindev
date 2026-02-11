# Transaction Lifecycle

Understanding the complete lifecycle of a Bitcoin transaction helps developers build robust applications and users understand what happens when they send bitcoin.

## Transaction Structure

A Bitcoin transaction consists of:
- **Version**: Identifies consensus rules
- **Inputs**: References to previous transaction outputs (UTXOs)
- **Outputs**: Creates new UTXOs with spending conditions
- **Locktime**: Optional time-based spending restriction
- **Witness Data** (SegWit): Signature data separated from transaction

For detailed transaction construction, see [Transaction Construction](/docs/bitcoin-development/transactions).

---

## Transaction States

A transaction goes through several states:

| State | Description |
|-------|--------------|
| **1. Created** | Inputs selected, outputs defined, fees set—not yet signed. |
| **2. Signed** | All inputs signed; valid and ready to broadcast, still local only. |
| **3. Broadcast** | Sent to peers, propagating; not in mempool yet, may be rejected. |
| **4. Mempool** | Validated by nodes, waiting for inclusion; replaceable (RBF) or droppable (low fee). |
| **5. Pending** | In a block with 0 confirmations; reversible by reorg, not final. |
| **6. Confirmed** | 1+ confirmations; on chain, increasingly secure, generally final. |
| **7. Deeply Confirmed** | 6+ confirmations; extremely secure, reversal practically impossible; standard for high value. |

---

## Code Examples

### Tracking Transaction Status

:::code-group
```rust
use serde_json::json;
use reqwest;

#[derive(Debug)]
enum TxStatus {
    NotFound,
    InMempool,
    Confirmed(u32), // Number of confirmations
}

async fn get_transaction_status(txid: &str) -> Result<TxStatus, Box<dyn std::error::Error>> {
    let url = format!("https://mempool.space/api/tx/{}/status", txid);
    let response = reqwest::get(&url).await?;
    let data: serde_json::Value = response.json().await?;
    
    if data["confirmed"].as_bool().unwrap_or(false) {
        let confirmations = data["block_height"].as_u64().unwrap_or(0);
        Ok(TxStatus::Confirmed(confirmations as u32))
    } else if data["in_mempool"].as_bool().unwrap_or(false) {
        Ok(TxStatus::InMempool)
    } else {
        Ok(TxStatus::NotFound)
    }
}
```

```python
import requests

def get_transaction_status(txid):
    """Get transaction status from mempool.space."""
    url = f"https://mempool.space/api/tx/{txid}/status"
    response = requests.get(url)
    data = response.json()
    
    if data.get("confirmed"):
        confirmations = data.get("block_height", 0)
        return f"Confirmed ({confirmations} confirmations)"
    elif data.get("in_mempool"):
        return "In Mempool"
    else:
        return "Not Found"
```

```cpp
#include <curl/curl.h>
#include <json/json.h>
#include <string>

enum class TxStatus {
    NotFound,
    InMempool,
    Confirmed
};

TxStatus get_transaction_status(const std::string& txid) {
    CURL* curl = curl_easy_init();
    std::string url = "https://mempool.space/api/tx/" + txid + "/status";
    std::string response_data;
    
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response_data);
    curl_easy_perform(curl);
    
    Json::Value root;
    Json::Reader reader;
    reader.parse(response_data, root);
    
    if (root["confirmed"].asBool()) {
        return TxStatus::Confirmed;
    } else if (root["in_mempool"].asBool()) {
        return TxStatus::InMempool;
    }
    
    return TxStatus::NotFound;
}
```

```go
package main

import (
	"encoding/json"
	"io"
	"net/http"
)

type TxStatus struct {
	Confirmed  bool `json:"confirmed"`
	InMempool  bool `json:"in_mempool"`
	BlockHeight int `json:"block_height"`
}

func getTransactionStatus(txid string) (string, error) {
	resp, err := http.Get("https://mempool.space/api/tx/" + txid + "/status")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	var status TxStatus
	json.Unmarshal(body, &status)
	
	if status.Confirmed {
		return "Confirmed", nil
	} else if status.InMempool {
		return "In Mempool", nil
	}
	
	return "Not Found", nil
}
```

```javascript
async function getTransactionStatus(txid) {
    const response = await fetch(
        `https://mempool.space/api/tx/${txid}/status`
    );
    const data = await response.json();
    
    if (data.confirmed) {
        return `Confirmed (${data.block_height} confirmations)`;
    } else if (data.in_mempool) {
        return 'In Mempool';
    } else {
        return 'Not Found';
    }
}
```
:::

---

## Reorganizations (Reorgs)

A **reorganization** occurs when the blockchain splits and a different chain becomes the longest:

```text
Original Chain:
Block 100 → Block 101 → Block 102

Reorg:
Block 100 → Block 101A → Block 102A (longer chain)
         → Block 101B (orphaned)

Transactions in Block 101B are now unconfirmed again
```

### Impact

```text
Transaction Status:
- Was: Confirmed (in block 101B)
- Now: Unconfirmed (block orphaned)
- Risk: May not re-confirm
```

---

## Orphan Transactions

### Definition

**Orphan transactions** are transactions that reference outputs that don't exist or are invalid:

```text
Orphan Transaction:
- References UTXO that doesn't exist
- Or references unconfirmed parent
- Cannot be validated
- Dropped from mempool
```

### Handling

```text
1. Transaction references unconfirmed parent
2. Parent confirms → Orphan becomes valid
3. Orphan can now be included in block
```

---

## Best Practices for Developers

1. **Wait for confirmations**: Don't trust 0-conf for high value
2. **Handle reorgs**: Transactions can be unconfirmed again
3. **Monitor status**: Track transaction through lifecycle
4. **Use RBF**: Allow fee bumping for stuck transactions

---

## Related Topics

- [Mempool](/docs/mining/mempool) - Where transactions wait
- [Block Visualizer](/interactive-tools/block-visualizer) - See transactions flowing into blocks
- [Transaction Fees](/docs/bitcoin/transaction-fees) - Fee calculation
- [Block Propagation](/docs/bitcoin/blocks) - How blocks spread

---

## Resources

- [mempool.space](https://mempool.space) - Transaction status tracking

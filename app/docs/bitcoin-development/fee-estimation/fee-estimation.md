# Fee Estimation

When building [transactions](/docs/bitcoin-development/transactions), you need a fee rate (sat/vB) so the transaction is included in a block within an acceptable time. Fee estimation uses the [mempool](/docs/mining/mempool) and sometimes external APIs to suggest a rate. This guide covers getting fee rates from your node (e.g. Bitcoin Core RPC), from HTTP APIs, and how to use them in code. For the economics of fees, see [Transaction Fees](/docs/bitcoin/transaction-fees).

## Why Fee Estimation Matters

- **Too low**: Transaction may sit in the mempool or be dropped; user waits or payment fails.
- **Too high**: User overpays; acceptable for urgency, wasteful otherwise.

Estimation is **heuristic**: the mempool changes constantly, and miners choose which transactions to include. There is no guarantee a given fee rate will confirm in N blocks; treat estimates as guidance.

## Fee Rate Units

- **sat/vB** (satoshis per virtual byte): Standard unit. Virtual size comes from [SegWit](/docs/bitcoin/segwit) weight (weight/4).
- **BTC/kB**: Legacy unit; 1 BTC/kB = 100,000 sat/vB. Bitcoin Core's `estimatesmartfee` returns BTC/kB; convert to sat/vB for modern use.

## Getting Fee Rates from Your Node

Bitcoin Core's `estimatesmartfee` RPC returns an estimated fee rate for a given confirmation target (number of blocks).

:::code-group
```rust
// Using jsonrpc or similar; returns feerate in BTC/kB
// Convert to sat/vB: feerate_btc_per_kb * 100_000 / 1000 = feerate_btc_per_kb * 100
fn estimatesmartfee_sat_per_vb(rpc: &JsonRpcClient, blocks: u32) -> Result<u64, Box<dyn std::error::Error>> {
    let params = serde_json::json!([blocks]);
    let result: serde_json::Value = rpc.call("estimatesmartfee", params)?;
    if let Some(feerate) = result.get("feerate").and_then(|v| v.as_f64()) {
        // feerate is in BTC per 1000 vB (i.e. BTC/kB)
        let sat_per_vb = (feerate * 100_000_000.0 / 1000.0).ceil() as u64;
        Ok(sat_per_vb)
    } else {
        Err("estimatesmartfee failed".into())
    }
}
```

```python
import subprocess
import json

def estimatesmartfee_sat_per_vb(blocks: int = 6) -> float:
    """Call Bitcoin Core estimatesmartfee; return sat/vB."""
    out = subprocess.run(
        ["bitcoin-cli", "estimatesmartfee", str(blocks)],
        capture_output=True,
        text=True,
    )
    data = json.loads(out.stdout)
    if "feerate" not in data or data["feerate"] is None:
        raise RuntimeError("estimatesmartfee failed")
    # feerate is BTC per 1000 vB (BTC/kB)
    btc_per_kb = data["feerate"]
    sat_per_vb = btc_per_kb * 100_000_000 / 1000
    return sat_per_vb
```

```cpp
#include <string>
#include <cmath>

// Assuming you have an RPC client that returns JSON
double estimatesmartfee_sat_per_vb(RpcClient& rpc, int blocks) {
    auto result = rpc.call("estimatesmartfee", {blocks});
    if (!result["feerate"].is_number()) {
        throw std::runtime_error("estimatesmartfee failed");
    }
    double btc_per_kb = result["feerate"].get<double>();
    // Convert BTC/kB to sat/vB
    return std::ceil(btc_per_kb * 100000000.0 / 1000.0);
}
```

```go
package main

import (
	"encoding/json"
	"fmt"
)

func estimatesmartfeeSatPerVb(rpc *RPCClient, blocks int) (float64, error) {
	var result struct {
		Feerate *float64 `json:"feerate"`
	}
	err := rpc.Call("estimatesmartfee", []int{blocks}, &result)
	if err != nil || result.Feerate == nil {
		return 0, fmt.Errorf("estimatesmartfee failed")
	}
	// feerate is BTC per 1000 vB (BTC/kB)
	satPerVb := *result.Feerate * 100_000_000 / 1000
	return satPerVb, nil
}
```

```javascript
async function estimatesmartfeeSatPerVb(rpc, blocks = 6) {
  const result = await rpc.call('estimatesmartfee', [blocks]);
  if (result.feerate == null) {
    throw new Error('estimatesmartfee failed');
  }
  // feerate is BTC per 1000 vB (BTC/kB)
  const satPerVb = Math.ceil(result.feerate * 100_000_000 / 1000);
  return satPerVb;
}
```
:::

## Getting Fee Rates from an API

When you don't run a full node, you can use a third-party fee API (e.g. [mempool.space API](https://mempool.space/docs/api)). These return fee rates for different confirmation targets (e.g. 1, 3, 6 blocks).

:::code-group
```rust
// Example: fetch fee rates from mempool.space (or similar)
use reqwest;
use serde::Deserialize;

#[derive(Deserialize)]
struct FeeResponse {
    #[serde(rename = "halfHourFee")]
    half_hour_fee: f64,
    #[serde(rename = "hourFee")]
    hour_fee: f64,
    #[serde(rename = "fastestFee")]
    fastest_fee: f64,
}

async fn get_fee_rates_from_api() -> Result<FeeResponse, Box<dyn std::error::Error>> {
    let url = "https://mempool.space/api/v1/fees/recommended";
    let resp = reqwest::get(url).await?.json::<FeeResponse>().await?;
    Ok(resp)
}
```

```python
import urllib.request
import json

def get_fee_rates_from_api() -> dict:
    """Fetch recommended fee rates (sat/vB) from mempool.space."""
    with urllib.request.urlopen("https://mempool.space/api/v1/fees/recommended") as r:
        return json.load(r)
# e.g. {"fastestFee": 12, "halfHourFee": 8, "hourFee": 6}
```

```cpp
#include <httplib.h>
#include <nlohmann/json.hpp>

struct FeeRates {
    int fastest_fee;
    int half_hour_fee;
    int hour_fee;
};

FeeRates get_fee_rates_from_api() {
    httplib::Client cli("https://mempool.space");
    auto res = cli.Get("/api/v1/fees/recommended");
    auto j = nlohmann::json::parse(res->body);
    return {
        j["fastestFee"].get<int>(),
        j["halfHourFee"].get<int>(),
        j["hourFee"].get<int>(),
    };
}
```

```go
package main

import (
	"encoding/json"
	"net/http"
)

func getFeeRatesFromAPI() (map[string]int, error) {
	resp, err := http.Get("https://mempool.space/api/v1/fees/recommended")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result map[string]int
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}
```

```javascript
async function getFeeRatesFromAPI() {
  const res = await fetch('https://mempool.space/api/v1/fees/recommended');
  const data = await res.json();
  return data; // { fastestFee, halfHourFee, hourFee } in sat/vB
}
```
:::

## Choosing a Confirmation Target

- **1–2 blocks**: High urgency; pay a premium (e.g. "fastest" from API or target 1 in `estimatesmartfee`).
- **3–6 blocks**: Normal payments; balance cost and speed.
- **6+ blocks**: Low urgency; often cheapest.

Use the same unit (sat/vB) when [calculating total fee](/docs/bitcoin-development/transactions) from estimated rate and transaction virtual size.

## Limitations

- **Reorgs**: Short reorgs can delay confirmation; estimates don't account for this.
- **Mempool churn**: A sudden spike in demand can make your estimate stale; consider refreshing close to broadcast.
- **Pruned nodes**: `estimatesmartfee` still works; it uses the mempool. If your node has no mempool (e.g. block-only), use an API or another node.

## Related Topics

- [Transaction Construction](/docs/bitcoin-development/transactions) - Using fee rate to set transaction fee
- [Transaction Fees](/docs/bitcoin/transaction-fees) - Fee market and RBF/CPFP
- [Mempool](/docs/mining/mempool) - How unconfirmed transactions are stored and selected
- [Coin Selection](/docs/bitcoin-development/coin-selection) - Selecting UTXOs with effective value and fee in mind

# Transaction Fees

Transaction fees are payments made to miners for including transactions in blocks. Understanding how fees work is essential for ensuring your transactions confirm in a timely manner.

## Why Fees Exist

Fees serve multiple purposes:

1. **Incentivize miners**: Reward miners for processing transactions
2. **Prevent spam**: Make it expensive to flood the network
3. **Prioritize transactions**: Higher fees = faster confirmation
4. **Economic security**: Fees will replace block rewards over time

---

## Fee Calculation

### Fee Rate

Fees are calculated based on **fee rate** (satoshis per virtual byte):

```text
Fee = Transaction Size (vbytes) × Fee Rate (sat/vB)

Example:
- Transaction size: 250 vbytes
- Fee rate: 10 sat/vB
- Total fee: 2,500 satoshis (0.000025 BTC)
```

For unit conversion (sats, BTC, etc.), see [Denominations](/philosophy/fundamentals/denominations) or the [Interactive Tools](/interactive-tools) hub. Estimate fee from transaction size with the [Fee Estimator](/interactive-tools/fee-estimator).

### Virtual Size (vbytes)

Since SegWit, transactions use **virtual size** instead of raw bytes:

```text
Virtual Size = Weight / 4

Where:
Weight = (Base Size × 4) + Total Size

Base Size: Transaction without witness data
Total Size: Transaction with witness data
```

---

## Fee Estimation

### Methods

Wallets estimate fees using several approaches:

1. **Mempool analysis**: Look at pending transactions
2. **Fee estimation APIs**: Services like mempool.space
3. **Bitcoin Core RPC**: `estimatesmartfee` command
4. **Historical data**: Analyze past fee patterns

### Fee Targets

Common confirmation targets:

| Target | Description | Typical Fee Rate |
|--------|-------------|-----------------|
| **Next block** | Highest priority | 50-200+ sat/vB |
| **3 blocks** | ~30 minutes | 20-50 sat/vB |
| **6 blocks** | ~1 hour | 10-20 sat/vB |
| **Economy** | No rush | 1-10 sat/vB |

---

## Code Examples

### Estimating Fees

:::code-group
```rust
use serde_json::json;
use reqwest;

async fn estimate_fee_rate() -> Result<u64, Box<dyn std::error::Error>> {
    let response = reqwest::get(
        "https://mempool.space/api/v1/fees/recommended"
    ).await?;
    
    let fees: serde_json::Value = response.json().await?;
    let fee_rate = fees["fastestFee"].as_u64().unwrap();
    
    Ok(fee_rate)
}
```

```python
import requests

def estimate_fee_rate():
    """Estimate fee rate from mempool.space API."""
    response = requests.get(
        "https://mempool.space/api/v1/fees/recommended"
    )
    fees = response.json()
    return fees["fastestFee"]  # sat/vB
```

```cpp
#include <curl/curl.h>
#include <json/json.h>

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* data) {
    data->append((char*)contents, size * nmemb);
    return size * nmemb;
}

int estimate_fee_rate() {
    CURL* curl = curl_easy_init();
    std::string response_data;
    
    curl_easy_setopt(curl, CURLOPT_URL, 
        "https://mempool.space/api/v1/fees/recommended");
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response_data);
    curl_easy_perform(curl);
    
    Json::Value root;
    Json::Reader reader;
    reader.parse(response_data, root);
    
    return root["fastestFee"].asInt();
}
```

```go
package main

import (
	"encoding/json"
	"io"
	"net/http"
)

type FeeRecommendation struct {
	FastestFee  int `json:"fastestFee"`
	HalfHourFee int `json:"halfHourFee"`
	HourFee     int `json:"hourFee"`
}

func estimateFeeRate() (int, error) {
	resp, err := http.Get("https://mempool.space/api/v1/fees/recommended")
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	var fees FeeRecommendation
	json.Unmarshal(body, &fees)
	
	return fees.FastestFee, nil
}
```

```javascript
async function estimateFeeRate() {
    const response = await fetch(
        'https://mempool.space/api/v1/fees/recommended'
    );
    const fees = await response.json();
    return fees.fastestFee; // sat/vB
}
```
:::

### Calculating Transaction Fee

:::code-group
```rust
fn calculate_fee(tx_size_vbytes: usize, fee_rate_sat_per_vb: u64) -> u64 {
    (tx_size_vbytes as u64) * fee_rate_sat_per_vb
}

fn calculate_fee_for_outputs(
    input_count: usize,
    output_count: usize,
    fee_rate: u64,
) -> u64 {
    // Estimate transaction size
    let base_size = 10; // Overhead
    let input_size = 148; // P2PKH input
    let output_size = 34; // P2PKH output
    
    let estimated_size = base_size + 
        (input_count * input_size) + 
        (output_count * output_size);
    
    calculate_fee(estimated_size, fee_rate)
}
```

```python
def calculate_fee(tx_size_vbytes, fee_rate_sat_per_vb):
    """Calculate fee for transaction."""
    return tx_size_vbytes * fee_rate_sat_per_vb

def calculate_fee_for_outputs(input_count, output_count, fee_rate):
    """Estimate fee based on input/output counts."""
    base_size = 10  # Overhead
    input_size = 148  # P2PKH input
    output_size = 34  # P2PKH output
    
    estimated_size = (base_size + 
                      (input_count * input_size) + 
                      (output_count * output_size))
    
    return calculate_fee(estimated_size, fee_rate)
```

```cpp
uint64_t calculate_fee(size_t tx_size_vbytes, uint64_t fee_rate_sat_per_vb) {
    return tx_size_vbytes * fee_rate_sat_per_vb;
}

uint64_t calculate_fee_for_outputs(
    size_t input_count,
    size_t output_count,
    uint64_t fee_rate
) {
    size_t base_size = 10;  // Overhead
    size_t input_size = 148;  // P2PKH input
    size_t output_size = 34;  // P2PKH output
    
    size_t estimated_size = base_size + 
        (input_count * input_size) + 
        (output_count * output_size);
    
    return calculate_fee(estimated_size, fee_rate);
}
```

```go
func calculateFee(txSizeVBytes int, feeRateSatPerVB int64) int64 {
    return int64(txSizeVBytes) * feeRateSatPerVB
}

func calculateFeeForOutputs(
    inputCount, outputCount int,
    feeRate int64,
) int64 {
    baseSize := 10  // Overhead
    inputSize := 148  // P2PKH input
    outputSize := 34  // P2PKH output
    
    estimatedSize := baseSize + 
        (inputCount * inputSize) + 
        (outputCount * outputSize)
    
    return calculateFee(estimatedSize, feeRate)
}
```

```javascript
function calculateFee(txSizeVBytes, feeRateSatPerVB) {
    return txSizeVBytes * feeRateSatPerVB;
}

function calculateFeeForOutputs(inputCount, outputCount, feeRate) {
    const baseSize = 10;  // Overhead
    const inputSize = 148;  // P2PKH input
    const outputSize = 34;  // P2PKH output
    
    const estimatedSize = baseSize + 
        (inputCount * inputSize) + 
        (outputCount * outputSize);
    
    return calculateFee(estimatedSize, feeRate);
}
```
:::

---

## Fee Bumping

When a transaction is stuck in the [mempool](/docs/mining/mempool) because the fee rate is too low, you can increase the effective fee using **Replace-by-Fee (RBF)** or **Child Pays for Parent (CPFP)**.

### Replace-by-Fee (RBF) and BIP 125

**RBF** allows replacing an unconfirmed [transaction](/docs/bitcoin/transaction-lifecycle) with a new version that pays higher fees. The replacement must spend the same inputs and generally the same outputs (with stricter rules in BIP 125).

#### BIP 125 Replaceability Rules

For a replacement to be accepted by [BIP 125](https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki)-compliant nodes:

1. **Replaceability signal**: The original transaction must signal that it is replaceable. This is done by setting the sequence of at least one input to a value below `0xfffffffe` (and not `0xffffffff`, which is used for locktime opt-out). In practice, `nSequence < 0xfffffffe` on any input makes the tx replaceable.

2. **Higher fee**: The replacement must pay a **higher total fee** than the original.

3. **Higher fee rate**: The replacement must have a **higher fee rate** (sat/vB) than the original.

4. **No new unconfirmed inputs**: All inputs must be either:
   - already in the mempool, or
   - confirmed in the chain.
   The replacement cannot add inputs that are themselves unconfirmed and not in the mempool (to prevent dependency chains that complicate replacement).

5. **Output and amount constraints**: The replacement cannot add new outputs, cannot remove outputs, and cannot lower any output amount. It can only change the fee (by reducing one or more output amounts or by adding/using extra inputs that are already confirmed or in the mempool).

#### Full RBF

**Full RBF** (Replace-By-Fee regardless of signaling) is a **policy** option on some nodes (including Bitcoin Core 24+ with `-mempoolfullrbf=1`). With full RBF, *any* unconfirmed transaction can be replaced by a higher-fee version, even if the original did not signal replaceability (sequence was `0xffffffff`). This is **not** consensus; it is a relay policy. Miners and node operators may or may not enable it. When enabled, it allows fee bumping of "non-RBF" transactions, but recipients of unconfirmed outputs should treat them as replaceable.

#### Replaceability in Wallets

- **Senders**: To allow RBF, wallets set `nSequence` to e.g. `0xfffffffd` (or lower) on at least one input. Many wallets enable this by default.
- **Receivers**: If you receive an unconfirmed payment, assume it can be double-spent or replaced until it has confirmations. For high-value accepts, wait for 1–6 confirmations.

### Child Pays for Parent (CPFP)

**CPFP** is used when you **cannot** replace the original (e.g., you are the **recipient** and don’t control the inputs, or the original is not RBF-signaling). You create a **child** transaction that spends an **output** of the stuck (parent) transaction and attach a high enough fee so that miners are willing to mine both parent and child together. Miners evaluate the **package** (parent + child) by the combined fee and combined size; a high-fee child makes the package profitable.

```text
Parent Transaction:
- Fee: 2 sat/vB (too low)
- Status: Stuck in mempool
- Has an output to you

Child Transaction:
- Spends the parent’s output to you
- Fee: e.g. 50 sat/vB
- Miner includes both; combined fee makes the package attractive
```

CPFP works only if you control an output of the parent (e.g., you received the payment). The child must be valid and, under typical package relay rules, the parent+child package must meet the node’s fee and size policies.

```text
[Parent tx stuck in mempool] --> [Child tx spends parent output] --> [High fee on child] --> [Miner includes both]
```

### Transaction Pinning

**Pinning** is a class of attacks where an attacker tries to *prevent* a victim’s transaction from being replaced or from being mined, for example:

- **RBF pinning**: The replacement is made to violate BIP 125 (e.g., by making the victim’s replacement depend on unconfirmed inputs that are not in the mempool, or by other rule games) so nodes reject it.
- **CPFP pinning**: The victim’s child (or the package) is made to fail package validation, or the attacker spends the same parent output in a way that blocks the victim’s child.

**Package relay** and **package RBF** (see below) are designed to make fee bumping more robust and to reduce pinning: for example, by allowing replacement of a *package* (parent + child) and by standardizing how packages are validated and relayed.

### Package Relay and Package RBF

**Package relay** (and related **package RBF** ideas) allow nodes to accept and relay a **package** of related transactions (e.g., parent + child) as a unit. The mempool and [block construction](/docs/mining/block-construction) logic can then:

- Evaluate the package’s total fee and total size when deciding to accept or to [mine](/docs/mining) it.
- In **package RBF**, allow a *replacement* that is itself a package (e.g., a new parent+child that replaces a previous parent, or that bumps the effective fee of an unconfirmed parent via a new child).

As of this writing, package relay and package RBF are in [BIP process](https://github.com/bitcoin/bips) and/or implemented as optional node policy (e.g., in Bitcoin Core). They are important for [Lightning](/docs/lightning) and other [Layer 2](/docs/advanced/sidechains) protocols that need to reliably fee-bump on-chain transactions.

### When to Use RBF vs CPFP

| Situation | Use |
|-----------|-----|
| You are the **sender** and control the inputs | **RBF**: Create a replacement that pays more (and meets BIP 125). |
| You are the **recipient** and the sender did not enable RBF or you can’t replace | **CPFP**: Spend the output you received with a high-fee child. |
| You use **Lightning** or other L2 | RBF and CPFP (and, where available, package RBF) are used by the implementation to bump commitment or [HTLC](/docs/lightning/routing/htlc) transactions. |

---

## Fee Market Dynamics

### Supply and Demand

```text
High Demand (many transactions):
- Mempool fills up
- Fees increase
- Users compete for block space

Low Demand (few transactions):
- Mempool empties
- Fees decrease
- Even low fees confirm quickly
```

### Historical Patterns

Fees fluctuate based on:

- **Network activity**: More users = higher fees
- **Block space competition**: Limited space = bidding war
- **Market events**: Price movements affect activity
- **Time of day**: Regional usage patterns

---

## Related Topics

- [Mempool](/docs/mining/mempool) - Where transactions wait
- [Block Visualizer](/interactive-tools/block-visualizer) - See transactions flowing into blocks
- [Block Construction](/docs/mining/block-construction) - How miners select transactions
- [SegWit](/docs/bitcoin/segwit) - Lower fees through weight units
- [Transaction Lifecycle](/docs/bitcoin/transaction-lifecycle) - Transaction states

---

## Resources

- [mempool.space](https://mempool.space) - Fee estimation and mempool visualization
- [Bitcoin Core RPC: estimatesmartfee](https://developer.bitcoin.org/reference/rpc/estimatesmartfee.html)

# Coin Selection

Coin selection is the process of choosing which UTXOs (Unspent Transaction Outputs) to spend when creating a Bitcoin transaction. This is a critical wallet function that affects transaction fees, privacy, and efficiency. For a deeper understanding of the UTXO model, see the [UTXO Model](/docs/fundamentals/utxos) documentation.

## The Challenge

Given:
- A set of available UTXOs
- A payment amount to send
- A target fee rate

Select UTXOs such that:
- Total input value > total output value
- Fee rate >= required minimum fee rate
- Transaction is valid and efficient

---

## Transaction Requirements

### Basic Structure

```
Transaction:
  Inputs: Selected UTXOs
  Outputs:
    - Payment output (destination + amount)
    - Change output (optional, back to wallet)
  Fee: Inputs - Outputs
```

### Fee Rate Calculation

```
Fee Rate = (Total Input Value - Total Output Value) / Virtual Transaction Size
```

**Virtual Transaction Size (vBytes):**
- Defined in BIP 141 (SegWit)
- Weight units / 4
- Accounts for witness data differently

### Effective Value

The **effective value** of a UTXO accounts for the cost to spend it:

```
effective_value = amount - (input_vbytes × fee_rate)
```

This is critical for coin selection: a small UTXO might have negative effective value at high fee rates.

:::code-group
```rust
/// Calculate effective value of a coin at a given fee rate
/// effective_value = amount - (input_vbytes * fee_rate)
fn effective_value(coin: &Coin, fee_rate: Decimal) -> Decimal {
    coin.amount - (input_vbytes(&coin.address) * fee_rate)
}

// Filter out coins with negative effective value
let useful_coins: Vec<Coin> = coins
    .iter()
    .filter(|c| effective_value(c, fee_rate) > Decimal::ZERO)
    .cloned()
    .collect();
```

```python
def effective_value(coin: dict, fee_rate: float) -> float:
    """Calculate effective value of a UTXO at a given fee rate.
    
    Args:
        coin: UTXO with 'amount' and 'address' fields
        fee_rate: Fee rate in BTC/vB
    
    Returns:
        Effective value (can be negative for dust UTXOs)
    """
    spend_cost = input_vbytes(coin['address']) * fee_rate
    return coin['amount'] - spend_cost

# Example: At 10 sat/vB, filter out negative effective value UTXOs
fee_rate = 0.0000001  # 10 sat/vB in BTC/vB
useful_coins = [c for c in coins if effective_value(c, fee_rate) > 0]
```

```cpp
#include <vector>
#include <algorithm>

/**
 * Calculate effective value of a coin at a given fee rate
 * effective_value = amount - (input_vbytes * fee_rate)
 */
double effective_value(const Coin& coin, double fee_rate) {
    return coin.amount - (input_vbytes(coin.address) * fee_rate);
}

// Filter out coins with negative effective value
std::vector<Coin> useful_coins;
std::copy_if(coins.begin(), coins.end(), std::back_inserter(useful_coins),
    [fee_rate](const Coin& c) {
        return effective_value(c, fee_rate) > 0;
    });
```

```go
package main

import (
	"fmt"
	"strings"
)

type Coin struct {
	Amount  float64
	Address string
}

// EffectiveValue calculates effective value of a coin at a given fee rate
// effective_value = amount - (input_vbytes * fee_rate)
func EffectiveValue(coin Coin, feeRate float64) float64 {
	spendCost := float64(InputVbytes(coin.Address)) * feeRate
	return coin.Amount - spendCost
}

// InputVbytes calculates virtual bytes for spending a UTXO based on address type
func InputVbytes(address string) float64 {
	if strings.HasPrefix(address, "bc1p") || strings.HasPrefix(address, "tb1p") ||
		strings.HasPrefix(address, "bcrt1p") {
		return 57.5 // Taproot (p2tr)
	} else if strings.HasPrefix(address, "bc1q") || strings.HasPrefix(address, "tb1q") ||
		strings.HasPrefix(address, "bcrt1q") {
		return 68.0 // Native SegWit (p2wpkh)
	} else if strings.HasPrefix(address, "2") || strings.HasPrefix(address, "3") {
		return 91.0 // Nested SegWit (p2sh-p2wpkh)
	}
	return 148.0 // Legacy (p2pkh)
}

// OutputVbytes calculates virtual bytes for an output based on address type
func OutputVbytes(address string) float64 {
	if strings.HasPrefix(address, "bc1p") || strings.HasPrefix(address, "tb1p") ||
		strings.HasPrefix(address, "bcrt1p") {
		return 43.0 // Taproot
	} else if strings.HasPrefix(address, "bc1q") || strings.HasPrefix(address, "tb1q") ||
		strings.HasPrefix(address, "bcrt1q") {
		return 31.0 // Native SegWit
	} else if strings.HasPrefix(address, "2") || strings.HasPrefix(address, "3") {
		return 32.0 // P2SH
	}
	return 34.0 // Legacy
}

func main() {
	// Example: At 10 sat/vB, filter out negative effective value UTXOs
	feeRate := 0.0000001 // 10 sat/vB in BTC/vB
	coins := []Coin{
		{Amount: 0.001, Address: "bc1q..."},
		{Amount: 0.0001, Address: "1..."},
	}

	var usefulCoins []Coin
	for _, coin := range coins {
		if EffectiveValue(coin, feeRate) > 0 {
			usefulCoins = append(usefulCoins, coin)
		}
	}

	fmt.Printf("Useful coins: %d\n", len(usefulCoins))
}
```

```javascript
/**
 * Calculate effective value of a coin at a given fee rate
 * effective_value = amount - (input_vbytes * fee_rate)
 * 
 * @param {Object} coin - UTXO with 'amount' and 'address' fields
 * @param {number} feeRate - Fee rate in BTC/vB
 * @returns {number} Effective value (can be negative for dust UTXOs)
 */
function effectiveValue(coin, feeRate) {
    const spendCost = inputVbytes(coin.address) * feeRate;
    return coin.amount - spendCost;
}

// Example: At 10 sat/vB, filter out negative effective value UTXOs
const feeRate = 0.0000001; // 10 sat/vB in BTC/vB
const usefulCoins = coins.filter(c => effectiveValue(c, feeRate) > 0);
```
:::

---

## UTXO Characteristics

### Different Script Types

UTXOs can have different script types, affecting transaction size:

| Type | Address Prefix | Input Size |
|------|---------------|------------|
| P2PKH (Legacy) | `1...` | ~148 vB |
| P2SH | `3...` | ~91 vB |
| P2WPKH (SegWit) | `bc1q...` | ~68 vB |
| P2TR (Taproot) | `bc1p...` | ~58 vB |

:::code-group
```rust
fn input_vbytes(address: &str) -> Decimal {
    if address.starts_with("bc1p") || address.starts_with("tb1p") {
        dec!(57.5)   // Taproot (p2tr)
    } else if address.starts_with("bc1q") || address.starts_with("tb1q") {
        dec!(68)     // Native SegWit (p2wpkh)
    } else if address.starts_with("2") || address.starts_with("3") {
        dec!(91)     // Nested SegWit (p2sh-p2wpkh)
    } else {
        dec!(148)    // Legacy (p2pkh)
    }
}

fn output_vbytes(address: &str) -> Decimal {
    if address.starts_with("bc1p") || address.starts_with("tb1p") {
        dec!(43)     // Taproot
    } else if address.starts_with("bc1q") || address.starts_with("tb1q") {
        dec!(31)     // Native SegWit
    } else if address.starts_with("2") || address.starts_with("3") {
        dec!(32)     // P2SH
    } else {
        dec!(34)     // Legacy
    }
}
```

```python
def input_vbytes(address: str) -> float:
    """Calculate virtual bytes for spending a UTXO based on address type."""
    if address.startswith(('bc1p', 'tb1p', 'bcrt1p')):
        return 57.5   # Taproot (p2tr)
    elif address.startswith(('bc1q', 'tb1q', 'bcrt1q')):
        return 68.0   # Native SegWit (p2wpkh)
    elif address.startswith(('2', '3')):
        return 91.0   # Nested SegWit (p2sh-p2wpkh)
    else:
        return 148.0  # Legacy (p2pkh)

def output_vbytes(address: str) -> float:
    """Calculate virtual bytes for an output based on address type."""
    if address.startswith(('bc1p', 'tb1p', 'bcrt1p')):
        return 43.0   # Taproot
    elif address.startswith(('bc1q', 'tb1q', 'bcrt1q')):
        return 31.0   # Native SegWit
    elif address.startswith(('2', '3')):
        return 32.0   # P2SH
    else:
        return 34.0   # Legacy
```

```cpp
#include <string>

/**
 * Calculate virtual bytes for spending a UTXO based on address type.
 */
double input_vbytes(const std::string& address) {
    if (address.rfind("bc1p", 0) == 0 || address.rfind("tb1p", 0) == 0 || 
        address.rfind("bcrt1p", 0) == 0) {
        return 57.5;   // Taproot (p2tr)
    } else if (address.rfind("bc1q", 0) == 0 || address.rfind("tb1q", 0) == 0 || 
               address.rfind("bcrt1q", 0) == 0) {
        return 68.0;   // Native SegWit (p2wpkh)
    } else if (address[0] == '2' || address[0] == '3') {
        return 91.0;   // Nested SegWit (p2sh-p2wpkh)
    } else {
        return 148.0;  // Legacy (p2pkh)
    }
}

/**
 * Calculate virtual bytes for an output based on address type.
 */
double output_vbytes(const std::string& address) {
    if (address.rfind("bc1p", 0) == 0 || address.rfind("tb1p", 0) == 0 || 
        address.rfind("bcrt1p", 0) == 0) {
        return 43.0;   // Taproot
    } else if (address.rfind("bc1q", 0) == 0 || address.rfind("tb1q", 0) == 0 || 
               address.rfind("bcrt1q", 0) == 0) {
        return 31.0;   // Native SegWit
    } else if (address[0] == '2' || address[0] == '3') {
        return 32.0;   // P2SH
    } else {
        return 34.0;   // Legacy
    }
}
```

```javascript
/**
 * Calculate virtual bytes for spending a UTXO based on address type.
 * @param {string} address - Bitcoin address
 * @returns {number} Virtual bytes required
 */
function inputVbytes(address) {
    if (address.startsWith('bc1p') || address.startsWith('tb1p') || 
        address.startsWith('bcrt1p')) {
        return 57.5;   // Taproot (p2tr)
    } else if (address.startsWith('bc1q') || address.startsWith('tb1q') || 
               address.startsWith('bcrt1q')) {
        return 68.0;   // Native SegWit (p2wpkh)
    } else if (address.startsWith('2') || address.startsWith('3')) {
        return 91.0;   // Nested SegWit (p2sh-p2wpkh)
    } else {
        return 148.0;  // Legacy (p2pkh)
    }
}

/**
 * Calculate virtual bytes for an output based on address type.
 * @param {string} address - Bitcoin address
 * @returns {number} Virtual bytes required
 */
function outputVbytes(address) {
    if (address.startsWith('bc1p') || address.startsWith('tb1p') || 
        address.startsWith('bcrt1p')) {
        return 43.0;   // Taproot
    } else if (address.startsWith('bc1q') || address.startsWith('tb1q') || 
               address.startsWith('bcrt1q')) {
        return 31.0;   // Native SegWit
    } else if (address.startsWith('2') || address.startsWith('3')) {
        return 32.0;   // P2SH
    } else {
        return 34.0;   // Legacy
    }
}
```
:::

### Example UTXOs

```
UTXO 1: P2WPKH, 1.5 BTC
UTXO 2: P2TR, 0.8 BTC
UTXO 3: P2PKH, 0.3 BTC
```

**Transaction Size Impact:**
- Using UTXO 1: Smaller transaction (SegWit)
- Using UTXO 3: Larger transaction (Legacy)
- Same fee rate = different absolute fees

---

## Coin Selection Strategies

### 1. Largest First (Greedy)

**Algorithm:**
1. Sort UTXOs by value (largest first)
2. Select UTXOs until sum >= payment + estimated fee
3. Create change output if needed

:::code-group
```rust
fn select_largest_first(
    coins: &[Coin],
    target: Decimal,
    fee_rate: Decimal
) -> Result<(Vec<Coin>, Decimal), String> {
    // Sort by amount descending
    let mut sorted: Vec<Coin> = coins.to_vec();
    sorted.sort_by(|a, b| b.amount.partial_cmp(&a.amount).unwrap());
    
    let mut selected: Vec<Coin> = Vec::new();
    let mut total = Decimal::ZERO;
    
    for coin in sorted {
        selected.push(coin.clone());
        total += coin.amount;
        
        let estimated_fee = estimate_fee(selected.len(), fee_rate);
        
        if total >= target + estimated_fee {
            return Ok((selected, total - target - estimated_fee));
        }
    }
    
    Err("Insufficient funds".to_string())
}
```

```python
def select_largest_first(coins, target_amount, fee_rate):
    """Select coins using largest-first greedy algorithm."""
    # Sort by amount descending
    sorted_coins = sorted(coins, key=lambda c: c['amount'], reverse=True)
    
    selected = []
    total = Decimal('0')
    
    for coin in sorted_coins:
        selected.append(coin)
        total += coin['amount']
        
        # Estimate fee based on selected inputs
        estimated_fee = estimate_fee(len(selected), fee_rate)
        
        if total >= target_amount + estimated_fee:
            return selected, total - target_amount - estimated_fee
    
    raise ValueError("Insufficient funds")
```

```cpp
#include <vector>
#include <algorithm>
#include <stdexcept>
#include <utility>

/**
 * Select coins using largest-first greedy algorithm.
 * @return pair of (selected coins, change amount)
 */
std::pair<std::vector<Coin>, double> select_largest_first(
    std::vector<Coin> coins,
    double target_amount,
    double fee_rate
) {
    // Sort by amount descending
    std::sort(coins.begin(), coins.end(), [](const Coin& a, const Coin& b) {
        return a.amount > b.amount;
    });
    
    std::vector<Coin> selected;
    double total = 0.0;
    
    for (const auto& coin : coins) {
        selected.push_back(coin);
        total += coin.amount;
        
        // Estimate fee based on selected inputs
        double estimated_fee = estimate_fee(selected.size(), fee_rate);
        
        if (total >= target_amount + estimated_fee) {
            return {selected, total - target_amount - estimated_fee};
        }
    }
    
    throw std::runtime_error("Insufficient funds");
}
```

```go
package main

import (
	"fmt"
	"sort"
)

type Coin struct {
	Amount  float64
	Address string
}

// SelectLargestFirst selects coins using largest-first greedy algorithm
func SelectLargestFirst(coins []Coin, targetAmount float64, feeRate float64) ([]Coin, float64, error) {
	// Sort by amount descending
	sortedCoins := make([]Coin, len(coins))
	copy(sortedCoins, coins)
	sort.Slice(sortedCoins, func(i, j int) bool {
		return sortedCoins[i].Amount > sortedCoins[j].Amount
	})

	var selected []Coin
	total := 0.0

	for _, coin := range sortedCoins {
		selected = append(selected, coin)
		total += coin.Amount

		// Estimate fee based on selected inputs (simplified)
		estimatedFee := EstimateFee(len(selected), feeRate)

		if total >= targetAmount+estimatedFee {
			change := total - targetAmount - estimatedFee
			return selected, change, nil
		}
	}

	return nil, 0, fmt.Errorf("insufficient funds")
}

// EstimateFee estimates transaction fee (simplified)
func EstimateFee(inputCount int, feeRate float64) float64 {
	// Simplified: assume 68 vB per input + 31 vB per output
	baseSize := 10.0 // Base transaction size
	inputSize := float64(inputCount) * 68.0
	outputSize := 31.0 * 2 // Assume 2 outputs
	totalVbytes := baseSize + inputSize + outputSize
	return totalVbytes * feeRate
}

func main() {
	coins := []Coin{
		{Amount: 0.5, Address: "bc1q..."},
		{Amount: 0.3, Address: "bc1q..."},
		{Amount: 0.1, Address: "bc1q..."},
	}

	selected, change, err := SelectLargestFirst(coins, 0.4, 0.0000001)
	if err != nil {
		panic(err)
	}

	fmt.Printf("Selected %d coins, change: %.8f BTC\n", len(selected), change)
}
```

```javascript
/**
 * Select coins using largest-first greedy algorithm.
 * @param {Array} coins - Array of coin objects with 'amount' property
 * @param {number} targetAmount - Target amount to reach
 * @param {number} feeRate - Fee rate for estimation
 * @returns {Object} Object with 'selected' coins and 'change' amount
 */
function selectLargestFirst(coins, targetAmount, feeRate) {
    // Sort by amount descending
    const sortedCoins = [...coins].sort((a, b) => b.amount - a.amount);
    
    const selected = [];
    let total = 0;
    
    for (const coin of sortedCoins) {
        selected.push(coin);
        total += coin.amount;
        
        // Estimate fee based on selected inputs
        const estimatedFee = estimateFee(selected.length, feeRate);
        
        if (total >= targetAmount + estimatedFee) {
            return {
                selected,
                change: total - targetAmount - estimatedFee
            };
        }
    }
    
    throw new Error('Insufficient funds');
}
```
:::

**Pros:**
- Simple to implement
- Minimizes number of inputs
- Fast execution

**Cons:**
- May overpay fees
- Poor privacy (uses largest UTXOs)
- May create dust change

### 2. Smallest First

**Algorithm:**
1. Sort UTXOs by value (smallest first)
2. Select UTXOs until sum >= payment + estimated fee
3. Create change output if needed

**Pros:**
- Consolidates small UTXOs
- Better privacy (uses smaller UTXOs)
- Cleans up wallet

**Cons:**
- More inputs = larger transaction
- Higher fees for many inputs
- Slower (more inputs to sign)

### 3. Exact Match

**Algorithm:**
1. Look for UTXO that exactly matches payment + fee
2. If found, use it
3. Otherwise, fall back to other strategy

**Pros:**
- No change output needed
- Optimal for specific cases
- Clean transaction

**Cons:**
- Rarely finds exact match
- Usually requires fallback

### 4. Branch and Bound

**Algorithm:**
1. Try all combinations of UTXOs
2. Find combination that minimizes:
   - Transaction size
   - Change amount
   - Number of inputs
3. Select optimal combination

**Pros:**
- Optimal solution
- Minimizes fees
- Best privacy

**Cons:**
- Computationally expensive
- Slow for many UTXOs
- May not be practical

### 5. Random Selection

**Algorithm:**
1. Randomly select UTXOs
2. Continue until sum >= payment + fee
3. Create change if needed

**Pros:**
- Good privacy
- Unpredictable pattern
- Simple implementation

**Cons:**
- May not be optimal
- Could select inefficient combination

---

## Fee Calculation

### Estimating Transaction Size

**Base Size:**
- Transaction header: 10 bytes
- Input count: 1-9 bytes (varint)
- Output count: 1-9 bytes (varint)

**Input Size:**
- Previous output: 36 bytes
- Script length: 1-9 bytes (varint)
- Script: Variable (depends on script type)
- Sequence: 4 bytes

**Output Size:**
- Value: 8 bytes
- Script length: 1-9 bytes (varint)
- Script: Variable (typically 22-34 bytes)

**Witness Size (SegWit):**
- Witness data: Variable
- Counted differently in weight calculation

### Virtual Size Calculation

```
Weight = (Base Size × 3) + Total Size
Virtual Size = Weight / 4
```

:::code-group
```rust
/// Calculate the total virtual size of a transaction
/// tx_vsize = 10.5 (overhead) + sum(input_vbytes) + sum(output_vbytes)
fn calculate_tx_vsize(inputs: &[Coin], output_addresses: &[&str]) -> Decimal {
    let overhead = dec!(10.5);
    
    let input_size: Decimal = inputs.iter()
        .map(|c| input_vbytes(&c.address))
        .sum();
    
    let output_size: Decimal = output_addresses.iter()
        .map(|addr| output_vbytes(addr))
        .sum();
    
    // Ceiling the vsize to ensure we don't underestimate
    (overhead + input_size + output_size).ceil()
}
```

```python
def calculate_tx_vsize(inputs: list, output_addresses: list) -> int:
    """Calculate virtual size of a transaction.
    
    Args:
        inputs: List of UTXOs to spend
        output_addresses: List of destination addresses
    
    Returns:
        Virtual size in vbytes (rounded up)
    """
    import math
    
    # Transaction overhead: ~10.5 vB
    overhead = 10.5
    
    # Sum input sizes based on address types
    input_size = sum(input_vbytes(coin['address']) for coin in inputs)
    
    # Sum output sizes based on address types
    output_size = sum(output_vbytes(addr) for addr in output_addresses)
    
    # Round up to be safe
    return math.ceil(overhead + input_size + output_size)
```

```cpp
#include <vector>
#include <string>
#include <cmath>
#include <numeric>

/**
 * Calculate the total virtual size of a transaction
 * tx_vsize = 10.5 (overhead) + sum(input_vbytes) + sum(output_vbytes)
 */
int calculate_tx_vsize(
    const std::vector<Coin>& inputs,
    const std::vector<std::string>& output_addresses
) {
    // Transaction overhead: ~10.5 vB
    double overhead = 10.5;
    
    // Sum input sizes based on address types
    double input_size = std::accumulate(inputs.begin(), inputs.end(), 0.0,
        [](double sum, const Coin& coin) {
            return sum + input_vbytes(coin.address);
        });
    
    // Sum output sizes based on address types
    double output_size = std::accumulate(output_addresses.begin(), output_addresses.end(), 0.0,
        [](double sum, const std::string& addr) {
            return sum + output_vbytes(addr);
        });
    
    // Ceiling the vsize to ensure we don't underestimate
    return static_cast<int>(std::ceil(overhead + input_size + output_size));
}
```

```go
package main

import (
	"fmt"
	"math"
	"strings"
)

type Coin struct {
	Amount  float64
	Address string
}

// CalculateTxVsize calculates the total virtual size of a transaction
// tx_vsize = 10.5 (overhead) + sum(input_vbytes) + sum(output_vbytes)
func CalculateTxVsize(inputs []Coin, outputAddresses []string) int {
	// Transaction overhead: ~10.5 vB
	overhead := 10.5

	// Sum input sizes based on address types
	var inputSize float64
	for _, coin := range inputs {
		inputSize += InputVbytes(coin.Address)
	}

	// Sum output sizes based on address types
	var outputSize float64
	for _, addr := range outputAddresses {
		outputSize += OutputVbytes(addr)
	}

	// Ceiling the vsize to ensure we don't underestimate
	return int(math.Ceil(overhead + inputSize + outputSize))
}

// InputVbytes calculates virtual bytes for spending a UTXO based on address type
func InputVbytes(address string) float64 {
	if strings.HasPrefix(address, "bc1p") || strings.HasPrefix(address, "tb1p") ||
		strings.HasPrefix(address, "bcrt1p") {
		return 57.5 // Taproot (p2tr)
	} else if strings.HasPrefix(address, "bc1q") || strings.HasPrefix(address, "tb1q") ||
		strings.HasPrefix(address, "bcrt1q") {
		return 68.0 // Native SegWit (p2wpkh)
	} else if strings.HasPrefix(address, "2") || strings.HasPrefix(address, "3") {
		return 91.0 // Nested SegWit (p2sh-p2wpkh)
	}
	return 148.0 // Legacy (p2pkh)
}

// OutputVbytes calculates virtual bytes for an output based on address type
func OutputVbytes(address string) float64 {
	if strings.HasPrefix(address, "bc1p") || strings.HasPrefix(address, "tb1p") ||
		strings.HasPrefix(address, "bcrt1p") {
		return 43.0 // Taproot
	} else if strings.HasPrefix(address, "bc1q") || strings.HasPrefix(address, "tb1q") ||
		strings.HasPrefix(address, "bcrt1q") {
		return 31.0 // Native SegWit
	} else if strings.HasPrefix(address, "2") || strings.HasPrefix(address, "3") {
		return 32.0 // P2SH
	}
	return 34.0 // Legacy
}

func main() {
	inputs := []Coin{
		{Amount: 0.5, Address: "bc1q..."},
		{Amount: 0.3, Address: "bc1q..."},
	}
	outputs := []string{"bc1q...", "bc1q..."}

	vsize := CalculateTxVsize(inputs, outputs)
	fmt.Printf("Transaction vsize: %d vbytes\n", vsize)
}
```

```javascript
/**
 * Calculate the total virtual size of a transaction
 * tx_vsize = 10.5 (overhead) + sum(input_vbytes) + sum(output_vbytes)
 * 
 * @param {Array} inputs - List of UTXOs to spend
 * @param {Array} outputAddresses - List of destination addresses
 * @returns {number} Virtual size in vbytes (rounded up)
 */
function calculateTxVsize(inputs, outputAddresses) {
    // Transaction overhead: ~10.5 vB
    const overhead = 10.5;
    
    // Sum input sizes based on address types
    const inputSize = inputs.reduce(
        (sum, coin) => sum + inputVbytes(coin.address), 0
    );
    
    // Sum output sizes based on address types
    const outputSize = outputAddresses.reduce(
        (sum, addr) => sum + outputVbytes(addr), 0
    );
    
    // Ceiling the vsize to ensure we don't underestimate
    return Math.ceil(overhead + inputSize + outputSize);
}
```
:::

### Fee Calculation Example

```
Payment: 1.0 BTC
Fee Rate: 1 sat/vB

Selected UTXOs:
  - UTXO 1 (P2WPKH): 1.2 BTC
  - UTXO 2 (P2TR): 0.5 BTC

Transaction Size: 250 vBytes
Fee: 250 sats
Change: 1.7 - 1.0 - 0.0000025 = 0.6999975 BTC
```

---

## Change Output Creation

### When to Create Change

Create change output if:
- Selected UTXOs > Payment + Fee + Dust Threshold
- Change amount > dust threshold (typically 546 sats)

### Dust Threshold

Dust outputs are uneconomical to spend:
- **Standard**: 546 sats
- **Rationale**: Fee to spend would exceed value
- **Policy**: Many nodes reject dust outputs

### Change Output Optimization

**Options:**
1. **Create change**: If amount > dust threshold
2. **Donate to miner**: If amount < dust threshold
3. **Increase payment**: If change would be dust

---

## Implementation Considerations

### Iterative Approach

1. **Estimate fee**: Based on initial UTXO selection
2. **Select UTXOs**: Using chosen strategy
3. **Calculate actual fee**: Based on actual transaction size
4. **Adjust if needed**: If fee doesn't meet target

### Fee Rate Targets

**Common Fee Rates:**
- **Low priority**: 1-5 sat/vB
- **Medium priority**: 5-10 sat/vB
- **High priority**: 10-50 sat/vB
- **Urgent**: 50+ sat/vB

### Validation

Before finalizing transaction:
1. **Verify inputs**: Ensure UTXOs are still unspent
2. **Check balance**: Ensure sufficient funds
3. **Validate fee**: Ensure fee rate meets target
4. **Check size**: Ensure transaction is valid size

---

## Best Practices

### For Wallet Developers

1. **Use SegWit**: Prefer SegWit UTXOs (smaller size)
2. **Minimize inputs**: Fewer inputs = smaller transaction
3. **Optimize change**: Avoid dust change outputs
4. **Privacy**: Consider privacy implications
5. **Fee estimation**: Accurate fee estimation is critical

### For Users

1. **Consolidate UTXOs**: Periodically consolidate small UTXOs
2. **Use SegWit**: Prefer SegWit addresses
3. **Monitor fees**: Be aware of current fee rates
4. **Batch payments**: Combine multiple payments when possible

---

## Common Issues

### Insufficient Funds

**Problem**: Selected UTXOs don't cover payment + fee

**Solution**:
- Select more UTXOs
- Reduce payment amount
- Wait for more funds

### Fee Too Low

**Problem**: Calculated fee rate below target

**Solution**:
- Select fewer UTXOs (if possible)
- Increase fee manually
- Use higher fee rate

### Dust Change

**Problem**: Change output would be dust

**Solution**:
- Donate to miner (include in fee)
- Increase payment amount
- Select different UTXOs

---

## Summary

Coin selection is a critical wallet function:

- **Multiple strategies**: Different approaches for different goals
- **Fee optimization**: Balance between fees and efficiency
- **Privacy considerations**: UTXO selection affects privacy
- **Transaction sizing**: Different script types affect size
- **Change management**: Handle change outputs appropriately

Understanding coin selection helps build efficient and user-friendly Bitcoin wallets.

---

## Related Topics

- [Bitcoin Wallets](/docs/wallets) - Introduction to Bitcoin wallets
- [Transaction Creation](/docs/wallets/transactions) - How to create and sign transactions
- [Address Types](/docs/wallets/address-types) - Understanding different Bitcoin address formats
- [Mempool](/docs/mining/mempool) - How unconfirmed transactions are stored and prioritized

# Block Subsidy

The Bitcoin block subsidy is the amount of new Bitcoin created with each block. It follows a predictable mathematical formula that halves every 210,000 blocks, creating Bitcoin's fixed supply schedule.

## Block Reward

The block reward is what the miner receives for mining a valid block: the **block subsidy** (new bitcoin created) plus the [transaction fees](/docs/bitcoin/transaction-fees) from all transactions included in the block. Over time, the subsidy shrinks ([halving](/docs/history/halvings) every 210,000 blocks) and fees will make up a larger share of miner revenue.

## The Equation

### Mathematical Formula

```
Block Subsidy = 50 / (2^halvings)

Where:
  halvings = floor(block_height / 210,000)
```

### Bitcoin Core Implementation

In Bitcoin Core (`validation.cpp`), the subsidy is calculated using bit shifting for efficiency:

```cpp
CAmount GetBlockSubsidy(int nHeight, const Consensus::Params& consensusParams)
{
    int halvings = nHeight / consensusParams.nSubsidyHalvingInterval;
    // Force block reward to zero when right shift is undefined.
    if (halvings >= 64)
        return 0;

    CAmount nSubsidy = 50 * COIN;
    // Subsidy is cut in half every 210,000 blocks which will occur approximately every 4 years.
    nSubsidy >>= halvings;
    return nSubsidy;
}
```

The right bit shift (`>>=`) divides by 2 for each halving, which is equivalent to the mathematical formula but more efficient.

### Code Implementation

:::code-group
```rust
/// Calculate block subsidy for any block height.
/// Returns subsidy in BTC.
fn get_block_subsidy(block_height: u64) -> f64 {
    let halvings = block_height / 210_000;
    if halvings >= 64 {
        return 0.0;
    }
    50.0 / 2.0_f64.powi(halvings as i32)
}

/// Calculate block subsidy in satoshis (more precise).
fn get_block_subsidy_sats(block_height: u64) -> u64 {
    let halvings = block_height / 210_000;
    if halvings >= 64 {
        return 0;
    }
    let initial_subsidy: u64 = 50 * 100_000_000; // 50 BTC in satoshis
    initial_subsidy >> halvings
}

fn main() {
    println!("Block 0: {} BTC", get_block_subsidy(0));
    println!("Block 210,000: {} BTC", get_block_subsidy(210_000));
    println!("Block 840,000: {} BTC", get_block_subsidy(840_000));
}
```

```python
def get_block_subsidy(block_height: int) -> float:
    """
    Calculate block subsidy for any block height.
    Returns subsidy in BTC.
    """
    halvings = block_height // 210_000
    if halvings >= 64:
        return 0.0
    return 50.0 / (2 ** halvings)

def get_block_subsidy_sats(block_height: int) -> int:
    """Calculate block subsidy in satoshis (more precise)."""
    halvings = block_height // 210_000
    if halvings >= 64:
        return 0
    initial_subsidy = 50 * 100_000_000  # 50 BTC in satoshis
    return initial_subsidy >> halvings

# Examples
print(f"Block 0: {get_block_subsidy(0)} BTC")
print(f"Block 210,000: {get_block_subsidy(210_000)} BTC")
print(f"Block 840,000: {get_block_subsidy(840_000)} BTC")
```

```cpp
#include <iostream>
#include <cstdint>
#include <cmath>

/**
 * Calculate block subsidy for any block height.
 * Returns subsidy in BTC.
 */
double get_block_subsidy(uint64_t block_height) {
    uint64_t halvings = block_height / 210000;
    if (halvings >= 64) {
        return 0.0;
    }
    return 50.0 / std::pow(2.0, static_cast<double>(halvings));
}

/**
 * Calculate block subsidy in satoshis (more precise).
 */
uint64_t get_block_subsidy_sats(uint64_t block_height) {
    uint64_t halvings = block_height / 210000;
    if (halvings >= 64) {
        return 0;
    }
    uint64_t initial_subsidy = 50ULL * 100000000ULL; // 50 BTC in satoshis
    return initial_subsidy >> halvings;
}

int main() {
    std::cout << "Block 0: " << get_block_subsidy(0) << " BTC" << std::endl;
    std::cout << "Block 210,000: " << get_block_subsidy(210000) << " BTC" << std::endl;
    std::cout << "Block 840,000: " << get_block_subsidy(840000) << " BTC" << std::endl;
    return 0;
}
```

```go
package main

import (
	"fmt"
	"math"
)

// GetBlockSubsidy calculates block subsidy for any block height.
// Returns subsidy in BTC.
func GetBlockSubsidy(blockHeight uint64) float64 {
	halvings := blockHeight / 210_000
	if halvings >= 64 {
		return 0.0
	}
	return 50.0 / math.Pow(2.0, float64(halvings))
}

// GetBlockSubsidySats calculates block subsidy in satoshis (more precise).
func GetBlockSubsidySats(blockHeight uint64) uint64 {
	halvings := blockHeight / 210_000
	if halvings >= 64 {
		return 0
	}
	initialSubsidy := uint64(50 * 100_000_000) // 50 BTC in satoshis
	return initialSubsidy >> halvings
}

func main() {
	fmt.Printf("Block 0: %.8f BTC\n", GetBlockSubsidy(0))
	fmt.Printf("Block 210,000: %.8f BTC\n", GetBlockSubsidy(210_000))
	fmt.Printf("Block 840,000: %.8f BTC\n", GetBlockSubsidy(840_000))
}
```

```javascript
/**
 * Calculate block subsidy for any block height.
 * Returns subsidy in BTC.
 */
function getBlockSubsidy(blockHeight) {
    const halvings = Math.floor(blockHeight / 210000);
    if (halvings >= 64) {
        return 0;
    }
    return 50.0 / Math.pow(2, halvings);
}

/**
 * Calculate block subsidy in satoshis (more precise).
 * Uses BigInt for precision with large numbers.
 */
function getBlockSubsidySats(blockHeight) {
    const halvings = Math.floor(blockHeight / 210000);
    if (halvings >= 64) {
        return 0n;
    }
    const initialSubsidy = 50n * 100_000_000n; // 50 BTC in satoshis
    return initialSubsidy >> BigInt(halvings);
}

// Examples
console.log(`Block 0: ${getBlockSubsidy(0)} BTC`);
console.log(`Block 210,000: ${getBlockSubsidy(210000)} BTC`);
console.log(`Block 840,000: ${getBlockSubsidy(840000)} BTC`);
```
:::

---

## Halving Schedule

| Halving | Block Height | Date | Subsidy | Total Mined |
|---------|--------------|------|---------|-------------|
| 0 (Genesis) | 0 | Jan 2009 | 50 BTC | 0 |
| 1 | 210,000 | Nov 2012 | 25 BTC | 10,500,000 |
| 2 | 420,000 | Jul 2016 | 12.5 BTC | 15,750,000 |
| 3 | 630,000 | May 2020 | 6.25 BTC | 18,375,000 |
| 4 | 840,000 | Apr 2024 | 3.125 BTC | 19,687,500 |
| 5 | 1,050,000 | ~2028 | 1.5625 BTC | 20,343,750 |
| 6 | 1,260,000 | ~2032 | 0.78125 BTC | 20,671,875 |

### Example Calculations

**Block 0 (Genesis Block):**
```
halvings = 0 / 210,000 = 0
subsidy = 50 / (2^0) = 50 BTC
```

**Block 840,000 (Fourth Halving):**
```
halvings = 840,000 / 210,000 = 4
subsidy = 50 / (2^4) = 3.125 BTC
```

---

## Total Supply

The total Bitcoin supply follows a geometric series that converges to exactly 21 million BTC:

```
Total Supply = 210,000 blocks × 50 BTC × (1 + 1/2 + 1/4 + 1/8 + ...)
             = 210,000 × 50 × 2
             = 21,000,000 BTC
```

### Why 21 Million?

The limit arises from:
- Initial subsidy: 50 BTC
- Halving interval: 210,000 blocks
- Geometric series sum: 50 × 210,000 × 2 = 21,000,000

After approximately 64 halvings (around year 2140), the subsidy drops below 1 satoshi and becomes zero.

---

## Utility Functions

### Calculate Total Supply Up to Block

:::code-group
```rust
fn total_supply_up_to_block(block_height: u64) -> f64 {
    let mut total = 0.0;
    let mut current = 0u64;
    
    while current <= block_height {
        let halvings = current / 210_000;
        if halvings >= 64 { break; }
        
        let period_end = ((halvings + 1) * 210_000).min(block_height + 1);
        let blocks = period_end - (halvings * 210_000);
        let subsidy = 50.0 / 2.0_f64.powi(halvings as i32);
        
        total += blocks as f64 * subsidy;
        current = period_end;
    }
    total
}

fn main() {
    println!("Supply at block 840,000: {} BTC", total_supply_up_to_block(840_000));
}
```

```python
def total_supply_up_to_block(block_height: int) -> float:
    """Calculate total Bitcoin supply up to given block height."""
    total = 0.0
    current = 0
    
    while current <= block_height:
        halvings = current // 210_000
        if halvings >= 64:
            break
        
        period_end = min((halvings + 1) * 210_000, block_height + 1)
        blocks = period_end - (halvings * 210_000)
        subsidy = 50.0 / (2 ** halvings)
        
        total += blocks * subsidy
        current = period_end
    
    return total

print(f"Supply at block 840,000: {total_supply_up_to_block(840_000):,.0f} BTC")
```

```cpp
// Requires: #include <algorithm>
double total_supply_up_to_block(uint64_t block_height) {
    double total = 0.0;
    uint64_t current = 0;
    
    while (current <= block_height) {
        uint64_t halvings = current / 210000;
        if (halvings >= 64) break;
        
        uint64_t period_end = std::min((halvings + 1) * 210000, block_height + 1);
        uint64_t blocks = period_end - (halvings * 210000);
        double subsidy = 50.0 / std::pow(2.0, static_cast<double>(halvings));
        
        total += static_cast<double>(blocks) * subsidy;
        current = period_end;
    }
    return total;
}
```

```go
package main

import (
	"fmt"
	"math"
)

func totalSupplyUpToBlock(blockHeight uint64) float64 {
	total := 0.0
	current := uint64(0)
	
	for current <= blockHeight {
		halvings := current / 210_000
		if halvings >= 64 {
			break
		}
		
		periodEnd := uint64(math.Min(float64((halvings+1)*210_000), float64(blockHeight+1)))
		blocks := periodEnd - (halvings * 210_000)
		subsidy := 50.0 / math.Pow(2.0, float64(halvings))
		
		total += float64(blocks) * subsidy
		current = periodEnd
	}
	return total
}

func main() {
	supply := totalSupplyUpToBlock(840_000)
	fmt.Printf("Supply at block 840,000: %.0f BTC\n", supply)
}
```

```javascript
function totalSupplyUpToBlock(blockHeight) {
    let total = 0;
    let current = 0;
    
    while (current <= blockHeight) {
        const halvings = Math.floor(current / 210000);
        if (halvings >= 64) break;
        
        const periodEnd = Math.min((halvings + 1) * 210000, blockHeight + 1);
        const blocks = periodEnd - (halvings * 210000);
        const subsidy = 50.0 / Math.pow(2, halvings);
        
        total += blocks * subsidy;
        current = periodEnd;
    }
    return total;
}

console.log(`Supply at block 840,000: ${totalSupplyUpToBlock(840000).toLocaleString()} BTC`);
```
:::

### Find Next Halving

:::code-group
```rust
fn next_halving(current_height: u64) -> (u64, u64) {
    let current_halvings = current_height / 210_000;
    let next_height = (current_halvings + 1) * 210_000;
    let blocks_remaining = next_height - current_height;
    (next_height, blocks_remaining)
}

fn main() {
    let (next, remaining) = next_halving(880_000);
    println!("Next halving at block {}, {} blocks remaining", next, remaining);
}
```

```python
def next_halving(current_height: int) -> tuple[int, int]:
    """Returns (next_halving_height, blocks_remaining)."""
    current_halvings = current_height // 210_000
    next_height = (current_halvings + 1) * 210_000
    blocks_remaining = next_height - current_height
    return next_height, blocks_remaining

next_height, remaining = next_halving(880_000)
print(f"Next halving at block {next_height:,}, {remaining:,} blocks remaining")
```

```cpp
std::pair<uint64_t, uint64_t> next_halving(uint64_t current_height) {
    uint64_t current_halvings = current_height / 210000;
    uint64_t next_height = (current_halvings + 1) * 210000;
    uint64_t blocks_remaining = next_height - current_height;
    return {next_height, blocks_remaining};
}
```

```go
package main

import "fmt"

func nextHalving(currentHeight uint64) (uint64, uint64) {
	currentHalvings := currentHeight / 210_000
	nextHeight := (currentHalvings + 1) * 210_000
	blocksRemaining := nextHeight - currentHeight
	return nextHeight, blocksRemaining
}

func main() {
	nextHeight, remaining := nextHalving(880_000)
	fmt.Printf("Next halving at block %d, %d blocks remaining\n", nextHeight, remaining)
}
```

```javascript
function nextHalving(currentHeight) {
    const currentHalvings = Math.floor(currentHeight / 210000);
    const nextHeight = (currentHalvings + 1) * 210000;
    const blocksRemaining = nextHeight - currentHeight;
    return { nextHeight, blocksRemaining };
}

const { nextHeight, blocksRemaining } = nextHalving(880000);
console.log(`Next halving at block ${nextHeight.toLocaleString()}, ${blocksRemaining.toLocaleString()} blocks remaining`);
```
:::

---

## Block Reward Components

The total block reward consists of two parts:

```
Total Block Reward = Block Subsidy + Transaction Fees
```

| Era | Subsidy | Typical Fees | Fee % |
|-----|---------|--------------|-------|
| 2009-2012 | 50 BTC | < 0.01 BTC | < 0.02% |
| 2012-2016 | 25 BTC | 0.1-0.5 BTC | 0.4-2% |
| 2016-2020 | 12.5 BTC | 0.5-2 BTC | 4-16% |
| 2020-2024 | 6.25 BTC | 0.5-5 BTC | 8-80% |
| 2024-2028 | 3.125 BTC | Variable | Growing |

As the subsidy decreases, transaction fees become increasingly important for mining economics and network security.

---

## Inflation Rate

Bitcoin's inflation rate decreases predictably over time:

```
Annual Inflation = (Blocks per Year × Subsidy) / Total Supply × 100%

Example (2024):
- Blocks per year: ~52,560 (365.25 × 24 × 6)
- Subsidy: 3.125 BTC
- New BTC per year: ~164,250 BTC
- Total supply: ~19,700,000 BTC
- Inflation rate: ~0.83%
```

| Period | Approximate Inflation |
|--------|----------------------|
| 2009-2012 | > 25% |
| 2016-2020 | ~4% |
| 2020-2024 | ~1.8% |
| 2024-2028 | ~0.8% |
| After 2032 | < 0.5% |

---

## Key Properties

### Predictability
- Anyone can calculate the exact supply at any block height
- No central authority can change the schedule
- Requires network consensus to modify

### Scarcity
- Fixed maximum of 21 million BTC
- Decreasing issuance over time
- Eventually deflationary (lost coins exceed new issuance)

### Security Transition
- Early: Security funded primarily by subsidy
- Current: Mix of subsidy and fees
- Future: Security must come from fee market

---

## Visual Representation

```
Subsidy (BTC)
      │
50    │████████
25    │        ████████
12.5  │                ████████
6.25  │                        ████████
3.125 │                                ████████
1.5625│                                        ████████
      │
      └────────────────────────────────────────────────→ Blocks
       0      210k    420k    630k    840k    1050k
```

---

## Resources

- **[Bitcoin Core: validation.cpp](https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp)**: Subsidy calculation in source code
- **[Bitcoin Wiki: Controlled Supply](https://en.bitcoin.it/wiki/Controlled_supply)**: Detailed supply schedule
- **[Clark Moody Dashboard](https://bitcoin.clarkmoody.com/dashboard/)**: Live supply statistics

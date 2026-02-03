# Lightning Routing Fees

Lightning routing fees are how nodes earn income for forwarding payments. Understanding fee calculation is essential for both routing nodes and payment senders.

## Fee Structure

Lightning fees consist of two components:

1. **Base Fee**: Fixed fee per HTLC (in millisatoshis)
2. **Proportional Fee**: Percentage of payment amount (in parts per million)

### Fee Formula

```
Total Fee = Base Fee + (Payment Amount × Proportional Fee / 1,000,000)
```

:::code-group
```rust
/// Calculate the fee for forwarding an amount through a channel
/// Fee = base_fee_msat + (amount_msat * proportional_fee_ppm / 1_000_000)
fn calculate_fee(amount_msat: u64, base_fee_msat: u64, proportional_fee_ppm: u64) -> u64 {
    base_fee_msat + (amount_msat * proportional_fee_ppm / 1_000_000)
}

// Example: 100,000 sats with 1000 msat base + 10 ppm
fn main() {
    let fee = calculate_fee(100_000_000, 1000, 10);
    println!("Total fee: {} msat", fee);  // Output: 2000 msat
}
```

```python
def calculate_fee(amount_msat: int, base_fee_msat: int, proportional_fee_ppm: int) -> int:
    """Calculate the routing fee for forwarding an amount.
    
    Args:
        amount_msat: Amount to forward in millisatoshis
        base_fee_msat: Fixed fee per HTLC in millisatoshis
        proportional_fee_ppm: Proportional fee in parts per million
    
    Returns:
        Total fee in millisatoshis (using integer division per BOLT 7)
    """
    return base_fee_msat + (amount_msat * proportional_fee_ppm // 1_000_000)

# Example: 100,000 sats with 1000 msat base + 10 ppm
fee = calculate_fee(100_000_000, 1000, 10)
print(f"Total fee: {fee} msat")  # Output: 2000 msat
```

```cpp
#include &lt;iostream&gt;
#include &lt;cstdint&gt;

/**
 * Calculate the fee for forwarding an amount through a channel
 * Fee = base_fee_msat + (amount_msat * proportional_fee_ppm / 1_000_000)
 */
uint64_t calculate_fee(uint64_t amount_msat, uint64_t base_fee_msat, uint64_t proportional_fee_ppm) {
    return base_fee_msat + (amount_msat * proportional_fee_ppm / 1000000);
}

// Example: 100,000 sats with 1000 msat base + 10 ppm
int main() {
    uint64_t fee = calculate_fee(100000000, 1000, 10);
    std::cout << "Total fee: " << fee << " msat" << std::endl;  // Output: 2000 msat
    return 0;
}
```

```go
package main

import "fmt"

// CalculateFee calculates the fee for forwarding an amount through a channel
// Fee = base_fee_msat + (amount_msat * proportional_fee_ppm / 1_000_000)
func CalculateFee(amountMsat uint64, baseFeeMsat uint64, proportionalFeePpm uint64) uint64 {
	return baseFeeMsat + (amountMsat * proportionalFeePpm / 1_000_000)
}

func main() {
	// Example: 100,000 sats with 1000 msat base + 10 ppm
	fee := CalculateFee(100_000_000, 1000, 10)
	fmt.Printf("Total fee: %d msat\n", fee) // Output: 2000 msat
}
```

```javascript
/**
 * Calculate the fee for forwarding an amount through a channel
 * Fee = base_fee_msat + (amount_msat * proportional_fee_ppm / 1_000_000)
 * 
 * @param {BigInt} amountMsat - Amount to forward in millisatoshis
 * @param {BigInt} baseFeeMsat - Fixed fee per HTLC in millisatoshis
 * @param {BigInt} proportionalFeePpm - Proportional fee in parts per million
 * @returns {BigInt} Total fee in millisatoshis
 */
function calculateFee(amountMsat, baseFeeMsat, proportionalFeePpm) {
    return baseFeeMsat + (amountMsat * proportionalFeePpm / 1_000_000n);
}

// Example: 100,000 sats with 1000 msat base + 10 ppm
const fee = calculateFee(100_000_000n, 1000n, 10n);
console.log(`Total fee: ${fee} msat`);  // Output: 2000 msat
```
:::

### Example

Given:
- Base fee: 1000 msat
- Proportional fee: 10 ppm (parts per million)
- Payment amount: 100,000 sats (100,000,000 msat)

Calculation:
```
Base Fee = 1000 msat
Proportional Fee = 100,000,000 × 10 / 1,000,000 = 1000 msat
Total Fee = 1000 + 1000 = 2000 msat (2 sats)
```

---

## Routing Policy

Each node advertises a **routing policy** that specifies:

- `fee_base_msat`: Base fee in millisatoshis
- `fee_proportional_millionths`: Proportional fee in parts per million
- `cltv_delta`: Required expiry delta (in blocks)

### Example Policy

```json
{
  "fee_base_msat": 1000,
  "fee_proportional_millionths": 10,
  "cltv_delta": 40
}
```

This means:
- 1000 msat base fee per HTLC
- 10 ppm proportional fee
- Requires 40 block expiry delta

---

## Fee Calculation Along a Route

When calculating fees for a multi-hop route, fees accumulate:

### Example Route

```
Alice → Bob → Carol → Dave
Payment: 100,000 sats

Bob's Policy:
  Base: 1000 msat
  Proportional: 10 ppm

Carol's Policy:
  Base: 2000 msat
  Proportional: 500 ppm

Dave (final hop, no fee)
```

### Calculation

**Step 1: Calculate fee to Carol (from Bob)**
```
Base: 1000 msat
Proportional: 100,000,000 × 10 / 1,000,000 = 1000 msat
Total: 2000 msat
Amount to Carol: 100,000,000 + 2000 = 100,002,000 msat
```

**Step 2: Calculate fee to Dave (from Carol)**
```
Base: 2000 msat
Proportional: 100,002,000 × 500 / 1,000,000 = 50,001 msat
Total: 52,001 msat
Amount to Dave: 100,002,000 + 52,001 = 100,054,001 msat
```

**Total Fee Paid**: 54,001 msat (54 sats)

---

## HTLC Amount Calculation

For each hop, the HTLC amount includes:
- Original payment amount
- All fees accumulated up to that point

### Backward Calculation

Starting from the final amount, work backwards:

```
Final Amount (to Dave): 100,054,001 msat

Carol's HTLC to Dave: 100,054,001 msat
  (includes: 100,000,000 + 2000 + 52,001)

Bob's HTLC to Carol: 100,002,000 msat
  (includes: 100,000,000 + 2000)

Alice's HTLC to Bob: 100,000,000 msat
  (original payment)
```

:::code-group
```rust
/// Represents a hop in the payment route
struct Hop {
    channel_name: String,
    cltv_delta: u32,
    base_fee_msat: u64,
    proportional_fee_ppm: u64,
}

/// Represents calculated HTLC values for a hop
struct HtlcHop {
    channel_name: String,
    htlc_amount_msat: u64,
    htlc_expiry: u32,
}

/// Calculate HTLC values working backwards from destination
fn calculate_route_backwards(
    hops: &[Hop],
    final_amount_msat: u64,
    min_final_cltv: u32,
    block_height: u32,
) -> Vec&lt;HtlcHop&gt; {
    let mut htlc_hops = Vec::with_capacity(hops.len());
    
    // Start with final hop values
    let mut current_amount = final_amount_msat;
    let mut current_expiry = block_height + min_final_cltv;
    
    // Process hops in reverse order
    for i in (0..hops.len()).rev() {
        let hop = &hops[i];
        
        htlc_hops.push(HtlcHop {
            channel_name: hop.channel_name.clone(),
            htlc_amount_msat: current_amount,
            htlc_expiry: current_expiry,
        });
        
        // Calculate values for previous hop
        if i > 0 {
            let fee = hop.base_fee_msat + 
                      (current_amount * hop.proportional_fee_ppm / 1_000_000);
            current_amount += fee;
            current_expiry += hop.cltv_delta;
        }
    }
    
    htlc_hops.reverse();
    htlc_hops
}
```

```python
from dataclasses import dataclass
from typing import List

@dataclass
class Hop:
    channel_name: str
    cltv_delta: int
    base_fee_msat: int
    proportional_fee_ppm: int

@dataclass
class HtlcHop:
    channel_name: str
    htlc_amount_msat: int
    htlc_expiry: int

def calculate_route_backwards(
    hops: List[Hop],
    final_amount_msat: int,
    min_final_cltv: int,
    block_height: int
) -> List[HtlcHop]:
    """Calculate HTLC values for each hop, working backwards."""
    htlc_hops = []
    
    # Start with final hop values
    current_amount = final_amount_msat
    current_expiry = block_height + min_final_cltv
    
    # Process hops in reverse order
    for i in range(len(hops) - 1, -1, -1):
        hop = hops[i]
        
        # Store current values for this hop
        htlc_hops.append(HtlcHop(
            channel_name=hop.channel_name,
            htlc_amount_msat=current_amount,
            htlc_expiry=current_expiry
        ))
        
        # Calculate values for previous hop (if not first hop)
        if i > 0:
            fee = hop.base_fee_msat + (current_amount * hop.proportional_fee_ppm // 1_000_000)
            current_amount += fee
            current_expiry += hop.cltv_delta
    
    return list(reversed(htlc_hops))
```

```cpp
#include &lt;vector&gt;
#include &lt;string&gt;
#include &lt;cstdint&gt;
#include &lt;algorithm&gt;

struct Hop {
    std::string channel_name;
    uint32_t cltv_delta;
    uint64_t base_fee_msat;
    uint64_t proportional_fee_ppm;
};

struct HtlcHop {
    std::string channel_name;
    uint64_t htlc_amount_msat;
    uint32_t htlc_expiry;
};

/**
 * Calculate HTLC values working backwards from destination
 */
std::vector&lt;HtlcHop&gt; calculate_route_backwards(
    const std::vector&lt;Hop&gt;& hops,
    uint64_t final_amount_msat,
    uint32_t min_final_cltv,
    uint32_t block_height
) {
    std::vector&lt;HtlcHop&gt; htlc_hops;
    htlc_hops.reserve(hops.size());
    
    // Start with final hop values
    uint64_t current_amount = final_amount_msat;
    uint32_t current_expiry = block_height + min_final_cltv;
    
    // Process hops in reverse order
    for (int i = static_cast&lt;int&gt;(hops.size()) - 1; i >= 0; --i) {
        const Hop& hop = hops[i];
        
        htlc_hops.push_back({
            hop.channel_name,
            current_amount,
            current_expiry
        });
        
        // Calculate values for previous hop
        if (i > 0) {
            uint64_t fee = hop.base_fee_msat + 
                          (current_amount * hop.proportional_fee_ppm / 1000000);
            current_amount += fee;
            current_expiry += hop.cltv_delta;
        }
    }
    
    std::reverse(htlc_hops.begin(), htlc_hops.end());
    return htlc_hops;
}
```

```go
package main

import "fmt"

// Hop represents a hop in the payment route
type Hop struct {
	ChannelName        string
	CLTVDelta          uint32
	BaseFeeMsat        uint64
	ProportionalFeePpm uint64
}

// HTLCHop represents calculated HTLC values for a hop
type HTLCHop struct {
	ChannelName    string
	HTLCAmountMsat uint64
	HTLCExpiry     uint32
}

// CalculateRouteBackwards calculates HTLC values working backwards from destination
func CalculateRouteBackwards(hops []Hop, finalAmountMsat uint64, minFinalCltv uint32, blockHeight uint32) []HTLCHop {
	htlcHops := make([]HTLCHop, 0, len(hops))
	
	// Start with final hop values
	currentAmount := finalAmountMsat
	currentExpiry := blockHeight + minFinalCltv
	
	// Process hops in reverse order
	for i := len(hops) - 1; i >= 0; i-- {
		hop := hops[i]
		
		htlcHops = append(htlcHops, HTLCHop{
			ChannelName:    hop.ChannelName,
			HTLCAmountMsat: currentAmount,
			HTLCExpiry:     currentExpiry,
		})
		
		// Calculate values for previous hop
		if i > 0 {
			fee := hop.BaseFeeMsat + (currentAmount * hop.ProportionalFeePpm / 1_000_000)
			currentAmount += fee
			currentExpiry += hop.CLTVDelta
		}
	}
	
	// Reverse to get forward order
	for i, j := 0, len(htlcHops)-1; i < j; i, j = i+1, j-1 {
		htlcHops[i], htlcHops[j] = htlcHops[j], htlcHops[i]
	}
	
	return htlcHops
}
```

```javascript
/**
 * Represents a hop in the payment route
 * @typedef {Object} Hop
 * @property {string} channelName
 * @property {number} cltvDelta
 * @property {BigInt} baseFeeMsat
 * @property {BigInt} proportionalFeePpm
 */

/**
 * Represents calculated HTLC values for a hop
 * @typedef {Object} HtlcHop
 * @property {string} channelName
 * @property {BigInt} htlcAmountMsat
 * @property {number} htlcExpiry
 */

/**
 * Calculate HTLC values working backwards from destination
 * @param {Hop[]} hops - Array of hops in the route
 * @param {BigInt} finalAmountMsat - Final payment amount
 * @param {number} minFinalCltv - Minimum CLTV for final hop
 * @param {number} blockHeight - Current block height
 * @returns {HtlcHop[]} Calculated HTLC values for each hop
 */
function calculateRouteBackwards(hops, finalAmountMsat, minFinalCltv, blockHeight) {
    const htlcHops = [];
    
    // Start with final hop values
    let currentAmount = finalAmountMsat;
    let currentExpiry = blockHeight + minFinalCltv;
    
    // Process hops in reverse order
    for (let i = hops.length - 1; i >= 0; i--) {
        const hop = hops[i];
        
        htlcHops.push({
            channelName: hop.channelName,
            htlcAmountMsat: currentAmount,
            htlcExpiry: currentExpiry
        });
        
        // Calculate values for previous hop
        if (i > 0) {
            const fee = hop.baseFeeMsat + 
                       (currentAmount * hop.proportionalFeePpm / 1_000_000n);
            currentAmount += fee;
            currentExpiry += hop.cltvDelta;
        }
    }
    
    return htlcHops.reverse();
}
```
:::

---

## Integer Division

**Important**: Lightning uses **integer division** for fee calculation (as per BOLT 7).

This means:
- Round down (floor) any fractional results
- No rounding up
- Can lead to small discrepancies

### Example

```
Payment: 1,000,000 msat
Proportional Fee: 3 ppm

Calculation: 1,000,000 × 3 / 1,000,000 = 3 msat ✓

But if payment was 999,999 msat:
999,999 × 3 / 1,000,000 = 2.999997 msat
Integer division: 2 msat (rounded down)
```

---

## Fee Economics

### For Routing Nodes

**Revenue Sources:**
- Base fees from each forwarded payment
- Proportional fees based on payment size

**Costs:**
- Channel liquidity (locked capital)
- Risk of failed payments
- Operational costs (node maintenance)

**Optimization:**
- Set competitive but profitable fees
- Balance liquidity across channels
- Monitor network conditions

### For Payment Senders

**Considerations:**
- Total fee across route
- Payment success probability
- Route length (more hops = more fees)

**Optimization:**
- Find routes with lower fees
- Use direct channels when possible
- Consider payment splitting (MPP)

---

## Fee Limits

### Maximum Fees

There's no hard limit on fees, but:
- Very high fees reduce payment success
- Market forces keep fees reasonable
- Nodes compete for routing business

### Minimum Fees

Some nodes set minimum fees to:
- Cover operational costs
- Discourage spam
- Ensure profitability

---

## Fee Discovery

### How Senders Find Fees

1. **Network Graph**: Query network for channel policies
2. **Route Calculation**: Calculate fees for potential routes
3. **Fee Comparison**: Compare routes by total fee
4. **Route Selection**: Choose route with acceptable fees

### Fee Updates

Nodes can update their fees:
- Change base fee
- Change proportional fee
- Update channel policies

Changes take effect immediately for new payments.

---

## Best Practices

### For Routing Nodes

1. **Competitive Pricing**: Set fees that attract routing
2. **Monitor Market**: Adjust fees based on network conditions
3. **Balance Channels**: Maintain liquidity for routing
4. **Transparent Policies**: Clearly advertise fee structure

### For Payment Senders

1. **Compare Routes**: Check fees across different routes
2. **Direct Channels**: Use direct channels to avoid fees
3. **Payment Size**: Larger payments pay more in proportional fees
4. **Route Optimization**: Balance fees vs. success probability

---

## Common Issues

### Fees Too High

**Problem**: Route has very high fees

**Solutions**:
- Try different routes
- Use direct channels
- Split payment (MPP)
- Wait for better routing conditions

### Fees Not Calculated Correctly

**Problem**: Fee calculation doesn't match expected

**Solutions**:
- Check integer division
- Verify policy values
- Account for all hops
- Include base and proportional fees

---

## Summary

Lightning routing fees:

- **Two components**: Base fee + proportional fee
- **Accumulate**: Fees add up along the route
- **Integer division**: Use floor division for calculations
- **Economic incentive**: Rewards nodes for routing
- **Market driven**: Competition keeps fees reasonable

Understanding fees helps both routing nodes optimize revenue and payment senders minimize costs.

---

## Related Topics

- [HTLCs](/docs/lightning/routing/htlc) - Hash Time-Locked Contracts that carry payments along the route
- [Multi-Part Payments](/docs/lightning/routing/mpp) - Splitting payments across multiple routes
- [Channels](/docs/lightning/channels) - How channels and liquidity affect routing
- [Onion Routing](/docs/lightning/onion) - How routes are encoded for privacy

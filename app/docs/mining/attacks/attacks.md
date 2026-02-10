# Mining Attacks

Bitcoin's proof-of-work security model is designed to make attacks economically irrational. However, understanding potential attacks is crucial for appreciating Bitcoin's security properties and the incentives that protect the network.

This section covers theoretical attacks on Bitcoin mining, their costs, and why they generally don't happen.

## The 51% Attack

The most discussed attack on Bitcoin: what if someone controls more than half the network's hashrate?

### What It Enables

With >50% hashrate, an attacker can:

1. **Double-spend**: Reverse their own transactions
2. **Block transactions**: Prevent specific transactions from confirming
3. **Empty blocks**: Mine blocks with no transactions (censorship)

### What It Doesn't Enable

Even with 51%, an attacker **cannot**:

- **Steal coins**: Can't create valid signatures for others' coins
- **Change consensus rules**: Can't create coins, change block rewards
- **Spend anyone's coins**: Only their own (for double-spends)
- **Modify historical transactions**: Only recent blocks (cost increases with depth)

### How It Works

```
Honest chain:    A → B → C → D → E → F
                              ↑
                        Attacker buys something
                        
Attacker mines secretly:
                 A → B → C → D'→ E'→ F'→ G'
                              ↑
                        Same coins spent differently
                        
When attacker's chain is longer, it becomes the valid chain.
The honest chain is orphaned. Double-spend succeeds.
```

### Attack Success Probability

The probability of a successful double-spend attack depends on the attacker's hashrate and the number of confirmations the victim waits for:

:::code-group
```rust
/// Calculates the probability of a successful double-spend attack.
/// Based on the analysis in Satoshi's whitepaper.

/// Calculate attack success probability using Poisson distribution.
/// 
/// # Arguments
/// * `q` - Attacker's fraction of total hashrate (0.0 to 1.0)
/// * `z` - Number of confirmations to overcome
fn attack_success_probability(q: f64, z: u32) -> f64 {
    if q >= 0.5 {
        return 1.0; // Attacker always wins with majority
    }
    
    let p = 1.0 - q; // Honest miners' fraction
    let lambda = (z as f64) * (q / p);
    
    let mut sum = 0.0;
    let mut poisson_term = (-lambda).exp();
    
    for k in 0..=z {
        // Probability attacker catches up from k blocks behind
        let catch_up_prob = if k <= z {
            (q / p).powi((z - k) as i32)
        } else {
            1.0
        };
        
        sum += poisson_term * (1.0 - catch_up_prob);
        poisson_term *= lambda / ((k + 1) as f64);
    }
    
    1.0 - sum
}

/// Simpler approximation for attack probability.
fn attack_probability_simple(q: f64, z: u32) -> f64 {
    if q >= 0.5 {
        return 1.0;
    }
    
    // Approximation: (q/p)^z where p = 1-q
    let p = 1.0 - q;
    (q / p).powi(z as i32)
}

/// Calculate required confirmations for a given security level.
fn required_confirmations(q: f64, target_probability: f64) -> u32 {
    if q >= 0.5 {
        return u32::MAX; // Never safe
    }
    
    for z in 1..100 {
        if attack_success_probability(q, z) < target_probability {
            return z;
        }
    }
    100
}

fn main() {
    println!("Double-Spend Attack Success Probability\n");
    println!("Attacker hashrate | 1 conf | 3 conf | 6 conf | 12 conf");
    println!("-".repeat(60));
    
    for q in [0.10, 0.20, 0.30, 0.40, 0.45] {
        print!("      {:.0}%          |", q * 100.0);
        for z in [1, 3, 6, 12] {
            let prob = attack_success_probability(q, z);
            print!(" {:.4} |", prob);
        }
        println!();
    }
    
    println!("\nRequired confirmations for 0.1% attack probability:");
    for q in [0.10, 0.20, 0.30] {
        let confs = required_confirmations(q, 0.001);
        println!("  {:.0}% attacker: {} confirmations", q * 100.0, confs);
    }
}
```

```python
import math

def attack_success_probability(q: float, z: int) -> float:
    """
    Calculate the probability of a successful double-spend attack.
    Based on the analysis in Satoshi's whitepaper.
    
    Args:
        q: Attacker's fraction of total hashrate (0.0 to 1.0)
        z: Number of confirmations to overcome
    
    Returns:
        Probability of successful attack (0.0 to 1.0)
    """
    if q >= 0.5:
        return 1.0  # Attacker always wins with majority
    
    p = 1 - q  # Honest miners' fraction
    lambda_val = z * (q / p)
    
    total = 0.0
    poisson_term = math.exp(-lambda_val)
    
    for k in range(z + 1):
        # Probability attacker catches up from k blocks behind
        catch_up_prob = (q / p) ** (z - k) if k <= z else 1.0
        total += poisson_term * (1 - catch_up_prob)
        poisson_term *= lambda_val / (k + 1)
    
    return 1 - total

def attack_probability_simple(q: float, z: int) -> float:
    """
    Simpler approximation for attack probability.
    Good for quick estimates when q is small.
    """
    if q >= 0.5:
        return 1.0
    
    p = 1 - q
    return (q / p) ** z

def required_confirmations(q: float, target_probability: float) -> int:
    """
    Calculate required confirmations for a given security level.
    
    Args:
        q: Attacker's fraction of hashrate
        target_probability: Maximum acceptable attack probability
    
    Returns:
        Number of confirmations needed
    """
    if q >= 0.5:
        return float('inf')  # Never safe
    
    for z in range(1, 100):
        if attack_success_probability(q, z) < target_probability:
            return z
    return 100

def cost_of_attack(q: float, network_hashrate_eh: float, 
                   electricity_cost: float, hours: float) -> float:
    """
    Estimate the cost of running a 51% attack.
    
    Args:
        q: Attacker's target fraction of hashrate
        network_hashrate_eh: Current network hashrate in EH/s
        electricity_cost: Cost per kWh in dollars
        hours: Duration of attack in hours
    
    Returns:
        Estimated cost in dollars
    """
    # Attacker needs q/(1-q) times the honest hashrate
    attacker_hashrate = network_hashrate_eh * (q / (1 - q))
    
    # Assume 25 J/TH efficiency (modern ASICs)
    joules_per_th = 25
    power_watts = attacker_hashrate * 1e6 * joules_per_th  # EH to TH
    power_kw = power_watts / 1000
    
    # Electricity cost
    electricity = power_kw * hours * electricity_cost
    
    # Hardware cost (rough estimate: $50 per TH/s)
    hardware_cost_per_th = 50
    hardware = attacker_hashrate * 1e6 * hardware_cost_per_th
    
    return electricity + hardware

# Print attack probability table
print("Double-Spend Attack Success Probability\n")
print("Attacker hashrate | 1 conf | 3 conf | 6 conf | 12 conf")
print("-" * 60)

for q in [0.10, 0.20, 0.30, 0.40, 0.45]:
    probs = [attack_success_probability(q, z) for z in [1, 3, 6, 12]]
    print(f"      {q*100:.0f}%          | {probs[0]:.4f} | {probs[1]:.4f} | {probs[2]:.4f} | {probs[3]:.4f}")

print("\nRequired confirmations for 0.1% attack probability:")
for q in [0.10, 0.20, 0.30]:
    confs = required_confirmations(q, 0.001)
    print(f"  {q*100:.0f}% attacker: {confs} confirmations")

print("\nEstimated attack cost (51% for 1 hour):")
cost = cost_of_attack(0.51, 700, 0.05, 1)
print(f"  ${cost/1e9:.2f} billion (hardware + electricity)")
```

```cpp
#include <iostream>
#include <iomanip>
#include <cmath>

/**
 * Calculate the probability of a successful double-spend attack.
 * Based on the analysis in Satoshi's whitepaper.
 * 
 * @param q Attacker's fraction of total hashrate (0.0 to 1.0)
 * @param z Number of confirmations to overcome
 * @return Probability of successful attack (0.0 to 1.0)
 */
double attackSuccessProbability(double q, int z) {
    if (q >= 0.5) {
        return 1.0; // Attacker always wins with majority
    }
    
    double p = 1.0 - q; // Honest miners' fraction
    double lambda = z * (q / p);
    
    double sum = 0.0;
    double poissonTerm = exp(-lambda);
    
    for (int k = 0; k <= z; ++k) {
        // Probability attacker catches up from k blocks behind
        double catchUpProb = pow(q / p, z - k);
        sum += poissonTerm * (1.0 - catchUpProb);
        poissonTerm *= lambda / (k + 1);
    }
    
    return 1.0 - sum;
}

/**
 * Simpler approximation for attack probability.
 */
double attackProbabilitySimple(double q, int z) {
    if (q >= 0.5) {
        return 1.0;
    }
    double p = 1.0 - q;
    return pow(q / p, z);
}

/**
 * Calculate required confirmations for a given security level.
 */
int requiredConfirmations(double q, double targetProbability) {
    if (q >= 0.5) {
        return INT_MAX; // Never safe
    }
    
    for (int z = 1; z < 100; ++z) {
        if (attackSuccessProbability(q, z) < targetProbability) {
            return z;
        }
    }
    return 100;
}

int main() {
    std::cout << "Double-Spend Attack Success Probability\n" << std::endl;
    std::cout << "Attacker hashrate | 1 conf | 3 conf | 6 conf | 12 conf" << std::endl;
    std::cout << std::string(60, '-') << std::endl;
    
    std::cout << std::fixed << std::setprecision(4);
    
    double qValues[] = {0.10, 0.20, 0.30, 0.40, 0.45};
    int zValues[] = {1, 3, 6, 12};
    
    for (double q : qValues) {
        std::cout << "      " << std::setw(2) << (int)(q * 100) << "%          |";
        for (int z : zValues) {
            std::cout << " " << attackSuccessProbability(q, z) << " |";
        }
        std::cout << std::endl;
    }
    
    std::cout << "\nRequired confirmations for 0.1% attack probability:" << std::endl;
    for (double q : {0.10, 0.20, 0.30}) {
        int confs = requiredConfirmations(q, 0.001);
        std::cout << "  " << (int)(q * 100) << "% attacker: " 
                  << confs << " confirmations" << std::endl;
    }
    
    return 0;
}
```

```go
package main

import (
	"fmt"
	"math"
)

// AttackSuccessProbability calculates the probability of a successful double-spend attack.
// Based on the analysis in Satoshi's whitepaper.
func AttackSuccessProbability(q float64, z int) float64 {
	if q >= 0.5 {
		return 1.0 // Attacker always wins with majority
	}
	
	p := 1.0 - q // Honest miners' fraction
	lambda := float64(z) * (q / p)
	
	// Poisson probability: sum from k=0 to z of (lambda^k * e^-lambda) / k!
	prob := 0.0
	for k := 0; k <= z; k++ {
		prob += math.Pow(lambda, float64(k)) * math.Exp(-lambda) / float64(factorial(k))
	}
	
	// Probability attacker catches up: (q/p)^z
	catchUpProb := math.Pow(q/p, float64(z))
	
	return 1.0 - prob + catchUpProb
}

func factorial(n int) int {
	if n <= 1 {
		return 1
	}
	return n * factorial(n-1)
}

// AttackProbabilitySimple is a simplified version for small z
func AttackProbabilitySimple(q float64, z int) float64 {
	if q >= 0.5 {
		return 1.0
	}
	return math.Pow(q/(1.0-q), float64(z))
}

// RequiredConfirmations finds the number of confirmations needed for a target attack probability
func RequiredConfirmations(q float64, targetProb float64) int {
	for z := 1; z < 1000; z++ {
		if AttackSuccessProbability(q, z) < targetProb {
			return z
		}
	}
	return 100
}

// CostOfAttack estimates the cost of a 51% attack
func CostOfAttack(q float64, networkHashrateEh float64, electricityCost float64, hours float64) float64 {
	attackerHashrate := networkHashrateEh * (q / (1.0 - q))
	
	// Assume 25 J/TH efficiency
	joulesPerTh := 25.0
	powerWatts := attackerHashrate * 1e6 * joulesPerTh
	powerKw := powerWatts / 1000.0
	
	electricity := powerKw * hours * electricityCost
	hardwareCostPerTh := 50.0
	hardware := attackerHashrate * 1e6 * hardwareCostPerTh
	
	return electricity + hardware
}

func main() {
	fmt.Println("Double-Spend Attack Success Probability\n")
	fmt.Println("Attacker hashrate | 1 conf | 3 conf | 6 conf | 12 conf")
	fmt.Println("------------------------------------------------------------")
	
	qValues := []float64{0.10, 0.20, 0.30, 0.40, 0.45}
	zValues := []int{1, 3, 6, 12}
	
	for _, q := range qValues {
		fmt.Printf("      %2.0f%%          |", q*100)
		for _, z := range zValues {
			prob := AttackSuccessProbability(q, z)
			fmt.Printf(" %.4f |", prob)
		}
		fmt.Println()
	}
	
	fmt.Println("\nRequired confirmations for 0.1% attack probability:")
	for _, q := range []float64{0.10, 0.20, 0.30} {
		confs := RequiredConfirmations(q, 0.001)
		fmt.Printf("  %.0f%% attacker: %d confirmations\n", q*100, confs)
	}
	
	fmt.Println("\nEstimated attack cost (51% for 1 hour):")
	cost := CostOfAttack(0.51, 700, 0.05, 1)
	fmt.Printf("  $%.2f billion (hardware + electricity)\n", cost/1e9)
}
```

```javascript
/**
 * Calculate the probability of a successful double-spend attack.
 * Based on the analysis in Satoshi's whitepaper.
 * 
 * @param {number} q - Attacker's fraction of total hashrate (0.0 to 1.0)
 * @param {number} z - Number of confirmations to overcome
 * @returns {number} - Probability of successful attack (0.0 to 1.0)
 */
function attackSuccessProbability(q, z) {
    if (q >= 0.5) {
        return 1.0; // Attacker always wins with majority
    }
    
    const p = 1 - q; // Honest miners' fraction
    const lambda = z * (q / p);
    
    let sum = 0;
    let poissonTerm = Math.exp(-lambda);
    
    for (let k = 0; k <= z; k++) {
        // Probability attacker catches up from k blocks behind
        const catchUpProb = Math.pow(q / p, z - k);
        sum += poissonTerm * (1 - catchUpProb);
        poissonTerm *= lambda / (k + 1);
    }
    
    return 1 - sum;
}

/**
 * Simpler approximation for attack probability.
 * @param {number} q - Attacker's hashrate fraction
 * @param {number} z - Number of confirmations
 * @returns {number} - Approximate probability
 */
function attackProbabilitySimple(q, z) {
    if (q >= 0.5) return 1.0;
    const p = 1 - q;
    return Math.pow(q / p, z);
}

/**
 * Calculate required confirmations for a given security level.
 * @param {number} q - Attacker's fraction of hashrate
 * @param {number} targetProbability - Maximum acceptable attack probability
 * @returns {number} - Number of confirmations needed
 */
function requiredConfirmations(q, targetProbability) {
    if (q >= 0.5) return Infinity;
    
    for (let z = 1; z < 100; z++) {
        if (attackSuccessProbability(q, z) < targetProbability) {
            return z;
        }
    }
    return 100;
}

/**
 * Estimate the cost of running an attack.
 * @param {number} q - Attacker's target hashrate fraction
 * @param {number} networkHashrateEh - Network hashrate in EH/s
 * @param {number} electricityCost - Cost per kWh in dollars
 * @param {number} hours - Duration of attack
 * @returns {number} - Estimated cost in dollars
 */
function costOfAttack(q, networkHashrateEh, electricityCost, hours) {
    const attackerHashrate = networkHashrateEh * (q / (1 - q));
    
    // Assume 25 J/TH efficiency
    const joulesPerTh = 25;
    const powerWatts = attackerHashrate * 1e6 * joulesPerTh;
    const powerKw = powerWatts / 1000;
    
    const electricity = powerKw * hours * electricityCost;
    const hardwareCostPerTh = 50;
    const hardware = attackerHashrate * 1e6 * hardwareCostPerTh;
    
    return electricity + hardware;
}

// Print attack probability table
console.log("Double-Spend Attack Success Probability\n");
console.log("Attacker hashrate | 1 conf | 3 conf | 6 conf | 12 conf");
console.log("-".repeat(60));

for (const q of [0.10, 0.20, 0.30, 0.40, 0.45]) {
    const probs = [1, 3, 6, 12].map(z => attackSuccessProbability(q, z).toFixed(4));
    console.log(`      ${(q*100).toFixed(0)}%          | ${probs.join(' | ')}`);
}

console.log("\nRequired confirmations for 0.1% attack probability:");
for (const q of [0.10, 0.20, 0.30]) {
    const confs = requiredConfirmations(q, 0.001);
    console.log(`  ${(q*100).toFixed(0)}% attacker: ${confs} confirmations`);
}

console.log("\nEstimated attack cost (51% for 1 hour):");
const cost = costOfAttack(0.51, 700, 0.05, 1);
console.log(`  $${(cost/1e9).toFixed(2)} billion (hardware + electricity)`);
```
:::

### Cost Analysis

**Renting Hashrate**

At 500 EH/s network hashrate, 51% = 250 EH/s

```
Cost to rent 250 EH/s:
- Hardware doesn't exist to rent at this scale
- Would require owning majority of world's ASICs
- Estimated cost: $10-20 billion in equipment alone
- Plus electricity, facilities, etc.
```

**Opportunity Cost**

If you have 51% hashrate, honest mining is extremely profitable:

```
51% of block rewards:
- 225 blocks/day × 3.375 BTC × 51% = 387 BTC/day
- At $60,000/BTC = $23M per day
- $8.5 billion per year

Why attack when honest mining is this lucrative?
```

### Historical Non-Attacks

No successful 51% attack on Bitcoin mainnet has ever occurred. The economics don't work:

- Cost exceeds potential gain
- Attack destroys value of the asset you're attacking
- Your own holdings lose value
- Criminal liability is enormous

### Detection

51% attacks are visible:

- Sudden hashrate spike from unknown source
- Chain reorganizations (reorgs)
- Confirmed transactions disappearing

### Defenses

- **Wait for confirmations**: More confirmations = harder to reverse
- **6 confirmations**: Traditional standard (~1 hour)
- **Large amounts**: Wait for more confirmations
- **Economic finality**: Eventually, attack cost exceeds transaction value

---

## Selfish Mining

A subtle attack where miners can gain unfair advantage with less than 50% hashrate.

### How It Works

Normal mining: Find a block → immediately broadcast it

Selfish mining:
1. Find a block → **keep it secret**
2. Continue mining on your secret chain
3. If honest miners catch up, release your block
4. You get the reward, honest miners' work is wasted

### The Strategy

```
Scenario: Selfish miner has 30% hashrate

1. Selfish miner finds block A
   Secret chain: [A]
   Public chain: []
   
2. Keep mining secretly
   If selfish miner finds B before public finds anything:
   Secret chain: [A, B]  ← 2 block lead
   
3. When public finds a block:
   - If selfish lead ≥ 2: release one block, maintain lead
   - If selfish lead = 1: race to propagate
   - If selfish lead = 0: lost this round
```

### Profitability Threshold

Selfish mining becomes profitable above ~33% hashrate (with optimal network position) or ~25% (with network advantages).

Below this threshold, the strategy loses money compared to honest mining.

### Why It Rarely Happens

1. **Threshold is high**: Need significant hashrate
2. **Detection risk**: Unusual block time patterns
3. **Pool transparency**: Large [pools](/docs/mining/pools) are monitored
4. **Reputation damage**: Discovered selfish mining destroys trust
5. **Coordination**: Requires all pool miners to participate

### Defenses

- **Uniform tie-breaking**: Nodes randomly choose between equal-height blocks
- **Timestamp analysis**: Detect anomalous block timing
- **Pool monitoring**: Watch for suspicious behavior

---

## Block Withholding Attack

An attack by pool miners against their own pool.

### How It Works

1. Miner joins a pool
2. Submits partial shares (proving work)
3. When finding a valid block, **doesn't submit it**
4. Pool pays miner for shares but gets no blocks

### Impact

- Pool loses revenue (missing blocks)
- Attacker earns from shares but sabotages pool
- Other pool members subsidize the attacker

### Motivation

- Competitor pools attacking each other
- Extortion
- Spite

### Defenses

- **Statistical analysis**: Detect miners who never find blocks
- **Stratum V2**: Better work validation
- **Reputation systems**: Track miner history

---

## Fee Sniping

Miners stealing high-fee transactions from other miners' blocks.

### How It Works

```
Block N contains a transaction with 10 BTC in fees (unusually high)

Attacker sees Block N, thinks:
"If I mine an alternative Block N with that transaction, 
I get those 10 BTC instead."

Attacker mines competing Block N' including the high-fee tx.
```

### Requirements

- Very high-fee transaction (worth the orphan risk)
- Significant hashrate (to win the race)
- Quick reaction (see block, start mining alternative)

### Why It's Rare

- Need to out-mine honest miners extending Block N
- Costs the block reward if you lose
- Not worth it for normal fees

### Prevention

- **nLockTime**: Transactions can specify earliest block
- **CLTV**: Similar lock-time mechanism
- **Low fees**: Don't create tempting targets

---

## Transaction Pinning

An attack relevant to Layer 2 protocols like [Lightning](/docs/lightning).

### How It Works

1. Attacker creates a low-fee transaction spending the same output
2. Transaction is large, making CPFP expensive
3. Victim's transaction can't confirm
4. Time-sensitive protocols (Lightning) may fail

### Impact on Lightning

Lightning channels have time-locked transactions. If these can't confirm:

- Attacker might steal funds
- Force-close may fail
- Victim loses money

### Defenses

- **Package relay**: Let related transactions propagate together
- **Anchor outputs**: Pre-planned fee-bumping mechanisms
- **v3 transactions**: New policy to limit pinning

---

## Time-Warp Attack

Exploiting timestamp manipulation over difficulty adjustment periods.

### How It Works

Difficulty adjusts every 2016 blocks based on timestamps.

```
Normal: 2016 blocks in 2 weeks → difficulty unchanged

Attack:
1. Set first block timestamp = minimum allowed
2. Set last block timestamp = maximum allowed
3. Period appears longer than 2 weeks
4. Difficulty decreases artificially
5. Mine faster, get more rewards
```

### Requirements

- Majority hashrate (to control timestamps)
- Patience (takes many difficulty periods)
- Coordination (all block timestamps must be manipulated)

### Why It's Theoretical

- Requires 51% hashrate (major attack already)
- Slow payoff (months to exploit)
- Easily detected
- Could be fixed with soft fork

---

## Eclipse Attack

Isolating a node from the real network.

### How It Works

1. Attacker surrounds victim with malicious nodes
2. Victim only connects to attacker's nodes
3. Attacker feeds victim a fake chain
4. Victim accepts invalid transactions

### Impact

- Victim might accept unconfirmed transactions
- Victim might mine on wrong chain
- Victim might accept double-spends

### Defenses

- **More connections**: Connect to many diverse peers
- **DNS seeds**: Use multiple bootstrap sources
- **Manual peering**: Add known-good peers
- **Outbound connections**: Prioritize connections you initiate

---

## Finney Attack

Named after [Hal Finney](/philosophy/history/people#hal-finney), this is a race between broadcasting blocks and transactions.

### How It Works

1. Attacker mines block containing tx spending to themselves
2. Keep block secret
3. Spend same coins at merchant (buy something)
4. Immediately broadcast secret block
5. Merchant's transaction is now invalid

### Requirements

- Find a block (significant hashrate)
- Execute purchase very quickly (before someone else finds a block)
- Merchant accepts 0-confirmation transactions

### Defense

- **Wait for confirmations**: Even 1 confirmation defeats this
- **Don't accept 0-conf**: For significant amounts

---

## Goldfinger Attack

Attack Bitcoin not for profit, but for destruction.

### Motivation

- Nation-state wanting to kill Bitcoin
- Competitor (central bank?) wanting to discredit crypto
- Ideological opposition

### Method

- Acquire massive hashrate regardless of cost
- Use it to disrupt the network
- Not trying to profit; trying to destroy

### Defense

- **Sheer scale**: 500+ EH/s is hard to match
- **[Decentralization](/philosophy/fundamentals/decentralization)**: No single point of attack
- **Adaptability**: Network can respond (emergency difficulty adjustment, algorithm change)
- **Resilience**: Bitcoin has survived many attacks and attempts

### Reality Check

This attack requires:

- Billions of dollars
- Global supply chain capture
- Sustained attack (one-time disruption isn't fatal)
- Facing legal consequences in every jurisdiction

---

## Summary

Bitcoin's mining attacks show why the security model works:

| Attack | Requirement | Profitability | Likelihood |
|--------|-------------|---------------|------------|
| 51% Attack | >50% hashrate | Usually negative | Very low |
| Selfish Mining | >25-33% hashrate | Marginal | Low |
| Block Withholding | Pool participation | Negative-sum | Low |
| Fee Sniping | High fees + hashrate | Rarely worthwhile | Very low |
| Time-Warp | 51% + patience | Possible | Theoretical |
| Eclipse | Network control | Situation-specific | Possible |

**The key insight**: Bitcoin is protected by economics, not just cryptography. Attacks are possible but rarely profitable.

Most attacks require:
- Enormous capital expenditure
- Destroying the value of your investment
- Obvious detection
- Criminal liability

Honest mining is almost always more profitable than attacking.

---

## Related Topics

- [Proof-of-Work](/docs/mining/proof-of-work) - The security mechanism
- [Mining Economics](/docs/mining/economics) - Why honest mining pays
- [Difficulty Adjustment](/docs/mining/difficulty) - How network responds
- [Consensus Mechanism](/docs/bitcoin/consensus) - How Bitcoin achieves agreement

---

## Resources

- [Selfish Mining Paper](https://www.cs.cornell.edu/~ie53/publications/btcProcFC.pdf) - Original academic analysis
- [Nakamoto Institute Library](https://nakamotoinstitute.org/library/) - Bitcoin and security model resources

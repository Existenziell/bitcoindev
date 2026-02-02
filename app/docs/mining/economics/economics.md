# Mining Economics

Understanding the economics of Bitcoin mining is essential for anyone considering participating in the network. This page covers the revenue sources, cost factors, and profitability calculations that determine whether mining is financially viable.

## Block Rewards

The primary revenue source for miners is the block reward, which consists of two components:

| Component | Description | Current Value |
|-----------|-------------|---------------|
| **Block Subsidy** | New bitcoin created with each block | 3.125 BTC |
| **Transaction Fees** | Sum of fees from included transactions | 0.1-1+ BTC |

- **Current Reward**: 3.125 BTC per block (after 2024 halving)
- **Next Halving**: ~2028 (reward will be 1.5625 BTC)
- **Total Reward**: Block subsidy + transaction fees

---

## Cost Analysis

### Electricity Costs

Electricity is typically the largest ongoing cost for miners:

- **Power Consumption**: Varies by hardware (modern ASICs: 3,000-3,500W)
- **Cost Calculation**: Power (kW) × Hours × Electricity rate ($/kWh)
- **Consideration**: Mining profitability depends heavily on electricity costs
- **Regional Variation**: Electricity rates vary from $0.02 to $0.30+ per kWh

### Hardware Costs

- **ASIC Purchase**: $2,000–$15,000+ per unit
- **Depreciation**: Hardware loses value as newer, more efficient models release
- **Lifespan**: Typically 2-4 years of competitive operation
- **Maintenance**: Fans, power supplies may need replacement

### Other Costs

- **Cooling**: Air conditioning or immersion cooling systems
- **Facility**: Rent, construction, or space allocation
- **Internet**: Reliable, low-latency connection
- **Personnel**: Monitoring and maintenance staff (for larger operations)

---

## Profitability Calculation

Mining profitability depends on several factors. Here's how to calculate expected returns:

:::code-group
```rust
/// Mining profitability calculator
/// 
/// Calculates daily profit based on hardware specs and costs.

struct MiningCalculator {
    hash_rate_th: f64,      // Hashrate in TH/s
    power_watts: f64,        // Power consumption in watts
    electricity_rate: f64,   // $/kWh
    pool_fee_percent: f64,   // Pool fee percentage (e.g., 2.0 for 2%)
    btc_price: f64,          // Current BTC price in USD
    network_hash_rate_eh: f64, // Network hashrate in EH/s
    block_reward: f64,       // Block reward in BTC
}

impl MiningCalculator {
    /// Calculate daily revenue in BTC
    fn daily_btc_revenue(&self) -> f64 {
        // Blocks per day
        let blocks_per_day = 144.0;
        
        // Your share of the network (TH/s vs EH/s = 1e6 ratio)
        let network_share = self.hash_rate_th / (self.network_hash_rate_eh * 1_000_000.0);
        
        // Daily BTC before pool fees
        let gross_btc = network_share * blocks_per_day * self.block_reward;
        
        // After pool fees
        gross_btc * (1.0 - self.pool_fee_percent / 100.0)
    }
    
    /// Calculate daily electricity cost in USD
    fn daily_electricity_cost(&self) -> f64 {
        let kwh_per_day = (self.power_watts / 1000.0) * 24.0;
        kwh_per_day * self.electricity_rate
    }
    
    /// Calculate daily profit in USD
    fn daily_profit(&self) -> f64 {
        let revenue = self.daily_btc_revenue() * self.btc_price;
        let cost = self.daily_electricity_cost();
        revenue - cost
    }
    
    /// Calculate break-even electricity rate
    fn break_even_electricity_rate(&self) -> f64 {
        let daily_revenue = self.daily_btc_revenue() * self.btc_price;
        let kwh_per_day = (self.power_watts / 1000.0) * 24.0;
        daily_revenue / kwh_per_day
    }
}

fn main() {
    let calc = MiningCalculator {
        hash_rate_th: 140.0,        // Antminer S19 XP: 140 TH/s
        power_watts: 3010.0,        // 3010W consumption
        electricity_rate: 0.05,     // $0.05/kWh
        pool_fee_percent: 2.0,      // 2% pool fee
        btc_price: 60_000.0,        // $60,000 per BTC
        network_hash_rate_eh: 700.0, // 700 EH/s
        block_reward: 3.125,
    };
    
    println!("Daily BTC: {:.8} BTC", calc.daily_btc_revenue());
    println!("Daily Revenue: ${:.2}", calc.daily_btc_revenue() * calc.btc_price);
    println!("Daily Electricity: ${:.2}", calc.daily_electricity_cost());
    println!("Daily Profit: ${:.2}", calc.daily_profit());
    println!("Break-even rate: ${:.4}/kWh", calc.break_even_electricity_rate());
}
```

```python
class MiningCalculator:
    """
    Mining profitability calculator.
    Calculates daily profit based on hardware specs and costs.
    """
    
    def __init__(
        self,
        hash_rate_th: float,        # Hashrate in TH/s
        power_watts: float,          # Power consumption in watts
        electricity_rate: float,     # $/kWh
        pool_fee_percent: float,     # Pool fee percentage
        btc_price: float,            # Current BTC price in USD
        network_hash_rate_eh: float, # Network hashrate in EH/s
        block_reward: float = 3.125  # Block reward in BTC
    ):
        self.hash_rate_th = hash_rate_th
        self.power_watts = power_watts
        self.electricity_rate = electricity_rate
        self.pool_fee_percent = pool_fee_percent
        self.btc_price = btc_price
        self.network_hash_rate_eh = network_hash_rate_eh
        self.block_reward = block_reward
    
    def daily_btc_revenue(self) -> float:
        """Calculate daily revenue in BTC."""
        blocks_per_day = 144
        
        # Your share of the network (TH/s vs EH/s = 1e6 ratio)
        network_share = self.hash_rate_th / (self.network_hash_rate_eh * 1_000_000)
        
        # Daily BTC before pool fees
        gross_btc = network_share * blocks_per_day * self.block_reward
        
        # After pool fees
        return gross_btc * (1 - self.pool_fee_percent / 100)
    
    def daily_electricity_cost(self) -> float:
        """Calculate daily electricity cost in USD."""
        kwh_per_day = (self.power_watts / 1000) * 24
        return kwh_per_day * self.electricity_rate
    
    def daily_profit(self) -> float:
        """Calculate daily profit in USD."""
        revenue = self.daily_btc_revenue() * self.btc_price
        cost = self.daily_electricity_cost()
        return revenue - cost
    
    def break_even_electricity_rate(self) -> float:
        """Calculate break-even electricity rate in $/kWh."""
        daily_revenue = self.daily_btc_revenue() * self.btc_price
        kwh_per_day = (self.power_watts / 1000) * 24
        return daily_revenue / kwh_per_day

# Example: Antminer S19 XP
calc = MiningCalculator(
    hash_rate_th=140.0,         # 140 TH/s
    power_watts=3010.0,         # 3010W
    electricity_rate=0.05,      # $0.05/kWh
    pool_fee_percent=2.0,       # 2% pool fee
    btc_price=60_000.0,         # $60,000 per BTC
    network_hash_rate_eh=700.0  # 700 EH/s
)

print(f"Daily BTC: {calc.daily_btc_revenue():.8f} BTC")
print(f"Daily Revenue: ${calc.daily_btc_revenue() * calc.btc_price:.2f}")
print(f"Daily Electricity: ${calc.daily_electricity_cost():.2f}")
print(f"Daily Profit: ${calc.daily_profit():.2f}")
print(f"Break-even rate: ${calc.break_even_electricity_rate():.4f}/kWh")
```

```cpp
#include <iostream>
#include <iomanip>

/**
 * Mining profitability calculator.
 * Calculates daily profit based on hardware specs and costs.
 */
class MiningCalculator {
private:
    double hash_rate_th;        // Hashrate in TH/s
    double power_watts;         // Power consumption in watts
    double electricity_rate;    // $/kWh
    double pool_fee_percent;    // Pool fee percentage
    double btc_price;           // Current BTC price in USD
    double network_hash_rate_eh; // Network hashrate in EH/s
    double block_reward;        // Block reward in BTC

public:
    MiningCalculator(double hash_rate_th, double power_watts,
                     double electricity_rate, double pool_fee_percent,
                     double btc_price, double network_hash_rate_eh,
                     double block_reward = 3.125)
        : hash_rate_th(hash_rate_th), power_watts(power_watts),
          electricity_rate(electricity_rate), pool_fee_percent(pool_fee_percent),
          btc_price(btc_price), network_hash_rate_eh(network_hash_rate_eh),
          block_reward(block_reward) {}

    /** Calculate daily revenue in BTC */
    double dailyBtcRevenue() const {
        const double blocks_per_day = 144.0;
        
        // Your share of the network (TH/s vs EH/s = 1e6 ratio)
        double network_share = hash_rate_th / (network_hash_rate_eh * 1000000.0);
        
        // Daily BTC before pool fees
        double gross_btc = network_share * blocks_per_day * block_reward;
        
        // After pool fees
        return gross_btc * (1.0 - pool_fee_percent / 100.0);
    }

    /** Calculate daily electricity cost in USD */
    double dailyElectricityCost() const {
        double kwh_per_day = (power_watts / 1000.0) * 24.0;
        return kwh_per_day * electricity_rate;
    }

    /** Calculate daily profit in USD */
    double dailyProfit() const {
        double revenue = dailyBtcRevenue() * btc_price;
        double cost = dailyElectricityCost();
        return revenue - cost;
    }

    /** Calculate break-even electricity rate in $/kWh */
    double breakEvenElectricityRate() const {
        double daily_revenue = dailyBtcRevenue() * btc_price;
        double kwh_per_day = (power_watts / 1000.0) * 24.0;
        return daily_revenue / kwh_per_day;
    }
};

int main() {
    // Example: Antminer S19 XP
    MiningCalculator calc(
        140.0,    // 140 TH/s
        3010.0,   // 3010W
        0.05,     // $0.05/kWh
        2.0,      // 2% pool fee
        60000.0,  // $60,000 per BTC
        700.0     // 700 EH/s
    );

    std::cout << std::fixed << std::setprecision(8);
    std::cout << "Daily BTC: " << calc.dailyBtcRevenue() << " BTC" << std::endl;
    
    std::cout << std::setprecision(2);
    std::cout << "Daily Revenue: $" << calc.dailyBtcRevenue() * 60000.0 << std::endl;
    std::cout << "Daily Electricity: $" << calc.dailyElectricityCost() << std::endl;
    std::cout << "Daily Profit: $" << calc.dailyProfit() << std::endl;
    
    std::cout << std::setprecision(4);
    std::cout << "Break-even rate: $" << calc.breakEvenElectricityRate() << "/kWh" << std::endl;

    return 0;
}
```

```go
package main

import "fmt"

// MiningCalculator calculates mining profitability based on hardware specs and costs.
type MiningCalculator struct {
	HashRateTh        float64 // Hashrate in TH/s
	PowerWatts        float64 // Power consumption in watts
	ElectricityRate   float64 // $/kWh
	PoolFeePercent    float64 // Pool fee percentage
	BTCPrice          float64 // Current BTC price in USD
	NetworkHashRateEh float64 // Network hashrate in EH/s
	BlockReward       float64 // Block reward in BTC
}

func NewMiningCalculator(hashRateTh, powerWatts, electricityRate, poolFeePercent, btcPrice, networkHashRateEh, blockReward float64) *MiningCalculator {
	return &MiningCalculator{
		HashRateTh:        hashRateTh,
		PowerWatts:        powerWatts,
		ElectricityRate:   electricityRate,
		PoolFeePercent:    poolFeePercent,
		BTCPrice:          btcPrice,
		NetworkHashRateEh: networkHashRateEh,
		BlockReward:       blockReward,
	}
}

// DailyBtcRevenue calculates daily revenue in BTC
func (m *MiningCalculator) DailyBtcRevenue() float64 {
	blocksPerDay := 144.0
	
	// Your share of the network (TH/s vs EH/s = 1e6 ratio)
	networkShare := m.HashRateTh / (m.NetworkHashRateEh * 1_000_000.0)
	
	// Daily BTC before pool fees
	grossBtc := networkShare * blocksPerDay * m.BlockReward
	
	// After pool fees
	return grossBtc * (1.0 - m.PoolFeePercent/100.0)
}

// DailyElectricityCost calculates daily electricity cost in USD
func (m *MiningCalculator) DailyElectricityCost() float64 {
	kwhPerDay := (m.PowerWatts / 1000.0) * 24.0
	return kwhPerDay * m.ElectricityRate
}

// DailyProfit calculates daily profit in USD
func (m *MiningCalculator) DailyProfit() float64 {
	revenue := m.DailyBtcRevenue() * m.BTCPrice
	cost := m.DailyElectricityCost()
	return revenue - cost
}

// BreakEvenElectricityRate calculates break-even electricity rate in $/kWh
func (m *MiningCalculator) BreakEvenElectricityRate() float64 {
	dailyRevenue := m.DailyBtcRevenue() * m.BTCPrice
	kwhPerDay := (m.PowerWatts / 1000.0) * 24.0
	return dailyRevenue / kwhPerDay
}

func main() {
	// Example: Antminer S19 XP
	calc := NewMiningCalculator(
		140.0,    // 140 TH/s
		3010.0,   // 3010W
		0.05,     // $0.05/kWh
		2.0,      // 2% pool fee
		60_000.0, // $60,000 per BTC
		700.0,    // 700 EH/s
		3.125,    // 3.125 BTC block reward
	)
	
	fmt.Printf("Daily BTC: %.8f BTC\n", calc.DailyBtcRevenue())
	fmt.Printf("Daily Revenue: $%.2f\n", calc.DailyBtcRevenue()*calc.BTCPrice)
	fmt.Printf("Daily Electricity: $%.2f\n", calc.DailyElectricityCost())
	fmt.Printf("Daily Profit: $%.2f\n", calc.DailyProfit())
	fmt.Printf("Break-even rate: $%.4f/kWh\n", calc.BreakEvenElectricityRate())
}
```

```javascript
/**
 * Mining profitability calculator.
 * Calculates daily profit based on hardware specs and costs.
 */
class MiningCalculator {
    /**
     * @param {number} hashRateTh - Hashrate in TH/s
     * @param {number} powerWatts - Power consumption in watts
     * @param {number} electricityRate - $/kWh
     * @param {number} poolFeePercent - Pool fee percentage
     * @param {number} btcPrice - Current BTC price in USD
     * @param {number} networkHashRateEh - Network hashrate in EH/s
     * @param {number} blockReward - Block reward in BTC (default 3.125)
     */
    constructor(hashRateTh, powerWatts, electricityRate, poolFeePercent,
                btcPrice, networkHashRateEh, blockReward = 3.125) {
        this.hashRateTh = hashRateTh;
        this.powerWatts = powerWatts;
        this.electricityRate = electricityRate;
        this.poolFeePercent = poolFeePercent;
        this.btcPrice = btcPrice;
        this.networkHashRateEh = networkHashRateEh;
        this.blockReward = blockReward;
    }

    /** Calculate daily revenue in BTC */
    dailyBtcRevenue() {
        const blocksPerDay = 144;
        
        // Your share of the network (TH/s vs EH/s = 1e6 ratio)
        const networkShare = this.hashRateTh / (this.networkHashRateEh * 1_000_000);
        
        // Daily BTC before pool fees
        const grossBtc = networkShare * blocksPerDay * this.blockReward;
        
        // After pool fees
        return grossBtc * (1 - this.poolFeePercent / 100);
    }

    /** Calculate daily electricity cost in USD */
    dailyElectricityCost() {
        const kwhPerDay = (this.powerWatts / 1000) * 24;
        return kwhPerDay * this.electricityRate;
    }

    /** Calculate daily profit in USD */
    dailyProfit() {
        const revenue = this.dailyBtcRevenue() * this.btcPrice;
        const cost = this.dailyElectricityCost();
        return revenue - cost;
    }

    /** Calculate break-even electricity rate in $/kWh */
    breakEvenElectricityRate() {
        const dailyRevenue = this.dailyBtcRevenue() * this.btcPrice;
        const kwhPerDay = (this.powerWatts / 1000) * 24;
        return dailyRevenue / kwhPerDay;
    }
}

// Example: Antminer S19 XP
const calc = new MiningCalculator(
    140.0,    // 140 TH/s
    3010.0,   // 3010W
    0.05,     // $0.05/kWh
    2.0,      // 2% pool fee
    60_000.0, // $60,000 per BTC
    700.0     // 700 EH/s
);

console.log(`Daily BTC: ${calc.dailyBtcRevenue().toFixed(8)} BTC`);
console.log(`Daily Revenue: $${(calc.dailyBtcRevenue() * calc.btcPrice).toFixed(2)}`);
console.log(`Daily Electricity: $${calc.dailyElectricityCost().toFixed(2)}`);
console.log(`Daily Profit: $${calc.dailyProfit().toFixed(2)}`);
console.log(`Break-even rate: $${calc.breakEvenElectricityRate().toFixed(4)}/kWh`);
```
:::

---

## Mining Profitability Factors

### Network Hash Rate
- **Current**: ~700 EH/s (exahashes per second)
- **Trend**: Generally increasing over time
- **Impact**: Higher network hash rate means smaller share of rewards

### Difficulty Adjustment
- **Frequency**: Every 2016 blocks (~2 weeks)
- **Purpose**: Maintains ~10 minute block times
- **Effect**: Adjusts to network hash rate changes
- **See Also**: [Difficulty Adjustment](/docs/mining/difficulty) for detailed explanation

### Block Rewards
- **Halving Schedule**: Every 210,000 blocks (~4 years)
- **Current**: 3.125 BTC per block
- **Future**: Will decrease to 0 by ~2140

### Transaction Fees
- **Variable**: Depends on network congestion
- **Current Average**: 0.1-1+ BTC per block
- **Future**: Will become primary miner income as subsidies decrease

---

## Pool Mining Economics

### How Pool Mining Works
1. Miners contribute hash power to pool
2. Pool finds blocks collectively
3. Rewards distributed based on contribution
4. More consistent payouts than solo mining

### Pool Fees
- **Typical Fee**: 1-2% of rewards
- **Payout Threshold**: Minimum amount before payout
- **Payment Frequency**: Daily or weekly

### Payout Schemes

| Scheme | Description | Risk |
|--------|-------------|------|
| **PPS** | Pay Per Share - fixed payment per valid share | Pool bears variance |
| **FPPS** | Full PPS - includes estimated transaction fees | Pool bears variance |
| **PPLNS** | Pay Per Last N Shares - proportional when blocks found | Miner bears variance |
| **PROP** | Proportional - divide rewards by shares since last block | Miner bears variance |

See [Mining Pools](/docs/mining/pools) for detailed information on pool operations.

---

## Individual vs Pool Mining

### Solo Mining
- **Probability**: Extremely low for individual miners
- **Time to Block**: Could take years or never happen
- **Reward**: Full block reward when successful
- **Best For**: Very large operations only

### Pool Mining
- **Consistent Payouts**: Small but regular rewards
- **Reduced Variance**: Share rewards with other miners
- **Lower Barrier**: Don't need massive hash rate
- **Best For**: Most miners

---

## Related Topics

- [Bitcoin Mining](/docs/mining) - Mining architecture and concepts
- [Proof-of-Work Mechanism](/docs/mining/proof-of-work) - How mining works
- [Difficulty Adjustment](/docs/mining/difficulty) - How difficulty affects profitability
- [Mining Pools](/docs/mining/pools) - Pool operations and payout schemes
- [Hardware Evolution](/docs/mining/hardware) - Mining hardware efficiency

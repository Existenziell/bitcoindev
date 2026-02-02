# Mining Hardware Evolution

Bitcoin mining hardware has undergone a remarkable evolution, from hobbyists running CPUs on laptops to industrial-scale operations with purpose-built silicon. This progression represents one of the fastest hardware development cycles in computing history, driven by the economic incentives of proof-of-work mining.

## The Four Eras of Mining Hardware

### Era 1: CPU Mining (2009-2010)

**The Beginning**

When [Satoshi](/docs/history/people#satoshi-nakamoto) launched Bitcoin, mining was done on ordinary computer CPUs:

- **Hardware**: Intel/AMD desktop processors
- **Hashrate**: 1-20 MH/s
- **Power**: 50-150W
- **Efficiency**: ~0.1 MH/J
- **Who mined**: Cypherpunks, early adopters, Satoshi

**Why CPUs Work**

SHA-256 (Bitcoin's hash function; try the [Hash tool](/tools/hash)) is computationally simple:
- Bitwise operations (AND, OR, XOR)
- 32-bit additions
- No complex branching
- Highly parallelizable

CPUs can do this, but they're general-purpose. Most of their transistors do things irrelevant to hashing.

**The End of CPU Mining**

By late 2010, GPU mining emerged. CPU miners quickly became unprofitable and disappeared.

### Era 2: GPU Mining (2010-2013)

**The GPU Advantage**

Graphics cards excel at parallel computation:

- **Hardware**: AMD Radeon, NVIDIA GeForce
- **Hashrate**: 10-800 MH/s
- **Power**: 100-300W
- **Efficiency**: ~2-4 MH/J
- **Improvement**: 10-50x over CPUs

**Why GPUs Excel**

```
CPU: 4-8 cores, each very fast, complex
     Good at: varied tasks, branching logic
     
GPU: 1000+ cores, each slower, simpler
     Good at: same operation on many data points
     Perfect for: trying billions of nonces
```

**The GPU Mining Era**

- AMD cards preferred (better for SHA-256)
- Mining farms with racks of graphics cards
- Gaming GPU shortages began
- Some miners used OpenCL/CUDA optimizations

**Popular GPU Mining Cards**

| Card | Hashrate | Power | Era |
|------|----------|-------|-----|
| ATI Radeon 5870 | 400 MH/s | 200W | 2010 |
| AMD Radeon 7970 | 700 MH/s | 250W | 2012 |
| AMD R9 290X | 900 MH/s | 300W | 2013 |

### Era 3: FPGA Mining (2011-2013)

**Field Programmable Gate Arrays**

FPGAs are chips that can be reconfigured for specific tasks:

- **Hardware**: Xilinx, Altera FPGAs
- **Hashrate**: 100-800 MH/s
- **Power**: 20-80W
- **Efficiency**: ~10-20 MH/J
- **Improvement**: 5-10x efficiency over GPUs

**FPGA Advantages**

- Much more power efficient than GPUs
- Could be reprogrammed if algorithm changed
- Lower heat generation

**FPGA Disadvantages**

- Expensive development
- Limited availability
- Required technical expertise
- Quickly obsoleted by ASICs

**Short-Lived Era**

FPGAs were a transitional technology. The efficiency gains made ASICs inevitable and economically viable.

### Era 4: ASIC Mining (2013-Present)

**Application-Specific Integrated Circuits**

ASICs are chips designed to do one thing only: SHA-256 hashing.

- **Hardware**: Custom silicon from Bitmain, MicroBT, Canaan, etc.
- **Hashrate**: 1 TH/s → 250+ TH/s (2013 → 2024)
- **Power**: 500-3500W per unit
- **Efficiency**: 100 J/TH → 15 J/TH (improving constantly)
- **Improvement**: 1000x+ over GPUs

**Why ASICs Dominate**

```
GPU: General-purpose silicon
     - 30% doing hashing
     - 70% doing other stuff

ASIC: Purpose-built silicon
     - 100% doing hashing
     - Nothing wasted
```

Every transistor in an ASIC is dedicated to SHA-256. No graphics processing, no floating point, no cache hierarchy, just hashing.

---

## ASIC Evolution

### Generation Timeline

| Era | Example | Hashrate | Efficiency | Year |
|-----|---------|----------|------------|------|
| Gen 1 | Avalon 1 | 66 GH/s | 9,000 J/TH | 2013 |
| Gen 2 | Antminer S1 | 180 GH/s | 2,000 J/TH | 2013 |
| Gen 3 | Antminer S5 | 1.15 TH/s | 510 J/TH | 2014 |
| Gen 4 | Antminer S7 | 4.7 TH/s | 250 J/TH | 2015 |
| Gen 5 | Antminer S9 | 14 TH/s | 100 J/TH | 2016 |
| Gen 6 | Antminer S17 | 56 TH/s | 45 J/TH | 2019 |
| Gen 7 | Antminer S19 | 95 TH/s | 34 J/TH | 2020 |
| Gen 8 | Antminer S19 XP | 140 TH/s | 21 J/TH | 2022 |
| Gen 9 | Antminer S21 | 200 TH/s | 17.5 J/TH | 2023 |
| Gen 10 | Antminer S21 XP | 270 TH/s | 13.5 J/TH | 2024 |

### Process Node Shrinks

ASIC efficiency improves primarily through semiconductor process improvements:

```
2013: 110nm, 55nm
2014: 28nm
2016: 16nm
2018: 7nm
2020: 5nm
2023: 3nm (emerging)
```

Smaller transistors = less power per hash = better efficiency.

### Major Manufacturers

**Bitmain (China)**
- Market leader, Antminer series
- Founded 2013 by Jihan Wu and Micree Zhan
- Controversial: BCH support, internal conflicts
- Products: S9, S17, S19, S21 series

**MicroBT (China)**
- Strong competitor, Whatsminer series
- Founded 2016 by former Bitmain engineer
- Known for reliability
- Products: M20, M30, M50, M60 series

**Canaan (China)**
- First ASIC manufacturer (Avalon)
- Publicly traded (NASDAQ: CAN)
- Products: Avalon series

**Intel (USA)**
- Entered market 2022 with Blockscale
- Focused on efficiency
- Exited market 2024

**Bitfury (Netherlands/USA)**
- Vertically integrated (makes and uses chips)
- Known for immersion cooling
- Products: Clarke, Bitfury B8

---

## Efficiency Metrics

### Joules per Terahash (J/TH)

The key efficiency metric:

```
J/TH = Watts ÷ (Terahashes per second)

Example: 3000W machine doing 100 TH/s
Efficiency = 3000 ÷ 100 = 30 J/TH
```

Lower is better. Modern machines: 15-25 J/TH.

### Hashrate per Dollar

Consider total cost of ownership:

```
Machine cost: $5,000
Hashrate: 100 TH/s
Lifespan: 3 years

Cost per TH/s/year: $5,000 ÷ 100 ÷ 3 = $16.67
```

### Break-Even Analysis

```
Revenue per TH/day: ~$0.08 (varies with difficulty and price)
Electricity cost: $0.05/kWh
Machine efficiency: 25 J/TH

Power per TH/day: 25 J/s × 86,400 s = 2.16 MJ = 0.6 kWh
Electricity per TH/day: 0.6 × $0.05 = $0.03

Profit per TH/day: $0.08 - $0.03 = $0.05
```

---

## Industrial Mining Operations

### Scale

Modern mining farms:

- **Hashrate**: 1-50 EH/s (exahashes per second)
- **Power**: 50-500 MW
- **Machines**: 10,000-100,000+ ASICs
- **Investment**: $100M-$1B+

### Infrastructure Requirements

**Power**
- Cheap electricity is critical ($0.02-0.05/kWh ideal)
- Substations, transformers, distribution
- Often: stranded energy, renewables, flared gas

**Cooling**
- ASICs generate enormous heat
- Air cooling: fans, ducting, outdoor air
- Immersion cooling: machines submerged in dielectric fluid
- Target: 15-25°C ambient

**Networking**
- Low latency to [pools](/docs/mining/pools)
- Redundant connections
- Monitoring systems

**Security**
- Physical security (machines are valuable)
- Cybersecurity (prevent hashrate theft)
- Fire suppression

### Geographic Distribution

Mining gravitates toward cheap power:

- **United States**: Texas (wind), Georgia (nuclear), Wyoming
- **Canada**: Quebec (hydro), Alberta
- **Kazakhstan**: Coal power (declining due to regulations)
- **Russia**: Siberia (hydro, cold climate)
- **Nordic countries**: Hydro, geothermal, cold
- **Middle East**: UAE, Oman (cheap natural gas)

---

## Home Mining

### Is It Viable?

For most people in most places: marginally, or no.

**Challenges**:
- Electricity costs ($0.10-0.30/kWh residential)
- Noise (70-80 dB, like a vacuum cleaner)
- Heat (3kW space heater per machine)
- Space and ventilation

**Where It Works**:
- Cheap or free electricity
- Cold climates (use heat)
- Off-grid (solar, hydro)
- Learning/hobby purposes

### Home Mining Options

**Full ASIC**
- Antminer S9 (old, cheap, inefficient)
- Small new units (Antminer S19 nano)
- Noise and heat issues

**USB/Low-power**
- FutureBit Apollo
- Nerdminer (ESP32)
- Not profitable, but educational

**Heating Integration**
- Heatbit, Hestiia
- ASIC mining as home heating
- Heat is a feature, not waste

---

## The ASIC Trap

### No Escape

Once ASICs exist, there's no going back:

1. **ASICs are 10,000x more efficient** than GPUs
2. **GPU miners can't compete**
3. **ASIC investment creates lock-in**
4. **Algorithm changes would destroy investment**

### ASIC Resistance (Other Coins)

Some cryptocurrencies tried to resist ASICs:

- **Memory-hard algorithms**: Ethereum (Ethash), Monero (RandomX)
- **Frequent algorithm changes**: Monero
- **ASIC-resistant designs**: Often just delays ASICs

Bitcoin's position: ASICs are a feature, not a bug. They represent committed capital that can't be repurposed.

---

## Future Trends

### Efficiency Limits

Physical limits are approaching:

- **3nm/2nm processes**: Near atomic scale
- **Thermodynamic limits**: Minimum energy per computation
- **Diminishing returns**: Each generation improves less

### Immersion Cooling

Submerging ASICs in dielectric fluid:

- **Better cooling**: Removes heat more efficiently
- **Overclocking**: Run chips faster
- **Longevity**: Less thermal stress
- **Density**: More machines per space

### Stranded Energy

Mining as flexible load:

- **Flared gas**: Capture otherwise wasted energy
- **Curtailed renewables**: Use excess wind/solar
- **Grid balancing**: Ramp up/down based on demand
- **Remote locations**: Monetize energy that can't reach grid

### Vertical Integration

Large miners building their own chips:

- **Reduce reliance on Bitmain/MicroBT**
- **Custom optimizations**
- **Supply chain control**
- **Examples**: Bitfury, Intel (briefly), Block/Square (planned)

---

## Summary

The evolution of mining hardware:

| Era | Technology | Efficiency Gain | Timeline |
|-----|------------|-----------------|----------|
| 1 | CPU | Baseline | 2009-2010 |
| 2 | GPU | 10-50x | 2010-2013 |
| 3 | FPGA | 5-10x | 2011-2013 |
| 4 | ASIC | 1000x+ | 2013-present |

Key takeaways:

- **ASICs dominate** and will continue to
- **Efficiency is everything**: J/TH determines profitability
- **Industrial scale** is increasingly dominant
- **Hardware is expensive** and depreciates quickly
- **Location matters**: Cheap power wins

---

## Related Topics

- [Proof-of-Work](/docs/mining/proof-of-work) - What the hardware computes
- [Mining Economics](/docs/mining/economics) - Profitability analysis
- [Mining Pools](/docs/mining/pools) - How miners collaborate
- [Difficulty Adjustment](/docs/mining/difficulty) - How network responds to hashrate

---

## Resources

- [ASIC Miner Value](https://www.asicminervalue.com/) - Profitability calculator
- [Hashrate Index](https://hashrateindex.com/) - Mining market data
- [Cambridge Bitcoin Electricity Consumption Index](https://ccaf.io/cbeci) - Network energy use

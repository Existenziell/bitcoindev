# Pool Mining Setup and Monitoring

[Incentives](/docs/fundamentals/incentives) and [proof-of-work](/docs/glossary#proof-of-work-pow) make mining secure but also very competitive; difficulty is so high that solo mining is rarely profitable. Mining pools let participants combine [hash rate](/docs/glossary#hash-rate) and share rewards proportionally, aligning with the same incentive structure. This guide covers how to connect your mining software to a pool (e.g. Stratum), configure payouts, and monitor your contribution.

## Mining Architecture

### Components

1. **Bitcoin Node**: Provides blockchain data via RPC
2. **Mining Software**: CPU/GPU/ASIC miner
3. **Mining Pool**: Coordinates mining efforts
4. **Wallet**: Receives mining rewards

### Data Flow

```
Bitcoin Node → Mining Software → Mining Pool → Rewards
```

---

## Mining Software Setup

### CPU Mining (cpuminer-opt)

**Installation:**

```bash
# Install dependencies
brew install automake autoconf libtool curl gmp jansson

# Clone and build
git clone https://github.com/JayDDee/cpuminer-opt.git
cd cpuminer-opt
./build.sh
```

**Configuration:**

```bash
# Start mining (replace with your pool URL and credentials)
./cpuminer -a sha256d \
  -o stratum+tcp://<pool_url>:<port> \
  -u <your_bitcoin_address>.worker \
  -p <password> \
  -t <thread_count>
```

### Configuration Parameters

- **Algorithm**: `sha256d` (Bitcoin)
- **Pool URL**: Your chosen mining pool's Stratum URL
- **Username**: Your Bitcoin address + worker name
- **Password**: Pool password (often `x` for default)
- **Threads**: Number of CPU threads to use

---

## Pool Configuration

### Choosing a Pool

**Considerations:**
- **Payout method**: PPS, PPLNS, SOLO
- **Fee structure**: Pool fees
- **Minimum payout**: Minimum withdrawal amount
- **Reliability**: Uptime and stability
- **Location**: Geographic proximity

### Pool Types

**Pay Per Share (PPS):**
- Fixed payment per share
- Predictable income
- Higher pool fees

**Pay Per Last N Shares (PPLNS):**
- Payment based on recent shares
- Variable income
- Lower pool fees

**Solo Mining:**
- Mine independently
- Keep full block reward
- Very low probability

---

## Monitoring Hash Rate

### Real-Time Monitoring

**Mining Software Output:**

```
[2024-01-15 10:30:45] accepted: 1/1 (100.00%), 85.23 kH/s
[2024-01-15 10:30:50] accepted: 2/2 (100.00%), 85.45 kH/s
```

**Key Metrics:**
- **Hash Rate**: Hashes per second (H/s, kH/s, MH/s)
- **Accepted Shares**: Shares accepted by pool
- **Rejected Shares**: Shares rejected (stale/invalid)
- **Efficiency**: Accepted / Total shares

### Hash Rate Calculation

```
Hash Rate = Total Hashes / Time
```

**Example:**
```
85,230 hashes in 1 second = 85.23 kH/s
```

---

## Share Submission

A share is a [proof-of-work](/docs/glossary#proof-of-work-pow) submission that:
- Meets pool [difficulty](/docs/glossary#difficulty) (lower than network difficulty)
- Proves mining work was done
- Entitles miner to proportional reward

### Share Difficulty

**Pool Difficulty:**
- Lower than network difficulty
- Allows more frequent shares
- Enables proportional rewards

**Network Difficulty:**
- Actual Bitcoin network difficulty
- Must be met to find block
- Very high (currently ~80T)

### Share Acceptance

**Accepted Share:**
- Meets pool difficulty
- Valid proof-of-work
- Counts toward rewards

**Rejected Share:**
- Stale (block already found)
- Invalid proof-of-work
- Doesn't count toward rewards

---

## Reward Calculation

### Proportional Rewards

**PPLNS Example:**
```
Total pool hash rate: 100 PH/s
Your hash rate: 100 kH/s
Your contribution: 0.000001%

Block reward: 3.125 BTC + fees
Your share: 3.125 BTC × 0.000001% = 0.00003125 BTC
```

### Payout Schedule

**Factors:**
- Pool payout method
- Minimum payout threshold
- Pool fees
- Network confirmation requirements

**Typical Schedule:**
- Daily or weekly payouts
- Minimum 0.001 BTC
- After 100+ confirmations

---

## Educational Value

### What You Learn

1. **Proof-of-Work**: How mining works
2. **Hash Functions**: SHA256D algorithm
3. **Network Difficulty**: How difficulty adjusts
4. **Pool Coordination**: How pools work
5. **Economic Incentives**: Mining economics

### Technical Concepts

- **Block Headers**: 80-byte mining target
- **Nonce Space**: 4.3 billion possible values
- **Merkle Trees**: Transaction organization
- **Difficulty Target**: Network-wide target
- **Block Rewards**: Miner compensation

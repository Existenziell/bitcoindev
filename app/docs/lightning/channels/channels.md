# Lightning Payment Channels

Payment channels are the fundamental building block of the Lightning Network. They enable off-chain transactions between two parties with on-chain settlement. A payment channel is a 2-of-2 multisig address that locks Bitcoin between two parties. The parties can update the channel balance off-chain without broadcasting to the Bitcoin network. Key properties:

- **2-of-2 Multisig**: Both parties must sign to spend
- **Off-Chain Updates**: Balance changes happen instantly without blockchain transactions
- **On-Chain Settlement**: Final state broadcast to Bitcoin when closing
- **Bidirectional**: Payments can flow in both directions

---

## Channel Lifecycle

### 1. Channel Opening

**Funding Transaction:**
- Creates 2-of-2 multisig output
- Locks Bitcoin from one or both parties
- Broadcast to Bitcoin network
- Wait for confirmation (typically 3-6 blocks)

```mermaid
flowchart LR
  A1[Alice and Bob agree]
  A2[Create funding tx 2-of-2 multisig]
  A3[Exchange initial commitments]
  A4[Broadcast funding tx]
  A5[Wait for confirmation]
  A6[Channel active]
  A1 --> A2 --> A3 --> A4 --> A5 --> A6
```

### 2. Channel Active

**Off-Chain Updates:**
- Parties exchange signed commitment transactions
- Each update reflects new balance distribution
- No blockchain transaction needed
- Instant and free

```mermaid
sequenceDiagram
  participant Alice
  participant Bob
  Alice->>Bob: New commitment: Alice 40k, Bob 60k
  Bob->>Alice: Signatures on new commitments
  Alice->>Bob: Revocation secrets for old state
  Note over Alice,Bob: Balance updated off-chain
```

### 3. Channel Closing

**Closing Options:**

| Type | Description | Speed | Cost |
|------|-------------|-------|------|
| Cooperative | Both parties agree | Fast | Low |
| Force Close | Unilateral broadcast | Slow (timelock) | Higher |
| Breach/Penalty | Punish cheating attempt | Varies | Attacker loses all |

---

## Commitment Transactions

Each commitment transaction represents the current channel state:

```mermaid
flowchart TD
  Commit[Commitment Transaction]
  In[Input: Funding tx output 2-of-2 multisig]
  Commit --> In
  Commit --> O1[Alice balance to_local or to_remote]
  Commit --> O2[Bob balance to_local or to_remote]
  Commit --> O3[Any pending HTLCs]
```

### Asymmetric Commitments

Each party holds a different version of the commitment transaction:

- **Alice's version**: Her output has a timelock (revocable)
- **Bob's version**: His output has a timelock (revocable)

This asymmetry enables the revocation mechanism.

### Revocation Mechanism

When the channel state updates:

1. Create new commitment transactions
2. Exchange signatures
3. Exchange revocation secrets for old state
4. Old commitments become toxic (broadcasting = penalty)

---

## Channel Balance Queries

:::code-group
```rust
use ldk_node::Node;

/// Query channel balances using LDK
fn get_channel_balances(node: &Node) -> (u64, u64) {
    let channels = node.list_channels();
    
    let mut local_balance_msat: u64 = 0;
    let mut remote_balance_msat: u64 = 0;
    
    for channel in channels {
        local_balance_msat += channel.balance_msat;
        // Remote balance = capacity - local - pending HTLCs
        let capacity_msat = channel.channel_value_sats * 1000;
        remote_balance_msat += capacity_msat.saturating_sub(channel.balance_msat);
    }
    
    (local_balance_msat, remote_balance_msat)
}
```

```python
import subprocess
import json

def get_channel_balances() -> dict:
    """Query channel balances using lncli."""
    result = subprocess.run(
        ["lncli", "channelbalance"],
        capture_output=True,
        text=True,
        check=True
    )
    balance = json.loads(result.stdout)
    
    return {
        "local_balance_sat": int(balance.get("local_balance", {}).get("sat", 0)),
        "remote_balance_sat": int(balance.get("remote_balance", {}).get("sat", 0)),
        "pending_open_local": int(balance.get("pending_open_local_balance", {}).get("sat", 0)),
    }

# Example usage
balances = get_channel_balances()
print(f"Local: {balances['local_balance_sat']} sats")
print(f"Remote: {balances['remote_balance_sat']} sats")
```

```cpp
#include <iostream>
#include <cstdint>

struct ChannelBalance {
    uint64_t local_balance_msat;
    uint64_t remote_balance_msat;
    uint64_t capacity_msat;
    
    double local_ratio() const {
        if (capacity_msat == 0) return 0.0;
        return static_cast<double>(local_balance_msat) / capacity_msat;
    }
    
    bool is_balanced(double threshold = 0.2) const {
        double ratio = local_ratio();
        return ratio >= threshold && ratio <= (1.0 - threshold);
    }
};

void print_channel_balance(const ChannelBalance& balance) {
    std::cout << "Local:  " << balance.local_balance_msat / 1000 << " sats\n";
    std::cout << "Remote: " << balance.remote_balance_msat / 1000 << " sats\n";
    std::cout << "Ratio:  " << (balance.local_ratio() * 100) << "% local\n";
    std::cout << "Balanced: " << (balance.is_balanced() ? "Yes" : "No") << "\n";
}
```

```go
package main

import (
	"encoding/json"
	"fmt"
	"os/exec"
)

type ChannelBalance struct {
	LocalBalance  BalanceInfo `json:"local_balance"`
	RemoteBalance BalanceInfo `json:"remote_balance"`
}

type BalanceInfo struct {
	Sat int64 `json:"sat"`
}

func getChannelBalances() (*ChannelBalance, error) {
	// Query channel balances using lncli
	cmd := exec.Command("lncli", "channelbalance")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var balance ChannelBalance
	if err := json.Unmarshal(output, &balance); err != nil {
		return nil, err
	}

	return &balance, nil
}

func main() {
	balance, err := getChannelBalances()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Printf("Local: %d sats\n", balance.LocalBalance.Sat)
	fmt.Printf("Remote: %d sats\n", balance.RemoteBalance.Sat)
}
```

```javascript
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Query channel balances using lncli
 * @returns {Promise<{localBalance: bigint, remoteBalance: bigint}>}
 */
async function getChannelBalances() {
    const { stdout } = await execPromise('lncli channelbalance --macaroonpath=/path/to/admin.macaroon');
    const balance = JSON.parse(stdout);
    
    return {
        localBalance: BigInt(balance.local_balance?.sat || 0),
        remoteBalance: BigInt(balance.remote_balance?.sat || 0),
        pendingOpen: BigInt(balance.pending_open_local_balance?.sat || 0),
    };
}

// Example usage
getChannelBalances().then(balance => {
    console.log(`Local: ${balance.localBalance} sats`);
    console.log(`Remote: ${balance.remoteBalance} sats`);
});
```
:::

---

## Channel Capacity and Liquidity

### Total Capacity

Channel capacity equals the funding amount:

```text
Alice funds: 100,000 sats
Bob funds: 0 sats (single-funded)
Total capacity: 100,000 sats
```

### Liquidity Direction

For routing payments, liquidity must exist in the payment direction:

| Direction | Requirement |
|-----------|-------------|
| Alice → Bob | Alice needs outbound liquidity |
| Bob → Alice | Bob needs outbound liquidity |

### Inbound vs Outbound Liquidity

- **Outbound**: Funds you can send (your channel balance)
- **Inbound**: Funds you can receive (peer's channel balance)

New nodes often struggle with inbound liquidity since opening channels only provides outbound.

### Liquidity Management

To receive payments or [route](/docs/lightning/routing) effectively, you need **inbound** [liquidity](/docs/lightning/channels#inbound-vs-outbound-liquidity). To send or route in the other direction, you need **outbound** [liquidity](/docs/lightning/channels#inbound-vs-outbound-liquidity). Common ways to adjust it:

- **Circular rebalancing**: Pay yourself (e.g., between your own [channels](/docs/lightning/channels) or via a loop) to move [liquidity](/docs/lightning/channels#inbound-vs-outbound-liquidity) from one side to the other.
- **Submarine swaps / liquidity marketplaces**: Use a service to swap on-chain BTC for [Lightning](/docs/lightning) [inbound](/docs/lightning/channels#inbound-vs-outbound-liquidity) (or the reverse), or to buy/sell [channel](/docs/lightning/channels) capacity.
- **Liquidity ads (e.g., [BOLT 12](https://github.com/lightning/bolts) or implementation-specific)**: Some nodes advertise that they want to buy or sell [inbound](/docs/lightning/channels#inbound-vs-outbound-liquidity) or [outbound](/docs/lightning/channels#inbound-vs-outbound-liquidity) [liquidity](/docs/lightning/channels#inbound-vs-outbound-liquidity); you can open [channels](/docs/lightning/channels) or [splice](/docs/lightning/channels#channel-splicing) with them.
- **[Splicing](/docs/lightning/channels#channel-splicing)**: Add or remove on-chain capacity to an existing [channel](/docs/lightning/channels) to rebalance.

---

## Channel Splicing

**Splicing** (as specified in the Lightning [BOLT](https://github.com/lightning/bolts) process) allows you to **add or remove on-chain capacity** to or from an existing [channel](/docs/lightning/channels) **without closing** it. That way you can top up or withdraw [liquidity](/docs/lightning/channels#channel-capacity-and-liquidity) in a single [transaction](/docs/bitcoin/transaction-lifecycle) while keeping the same channel and [HTLC](/docs/lightning/routing/htlc) state.

### How It Works

- **Splice-in**: You add an extra input (and possibly output) to a new **funding [transaction](/docs/bitcoin/transaction-lifecycle)** that spends the existing 2-of-2 multisig UTXO and creates a **new** 2-of-2 with a larger (or smaller) amount. Both parties sign; the channel capacity is updated on confirmation.
- **Splice-out**: Part of the channel [balance](/docs/lightning/channels#channel-capacity-and-liquidity) is sent to an address (yours or your peer’s) in the splice [transaction](/docs/bitcoin/transaction-lifecycle), reducing the new 2-of-2 amount.

Splicing is **dual-funded** in the sense that the splice [transaction](/docs/bitcoin/transaction-lifecycle) is cooperatively built; typically it also uses [anchor outputs](/docs/lightning/anchor-outputs) or similar so fee bumping works.

### Why Use Splicing

- **Add liquidity**: Get more [inbound](/docs/lightning/channels#inbound-vs-outbound-liquidity) or [outbound](/docs/lightning/channels#inbound-vs-outbound-liquidity) without opening a new [channel](/docs/lightning/channels) and without on-chain round-trips for a full close+reopen.
- **Withdraw liquidity**: Reduce channel capacity and free BTC on-chain without closing the [channel](/docs/lightning/channels) and losing your [routing](/docs/lightning/routing) relationship.

Support for splicing varies by implementation (e.g., [Core Lightning](https://github.com/ElementsProject/lightning), [LDK](https://github.com/lightningdevkit/rust-lightning)); check your node’s documentation.

---

## Channel Types

### Public Channels

- Announced to the network gossip
- Appear in the public channel graph
- Can route payments for others
- Required for earning routing fees

### Private (Unannounced) Channels

- Not broadcast to the network
- Only known to the two parties
- Can still be used with route hints
- Better privacy for end users

---

## Channel Security

### Revocation Keys

Each commitment state has an associated revocation key. If a party broadcasts an old state, the counterparty can:

1. Detect the old commitment on-chain
2. Use the revocation secret to construct a penalty transaction
3. Claim all funds in the channel

### Timelocks

Force-closed channels have timelocks (typically 144-2016 blocks) that give the counterparty time to detect and punish cheating attempts.

### Watchtowers

Third-party services that monitor the blockchain for breach attempts when your node is offline. See [Watchtowers](/docs/lightning/watchtowers) for details.

---

## Common Issues

### Unbalanced Channels

**Problem**: All funds on one side prevents bidirectional payments.

**Solutions**:
- Circular rebalancing (pay yourself through the network)
- Submarine swaps (on-chain ↔ off-chain)
- Open additional channels
- Use liquidity marketplaces

### Stuck Channels

**Problem**: Cannot cooperatively close (peer offline/unresponsive).

**Solution**: Force close and wait for timelock expiry.

### Insufficient Capacity

**Problem**: Payment larger than available channel balance.

**Solutions**:
- Use [Multi-Part Payments (MPP)](/docs/lightning/routing/mpp)
- Open larger channel
- Find alternative route

---

## Summary

Payment channels enable:

- **Instant transactions**: No block confirmation needed
- **Minimal fees**: Fraction of on-chain costs
- **Privacy**: Off-chain activity not visible on blockchain
- **Scalability**: Unlimited payments per channel
- **Security**: Cryptographic enforcement via commitment/revocation

---

## Related Topics

- [Routing Fees](/docs/lightning/routing), [HTLCs](/docs/lightning/routing/htlc), and [Multi-Part Payments](/docs/lightning/routing/mpp) - How payments route through channels
- [Watchtowers](/docs/lightning/watchtowers) - Third-party channel monitoring
- [Anchor Outputs](/docs/lightning/anchor-outputs) - Modern channel format for fee bumping and splicing

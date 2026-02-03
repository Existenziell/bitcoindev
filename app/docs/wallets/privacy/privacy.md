# Privacy Techniques

Bitcoin transactions are pseudonymous, not anonymous. Various techniques can improve privacy by breaking the linkability between transactions and making blockchain analysis more difficult.

## Privacy Challenges

### Blockchain Analysis

All transactions are public:

```text
Public Information:
- Transaction amounts
- Input/output addresses
- Transaction graph
- Timing patterns
```

### Common-Input-Ownership Heuristic

Analysts assume all inputs to a transaction belong to the same entity:

```text
Transaction:
Input 1: Address A
Input 2: Address B
Input 3: Address C

Assumption: A, B, and C are all controlled by same person
```

---

## Privacy Techniques

### 1. CoinJoin

**CoinJoin** combines multiple transactions into one:

```text
Standard Transaction:
Alice → Bob: 1 BTC

CoinJoin Transaction:
Alice + Charlie + Dave → Bob + Eve + Frank: Mixed amounts
```

**Benefits**:
- Breaks common-input-ownership heuristic
- Hides individual transaction amounts
- Makes analysis difficult

**Implementations**:
- **Wasabi Wallet**: WabiSabi protocol
- **JoinMarket**: Maker-taker model
- **Samourai Wallet**: Whirlpool

### 2. Payjoin (P2EP)

**Payjoin** involves both sender and receiver:

```text
Standard Transaction:
Alice (inputs) → Bob (output)

Payjoin Transaction:
Alice (inputs) + Bob (inputs) → Alice (change) + Bob (output)
```

**Benefits**:
- Breaks common-input-ownership
- Looks like normal transaction
- No coordination overhead

### 3. Address Reuse Avoidance

**Never reuse addresses**:

```text
Bad:
- Receive multiple payments to same address
- Links all payments together
- Reveals transaction history

Good:
- Generate new address for each payment
- HD wallets do this automatically
- Better privacy
```

### 4. Coin Selection

**Privacy-aware coin selection**:

```text
Strategies:
- Avoid linking transactions
- Use smaller UTXOs when possible
- Don't consolidate unnecessarily
- Consider timing patterns
```

---

## Code Examples

### CoinJoin Implementation

:::code-group
```rust
use bitcoin::{Transaction, TxIn, TxOut};

struct CoinJoinParticipant {
    inputs: Vec<TxIn>,
    outputs: Vec<TxOut>,
}

fn create_coinjoin(participants: Vec<CoinJoinParticipant>) -> Transaction {
    let mut tx = Transaction::default();
    
    // Collect all inputs
    for participant in &participants {
        tx.input.extend(participant.inputs.clone());
    }
    
    // Collect all outputs (shuffled)
    let mut all_outputs: Vec<TxOut> = participants
        .iter()
        .flat_map(|p| p.outputs.clone())
        .collect();
    
    // Shuffle outputs for privacy
    use rand::seq::SliceRandom;
    let mut rng = rand::thread_rng();
    all_outputs.shuffle(&mut rng);
    
    tx.output = all_outputs;
    tx
}
```

```python
import random
from bitcoin.core import CTransaction, CTxIn, CTxOut

def create_coinjoin(participants):
    """Create a CoinJoin transaction."""
    tx = CTransaction()
    
    # Collect all inputs
    for participant in participants:
        tx.vin.extend(participant.inputs)
    
    # Collect and shuffle outputs
    all_outputs = []
    for participant in participants:
        all_outputs.extend(participant.outputs)
    
    random.shuffle(all_outputs)  # Shuffle for privacy
    tx.vout = all_outputs
    
    return tx
```

```cpp
#include <bitcoin/bitcoin.hpp>
#include <algorithm>
#include <random>

bc::transaction create_coinjoin(
    const std::vector<std::vector<bc::input>>& participant_inputs,
    const std::vector<std::vector<bc::output>>& participant_outputs
) {
    bc::transaction tx;
    
    // Collect all inputs
    for (const auto& inputs : participant_inputs) {
        tx.inputs().insert(tx.inputs().end(), inputs.begin(), inputs.end());
    }
    
    // Collect and shuffle outputs
    std::vector<bc::output> all_outputs;
    for (const auto& outputs : participant_outputs) {
        all_outputs.insert(all_outputs.end(), outputs.begin(), outputs.end());
    }
    
    std::random_device rd;
    std::mt19937 g(rd());
    std::shuffle(all_outputs.begin(), all_outputs.end(), g);
    
    tx.set_outputs(all_outputs);
    return tx;
}
```

```go
package main

import (
	"math/rand"
	"github.com/btcsuite/btcd/wire"
)

func createCoinJoin(
	participantInputs [][]*wire.TxIn,
	participantOutputs [][]*wire.TxOut,
) *wire.MsgTx {
	tx := wire.NewMsgTx(wire.TxVersion)
	
	// Collect all inputs
	for _, inputs := range participantInputs {
		for _, input := range inputs {
			tx.AddTxIn(input)
		}
	}
	
	// Collect and shuffle outputs
	var allOutputs []*wire.TxOut
	for _, outputs := range participantOutputs {
		allOutputs = append(allOutputs, outputs...)
	}
	
	rand.Shuffle(len(allOutputs), func(i, j int) {
		allOutputs[i], allOutputs[j] = allOutputs[j], allOutputs[i]
	})
	
	for _, output := range allOutputs {
		tx.AddTxOut(output)
	}
	
	return tx
}
```

```javascript
function createCoinJoin(participants) {
    const tx = new bitcoin.Transaction();
    
    // Collect all inputs
    participants.forEach(participant => {
        participant.inputs.forEach(input => {
            tx.addInput(input.hash, input.index);
        });
    });
    
    // Collect and shuffle outputs
    const allOutputs = [];
    participants.forEach(participant => {
        allOutputs.push(...participant.outputs);
    });
    
    // Shuffle for privacy
    for (let i = allOutputs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOutputs[i], allOutputs[j]] = [allOutputs[j], allOutputs[i]];
    }
    
    allOutputs.forEach(output => {
        tx.addOutput(output.address, output.value);
    });
    
    return tx;
}
```
:::

---

## Advanced Privacy

### Silent Payments (BIP 352)

**Silent Payments** enable reusable addresses without address reuse:

```text
Traditional:
- Recipient shares address
- Address reused → Privacy loss

Silent Payments:
- Recipient shares static identifier
- Sender derives unique address per payment
- No address reuse
- Better privacy
```

### Taproot Privacy

Taproot provides better privacy:

```text
Multisig Transaction:
- Key path: Looks like single-sig
- Script path: Only reveals used condition
- Other conditions hidden in MAST
```

---

## Best Practices

### For Users

1. **Use HD wallets**: Automatic address generation
2. **Avoid address reuse**: Generate new addresses
3. **Consider CoinJoin**: For high privacy needs
4. **Use Taproot**: Better privacy by default
5. **Be careful with change**: Change outputs link transactions

### For Developers

1. **Implement address rotation**: Never reuse addresses
2. **Support privacy features**: CoinJoin, Payjoin
3. **Privacy-aware coin selection**: Don't link transactions
4. **Educate users**: Explain privacy implications

---

## Limitations

### What Privacy Techniques Can't Do

1. **IP address**: Network layer still reveals IP
2. **Timing analysis**: Patterns can reveal links
3. **Amount analysis**: Large amounts are distinctive
4. **Perfect anonymity**: Not achievable on public blockchain

### Trade-offs

- **Privacy vs. Convenience**: More privacy = more complexity
- **Privacy vs. Cost**: CoinJoin has fees
- **Privacy vs. Speed**: Some techniques add delays

---

## Related Topics

- [Address Types](/docs/wallets/address-types) - Understanding addresses
- [Coin Selection](/docs/bitcoin-development/coin-selection) - Privacy-aware selection
- [Taproot](/docs/bitcoin/taproot) - Better privacy
- [Lightning Network](/docs/lightning) - Off-chain privacy

---

## Resources

- [BIP 352: Silent Payments](https://github.com/bitcoin/bips/blob/master/bip-0352.mediawiki)
- [Wasabi Wallet](https://wasabiwallet.io/) - CoinJoin implementation
- [JoinMarket](https://joinmarket.me/) - CoinJoin marketplace
